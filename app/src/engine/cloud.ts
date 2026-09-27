// Automatic encrypted cloud backup. The backup code never leaves the phone:
// id = SHA-256("id:" + code) finds the backup, key = SHA-256("key:" + code) encrypts it (AES-GCM).
import type { State } from './progression'
import { PUSH_URL } from './push'

const CODE_KEY = 'calx-backup-code'
const AT_KEY = 'calx-backup-at'
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O, 1/I/L

export const cloudAvailable = () => !!PUSH_URL

export function backupCode(): string {
  try {
    let code = localStorage.getItem(CODE_KEY)
    if (!code) {
      const bytes = crypto.getRandomValues(new Uint8Array(24))
      code = Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('').match(/.{4}/g)!.join('-')
      localStorage.setItem(CODE_KEY, code)
    }
    return code
  } catch { return '' }
}

export const lastBackupAt = () => { try { return Number(localStorage.getItem(AT_KEY)) || 0 } catch { return 0 } }

const normalize = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '')
const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0))
const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('')

async function derive(code: string) {
  const c = normalize(code), enc = new TextEncoder()
  const id = hex(await crypto.subtle.digest('SHA-256', enc.encode('id:' + c)))
  const raw = await crypto.subtle.digest('SHA-256', enc.encode('key:' + c))
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])
  return { id, key }
}

const endpoint = (path: string) => PUSH_URL.replace(/\/$/, '') + path

export async function backupNow(state: State, closing = false) {
  if (!cloudAvailable() || state.demo) return
  const code = backupCode(); if (!code) return
  const { id, key } = await derive(code)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = new TextEncoder().encode(JSON.stringify(state))
  const blob = b64(iv) + '.' + b64(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data))
  // text/plain + keepalive lets the request finish even while the app is closing
  const res = await fetch(endpoint('/backup'), { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ id, blob }), keepalive: closing && blob.length < 60000 })
  if (res.ok) { try { localStorage.setItem(AT_KEY, String(Date.now())) } catch { /* ignore */ } }
}

export async function restoreFrom(code: string): Promise<State> {
  if (!cloudAvailable()) throw new Error('Cloud backup is not connected.')
  const { id, key } = await derive(code)
  const res = await fetch(endpoint('/restore'), { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ id }) })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || 'Could not reach the backup server.')
  const [iv, ct] = String(body.blob).split('.')
  let plain: ArrayBuffer
  try { plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct)) } catch { throw new Error('That code does not match this backup.') }
  const state = JSON.parse(new TextDecoder().decode(plain)) as State
  try { localStorage.setItem(CODE_KEY, code.toUpperCase().trim()) } catch { /* ignore */ }
  return state
}

// ---- automatic: shortly after changes, and whenever the app goes to the background ----
let timer: number | undefined
let latest: State | undefined
export function autoBackup(state: State) {
  latest = state
  window.clearTimeout(timer)
  timer = window.setTimeout(() => { void backupNow(state).catch(() => {}) }, 8000)
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && latest) { window.clearTimeout(timer); void backupNow(latest, true).catch(() => {}) }
  })
}
