// Sample data for previewing charts and progress. Never mixed with real data (see store: enterDemo/exitDemo).
import { EX } from '../data/catalog'
import { addDays, dayKey, readinessScore, type ExerciseLog, type Readiness, type Session, type State } from './progression'

// per track: segments of [exercise, first best set, last best set, sessions spent (last segment takes the rest)]
const PLAN: [string, number, number, number?][][] = [
  [['knee_pu', 10, 15, 7], ['pushup', 4, 8]],
  [['db_row', 8, 13]],
  [['split_squat', 8, 12, 6], ['goblet_squat', 8, 11]],
  [['plank', 30, 60, 6], ['hollow_hold', 15, 25]],
  [['pike_pu', 3, 7]],
  [['pl_lean', 10, 20]],
  [['sl_bridge', 8, 12]],
  [['gripper', 12, 20]],
]

export function makeDemo(real: State): State {
  const today = new Date()
  const monday = addDays(today, -((today.getDay() + 6) % 7))
  const start = addDays(monday, -7 * 8)
  const todayKey = dayKey(today)

  const strengthDays: Date[] = []
  for (let d = new Date(start); dayKey(d) < todayKey; d = addDays(d, 1)) if ([1, 3, 5].includes(d.getDay())) strengthDays.push(new Date(d))
  const missed = new Set([5, 13]) // two skipped sessions, so the calendar shows gaps
  const days = strengthDays.filter((_, i) => !missed.has(i))
  const N = days.length

  const items: ExerciseLog[][] = days.map(() => [])
  const targets: Record<string, number> = {}
  for (const track of PLAN) {
    let at = 0
    track.forEach(([id, from, to, n], seg) => {
      const last = seg === track.length - 1
      const count = last ? N - at : n!
      const ex = EX[id], sets = ex.track ? 3 : 2
      for (let k = 0; k < count && at + k < N; k++) {
        const v = Math.round(from + (to - from) * (count === 1 ? 1 : k / (count - 1)))
        const done = !last && k === count - 1 // mastered on the last session of an earlier stage
        const drop = ex.hold ? 5 : 1
        const vals = Array.from({ length: sets }, (_, j) => done || j < sets - 1 ? v : Math.max(1, v - drop))
        items[at + k].push({ id, planned: sets, target: v, sets: vals.map((value, j) => ({ value, rpe: j === sets - 1 ? 8 : 7 })) })
      }
      at += count
      if (last) targets[id] = to
    })
  }

  const sessions: Session[] = days.map((d, i) => ({ id: `demo-${i}`, date: dayKey(d), minutes: 44 + ((i * 7) % 12), items: items[i] }))

  const checks: Record<string, string[]> = {}
  const readiness: Record<string, Readiness> = {}
  let i = 0
  for (let d = new Date(start); dayKey(d) < todayKey; d = addDays(d, 1), i++) {
    const k = dayKey(d), dow = d.getDay(), c: string[] = []
    if (i % 6) c.push('morning')
    if (i % 4) c.push('night')
    if (sessions.some(x => x.date === k)) {
      c.push('warm', 'sn_pre', 'shav'); if (i % 3) c.push('sn_post', 'ysec')
      const sleep = i % 5 ? 2 : 1, energy = 2 + (i % 3), sore = i % 4 ? 1 : 2
      readiness[k] = { sleep, energy, sore, pain: false, score: readinessScore(sleep, energy, sore) }
    }
    if ([2, 4, 6].includes(dow) && i % 5) c.push('yoga', 'shav')
    if ([2, 4].includes(dow) && i % 7) c.push('evening')
    checks[k] = c
  }

  // weekly Sunday weigh-ins: ~0.4 kg/week loss with a little noise
  const weights = Array.from({ length: 9 }, (_, w) => {
    const d = addDays(start, 7 * w - 1)
    return { date: dayKey(d), kg: Math.round((78.4 - 0.42 * w + [0, 0.3, -0.1, 0.2, -0.2, 0.1, 0, 0.2, -0.1][w]) * 10) / 10, waist: Math.round((88 - 0.5 * w) * 2) / 2 }
  }).filter(w => w.date < todayKey)

  return {
    ...real,
    demo: true,
    onboarded: true,
    startDate: dayKey(start),
    mastered: ['incline_pu', 'knee_pu', 'bw_squat', 'split_squat', 'dead_bug', 'plank'],
    targets, sessions, checks, readiness,
    body: { height: 172, goal: 'lose', target: 72, weights },
  }
}
