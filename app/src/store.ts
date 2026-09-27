import { useSyncExternalStore } from 'react'
import { DEFAULT_BREATH } from './data/breathing'
import { DEFAULT_REMINDERS } from './data/reminders'
import { DEFAULT_BODY } from './data/body'
import { DEFAULT_RULES, dayKey, type State } from './engine/progression'
import { autoBackup } from './engine/cloud'

const KEY = 'calx-state-v1'

const fresh = (): State => ({
  version: 1, onboarded: false, startDate: dayKey(), equipment: ['mat', 'bricks', 'belt', 'handles', 'dumbbell', 'gripper'],
  mastered: [], targets: {}, sessions: [], checks: {}, readiness: {}, rules: { ...DEFAULT_RULES }, breath: structuredClone(DEFAULT_BREATH),
  reminders: structuredClone(DEFAULT_REMINDERS), pushOn: false, body: structuredClone(DEFAULT_BODY),
})

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...fresh(), ...JSON.parse(raw) }
  } catch { /* fall through to a fresh state */ }
  return fresh()
}

let state = load()
const listeners = new Set<() => void>()

export function setState(fn: (s: State) => State) {
  state = fn(state)
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage full or blocked */ }
  autoBackup(state) // encrypted cloud copy a few seconds later (skipped in demo mode)
  listeners.forEach(l => l())
}

export function useStore(): State {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb) }, () => state)
}

// Ask the browser not to evict our data (matters on iOS).
navigator.storage?.persist?.().catch(() => {})

export function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `calx-backup-${dayKey()}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

export async function importBackup(file: File) {
  const data = JSON.parse(await file.text())
  if (data?.version !== 1 || !Array.isArray(data.sessions)) throw new Error('This file is not a Cal-X backup.')
  setState(() => ({ ...fresh(), ...data }))
}

export function resetAll() { setState(fresh) }

/** Replace everything with restored data (cloud restore). */
export function loadState(data: State) { setState(() => ({ ...fresh(), ...data, demo: false })) }

// ---- demo mode: park the real data, show sample data, restore on exit ----
const REAL_KEY = 'calx-real-while-demo'
export async function enterDemo() {
  const { makeDemo } = await import('./engine/demo')
  try { localStorage.setItem(REAL_KEY, JSON.stringify(state)) } catch { throw new Error('Could not save your data aside, so demo mode was not started.') }
  setState(s => makeDemo(s))
}
export function exitDemo() {
  let real: State | null = null
  try { const raw = localStorage.getItem(REAL_KEY); if (raw) real = JSON.parse(raw) } catch { /* handled below */ }
  // keep settings changed during the demo (breathing, reminders); everything else comes back
  setState(s => real ? { ...fresh(), ...real, breath: s.breath, reminders: s.reminders, pushOn: s.pushOn, demo: false } : { ...s, demo: false })
  try { localStorage.removeItem(REAL_KEY) } catch { /* ignore */ }
}
