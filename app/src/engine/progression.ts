import { ACCESSORIES, EX, TRACKS, type Equipment, type Exercise, type Track } from '../data/catalog'

// ---------- stored state ----------
export interface SetLog { value: number; rpe: number }
export interface ExerciseLog { id: string; planned: number; target: number; sets: SetLog[]; pain?: boolean }
export interface Session { id: string; date: string; minutes: number; items: ExerciseLog[] }
export interface Readiness { sleep: number; energy: number; sore: number; pain: boolean; score: number }
export interface Rules { maxRpe: number; failPct: number; lightBelow: number }

export interface State {
  version: 1
  onboarded: boolean
  startDate: string
  equipment: Equipment[]
  mastered: string[]
  targets: Record<string, number> // current working target per exercise
  sessions: Session[]
  checks: Record<string, string[]> // date -> check-off keys
  readiness: Record<string, Readiness>
  rules: Rules
}

export const DEFAULT_RULES: Rules = { maxRpe: 8, failPct: 75, lightBelow: 50 }

// ---------- dates ----------
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const parseDay = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

// ---------- skill tree ----------
export const unit = (e: Exercise) => (e.hold ? 's' : '')
export const setsFor = (e: Exercise) => (e.track ? 3 : 2)
const hasGear = (s: State, e: Exercise) => e.needs.every(n => s.equipment.includes(n))

export type NodeStatus = 'done' | 'current' | 'gear' | 'locked'
export function status(s: State, e: Exercise): NodeStatus {
  if (s.mastered.includes(e.id)) return 'done'
  const prev = e.track ? TRACKS.find(t => t.id === e.track)!.nodes[e.index - 1] : undefined
  if (prev && !s.mastered.includes(prev.id)) return 'locked'
  return hasGear(s, e) ? 'current' : 'gear'
}

/** Exercise to train for a track: first unmastered node; if that needs missing gear, keep the last mastered one. */
export function trainingNode(s: State, t: Track): Exercise {
  const i = t.nodes.findIndex(n => !s.mastered.includes(n.id))
  if (i < 0) return t.nodes[t.nodes.length - 1]
  if (!hasGear(s, t.nodes[i]) && i > 0) return t.nodes[i - 1]
  return t.nodes[i]
}

export const targetOf = (s: State, e: Exercise) => s.targets[e.id] ?? e.lo

export interface Planned { ex: Exercise; sets: number; target: number }
export function buildSession(s: State, r?: Readiness): Planned[] {
  const light = !!r && r.score < s.rules.lightBelow
  return [...TRACKS.map(t => trainingNode(s, t)), ...ACCESSORIES.filter(a => hasGear(s, a))].map(ex => ({
    ex, sets: Math.max(1, setsFor(ex) - (light ? 1 : 0)), target: targetOf(s, ex),
  }))
}

export function readinessScore(sleep: number, energy: number, sore: number) {
  return Math.round(100 * (0.4 * [0.3, 0.6, 0.9, 1][sleep] + 0.35 * energy / 4 + 0.25 * (1 - sore / 4)))
}

// ---------- coaching decision ----------
export type Tag = 'Level up' | 'Increase' | 'Hold' | 'Ease off'
export interface Decision { tag: Tag; next: number; why: string; advanceTo?: Exercise }

export function evaluate(p: Planned, sets: SetLog[], rules: Rules, pain?: boolean): Decision {
  const { ex, target } = p, U = unit(ex), step = ex.hold ? 5 : 1
  if (pain) return { tag: 'Hold', next: target, why: 'Pain flagged. No progression until it is gone. If it is sharp or lasts, see a physio or doctor.' }
  if (!sets.length) return { tag: 'Hold', next: target, why: 'Skipped. No change.' }
  const vals = sets.map(x => x.value)
  const rpe = Math.max(...sets.map(x => x.rpe))
  const total = vals.reduce((a, b) => a + b, 0)
  const planned = p.sets * target
  const pct = Math.round((total / planned) * 100)
  const allHit = vals.length >= p.sets && vals.every(v => v >= target)

  if (allHit && rpe <= rules.maxRpe) {
    if (vals.every(v => v >= ex.hi)) {
      const nxt = ex.track ? TRACKS.find(t => t.id === ex.track)!.nodes[ex.index + 1] : undefined
      return { tag: 'Level up', next: target, advanceTo: nxt,
        why: `Every set hit ${ex.hi}${U}, the top of the range, at effort ${rpe}/10 or easier. ${ex.name} is mastered.${nxt ? ` Next: ${nxt.name} at ${nxt.lo}${unit(nxt)}.` : ''}` }
    }
    const next = Math.min(ex.hi, target + (vals.every(v => v >= target + 2 * step) ? 2 * step : step))
    return { tag: 'Increase', next, why: `All ${p.sets} sets reached ${target}${U} at effort ${rpe}/10 (limit ${rules.maxRpe}). Target goes up to ${next}${U}.` }
  }
  if (allHit) return { tag: 'Hold', next: target, why: `Target hit, but effort ${rpe}/10 is above ${rules.maxRpe}. Repeat ${target}${U} until it feels controlled.` }
  if (pct < rules.failPct) {
    const next = Math.max(ex.lo, target - step)
    return { tag: 'Ease off', next, why: `${total}${U} of ${planned}${U} planned (${pct}%) is below the ${rules.failPct}% floor. ${next < target ? `Target drops to ${next}${U}.` : 'Already at the range floor. Keep it, or switch to the easier variation.'}` }
  }
  return { tag: 'Hold', next: target, why: `${total}${U} of ${planned}${U} planned (${pct}%). Close enough to keep ${target}${U}. Aim to hit every set next time.` }
}

// ---------- onboarding placement ----------
export interface Assessment { pushups: number; plankSec: number; squats: number; pike: boolean }
export function placement(a: Assessment): string[] {
  const upTo = (track: string, id: string) => {
    const nodes = TRACKS.find(t => t.id === track)!.nodes
    return nodes.slice(0, nodes.findIndex(n => n.id === id)).map(n => n.id)
  }
  const push = a.pushups === 0 ? 'knee_pu' : a.pushups <= 12 ? 'pushup' : 'deficit_pu'
  const core = a.plankSec < 30 ? 'plank' : a.plankSec < 60 ? 'hollow_hold' : 'tuck_lsit'
  const legs = a.squats < 15 ? 'bw_squat' : a.squats < 30 ? 'split_squat' : 'goblet_squat'
  const hs = a.pike ? 'elev_pike' : 'pike_pu'
  return [...upTo('push', push), ...upTo('core', core), ...upTo('legs', legs), ...upTo('handstand', hs)]
}

// ---------- derived stats ----------
export function bests(s: State): Record<string, { value: number; date: string }> {
  const out: Record<string, { value: number; date: string }> = {}
  for (const ses of s.sessions) for (const it of ses.items) for (const st of it.sets)
    if (!out[it.id] || st.value > out[it.id].value) out[it.id] = { value: st.value, date: ses.date }
  return out
}

export function lastSets(s: State, id: string): number[] | undefined {
  for (let i = s.sessions.length - 1; i >= 0; i--) {
    const it = s.sessions[i].items.find(x => x.id === id && x.sets.length)
    if (it) return it.sets.map(x => x.value)
  }
}

/** Weeks in a row (ending last full week or this week) with at least `min` strength sessions. */
export function weekStreak(s: State, min = 2, today = new Date()): number {
  const monday = (d: Date) => addDays(d, -((d.getDay() + 6) % 7))
  let wk = monday(today), streak = 0
  const count = (m: Date) => s.sessions.filter(x => { const d = parseDay(x.date); return d >= m && d < addDays(m, 7) }).length
  if (count(wk) >= min) streak++
  for (wk = addDays(wk, -7); count(wk) >= min; wk = addDays(wk, -7)) streak++
  return streak
}

export const exName = (id: string) => EX[id]?.name ?? id
