// Push reminders: permission, subscription, and syncing reminder times to the push server.
import type { Reminder } from '../data/reminders'

export const PUSH_URL: string = import.meta.env.VITE_PUSH_URL ?? ''
const VAPID_PUBLIC = 'BDHdVqsW01Wl4dpIdI4Q_dtndCdQIqJT3cy7MwJb7mNQLXTcJXwFx5SCUGLIzXCQXHH4lnetyxct85u4UsPkzmw'

export type PushSupport = 'ok' | 'no-server' | 'install-first' | 'unsupported'
export function pushSupport(): PushSupport {
  if (!PUSH_URL) return 'no-server'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    // iPhone only exposes push to apps opened from the home screen
    const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone
    return /iPhone|iPad/.test(navigator.userAgent) && !standalone ? 'install-first' : 'unsupported'
  }
  return 'ok'
}

const keyBytes = (b64: string) => Uint8Array.from(atob(b64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone

async function post(path: string, body: unknown) {
  const res = await fetch(PUSH_URL.replace(/\/$/, '') + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Reminder server error (${res.status})`)
  return res.json()
}

/** The service worker reads this copy to write the notification text (pushes carry no payload). */
export async function cacheReminders(reminders: Reminder[]) {
  try {
    const reg = await navigator.serviceWorker?.ready
    if (!reg) return
    const c = await caches.open('calx-data')
    await c.put(new URL('reminders.json', reg.scope).href, new Response(JSON.stringify(reminders), { headers: { 'Content-Type': 'application/json' } }))
  } catch { /* best effort */ }
}

/** Must be called from a tap. Returns the endpoint on success. */
export async function enablePush(reminders: Reminder[]): Promise<string> {
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Notifications are blocked. Allow them in iPhone Settings → Notifications → Cal-X.')
  const reg = await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC) })
  await cacheReminders(reminders)
  await post('/sync', { subscription: sub.toJSON(), reminders, tz: tz() })
  return sub.endpoint
}

export async function syncReminders(reminders: Reminder[]) {
  await cacheReminders(reminders)
  const reg = await navigator.serviceWorker?.ready
  const sub = await reg?.pushManager.getSubscription()
  if (sub) await post('/sync', { subscription: sub.toJSON(), reminders, tz: tz() })
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) { await post('/remove', { endpoint: sub.endpoint }).catch(() => {}); await sub.unsubscribe() }
}

export async function testPush() {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) throw new Error('Turn reminders on first.')
  await post('/test', { endpoint: sub.endpoint })
}
