import { ACCESSORIES, EX, GYM_ACCESSORIES, GYM_TRACKS, TRACKS, trackById, type Equipment, type Exercise, type Style, type Track } from '../data/catalog'
import type { BreathState } from '../data/breathing'
import type { Reminder } from '../data/reminders'
import type { Body } from '../data/body'

// ---------- stored state ----------
export interface SetLog { value: number; rpe: number; kg?: number }
export interface ExerciseLog {
  id: string; planned: number; target: number; sets: SetLog[]; pain?: boolean
  quick?: boolean // ticked on Today instead of the workout player
  unlocked?: boolean // this log mastered the exercise (undone if unticked)
  kg?: number // working weight for weighted lifts (restored if unticked)
}
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
  breath: BreathState
  reminders: Reminder[]
  pushOn: boolean
  body: Body
  demo?: boolean // sample data loaded; real data is parked in storage
  style?: Style // calisthenics (default), gym or mixed
  loads?: Record<string, number> // current working weight (kg) per weighted lift
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
  const prev = e.track ? trackById(e.track)?.nodes[e.index - 1] : undefined
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

// ---------- style: which tracks make up a session ----------
const MIXED_CALI = ['push', 'pull', 'core', 'handstand'], MIXED_GYM = ['g_squat', 'g_hinge']
export function activeTracks(s: State): Track[] {
  if (s.style === 'gym') return GYM_TRACKS
  if (s.style === 'mixed') return [...TRACKS.filter(t => MIXED_CALI.includes(t.id)), ...GYM_TRACKS.filter(t => MIXED_GYM.includes(t.id))]
  return TRACKS
}
const accessories = (s: State) => s.style === 'gym' ? GYM_ACCESSORIES : ACCESSORIES.filter(a => hasGear(s, a))

// ---------- weights ----------
export const roundTo = (kg: number, step: number) => step > 0 ? Math.max(step, Math.round(kg / step) * step) : kg
export const bodyweight = (s: State) => s.body?.weights.at(-1)?.kg ?? 70
/** Current working weight for a lift: last logged/progressed weight, else its beginner start. */
export const loadOf = (s: State, e: Exercise) => s.loads?.[e.id] ?? e.load?.start ?? 0
/** Plates per side for a 20 kg bar, e.g. [20, 5, 1.25]. */
export function plates(kg: number, bar = 20): number[] {
  let side = Math.max(0, (kg - bar) / 2); const out: number[] = []
  for (const p of [25, 20, 15, 10, 5, 2.5, 1.25]) while (side >= p - 1e-9) { out.push(p); side -= p }
  return out
}
/** Warm-up ramp for barbell lifts: empty bar, then ~50% and ~70% of the working weight. */
export function warmups(kg: number): { kg: number; reps: number }[] {
  if (kg <= 30) return [{ kg: 20, reps: 10 }]
  return [{ kg: 20, reps: 10 }, { kg: roundTo(kg * 0.5, 2.5), reps: 5 }, { kg: roundTo(kg * 0.7, 2.5), reps: 3 }].filter((w, i, a) => i === 0 || w.kg > a[i - 1].kg)
}
/** Estimated one-rep max (Epley). */
export const e1rm = (kg: number, reps: number) => Math.round(kg * (1 + reps / 30))

export interface Planned { ex: Exercise; sets: number; target: number; load?: number }
export function buildSession(s: State, r?: Readiness): Planned[] {
  const light = !!r && r.score < s.rules.lightBelow
  return [...activeTracks(s).map(t => trainingNode(s, t)), ...accessories(s)].map(ex => ({
    ex, sets: Math.max(1, setsFor(ex) - (light ? 1 : 0)), target: targetOf(s, ex), load: ex.load ? loadOf(s, ex) : undefined,
  }))
}

/** Starting point for gym lifts. experience: 0 = new, 1 = some, 2 = experienced (barbell, loads from bodyweight). */
export function gymStart(experience: number, bw: number): { mastered: string[]; loads: Record<string, number> } {
  const mastered: string[] = [], loads: Record<string, number> = {}
  for (const t of GYM_TRACKS) {
    const barbell = t.nodes.findIndex(n => n.load?.barbell)
    const i = experience === 0 ? 0 : experience === 1 ? Math.min(1, t.nodes.length - 1) : barbell >= 0 ? barbell : t.nodes.length - 1
    t.nodes.slice(0, i).forEach(n => mastered.push(n.id))
    const n = t.nodes[i]
    if (n.load) loads[n.id] = experience === 2 && n.load.bw ? roundTo(bw * n.load.bw, n.load.barbell ? 2.5 : n.load.inc || 1) : n.load.start
  }
  return { mastered, loads }
}

export function readinessScore(sleep: number, energy: number, sore: number) {
  return Math.round(100 * (0.4 * [0.3, 0.6, 0.9, 1][sleep] + 0.35 * energy / 4 + 0.25 * (1 - sore / 4)))
}

// ---------- coaching decision ----------
export type Tag = 'Level up' | 'Increase' | 'Hold' | 'Ease off'
export interface Decision { tag: Tag; next: number; why: string; advanceTo?: Exercise; nextLoad?: number }

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

  // weighted lifts: fill the rep range, then add weight and start again at the bottom of the range
  if (ex.load && ex.load.inc > 0 && p.load != null) {
    const L = p.load, inc = ex.load.inc, nxt = ex.track ? trackById(ex.track)?.nodes[ex.index + 1] : undefined
    if (allHit && rpe <= rules.maxRpe) {
      if (vals.every(v => v >= ex.hi)) {
        const up = L + inc
        if (ex.load.grad && up > ex.load.grad && nxt)
          return { tag: 'Level up', next: target, nextLoad: L, advanceTo: nxt, why: `${L} kg for ${ex.hi} reps on every set. You're ready for ${nxt.name}.` }
        return { tag: 'Increase', next: ex.lo, nextLoad: up, why: `Every set reached ${ex.hi} reps at ${L} kg. Add ${inc} kg: next time ${up} kg × ${ex.lo} reps, then build the reps again.` }
      }
      const next = Math.min(ex.hi, target + (vals.every(v => v >= target + 2) ? 2 : 1))
      return { tag: 'Increase', next, nextLoad: L, why: `All sets reached ${target} reps at ${L} kg. Same weight, aim for ${next} reps.` }
    }
    if (allHit) return { tag: 'Hold', next: target, nextLoad: L, why: `Target hit, but effort ${rpe}/10 is above ${rules.maxRpe}. Repeat ${L} kg × ${target} until it feels controlled.` }
    if (pct < rules.failPct) {
      if (target > ex.lo) return { tag: 'Ease off', next: target - 1, nextLoad: L, why: `${pct}% of planned reps. Keep ${L} kg, aim for ${target - 1} reps.` }
      const down = roundTo(L * 0.9, ex.load.barbell ? 2.5 : inc)
      return { tag: 'Ease off', next: ex.lo, nextLoad: down, why: `${pct}% of planned reps at the bottom of the range. Drop 10% to ${down} kg and rebuild.` }
    }
    return { tag: 'Hold', next: target, nextLoad: L, why: `${pct}% of planned reps. Keep ${L} kg × ${target} and aim to hit every set.` }
  }

  if (allHit && rpe <= rules.maxRpe) {
    if (vals.every(v => v >= ex.hi)) {
      const nxt = ex.track ? trackById(ex.track)?.nodes[ex.index + 1] : undefined
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
