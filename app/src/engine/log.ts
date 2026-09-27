// Logging exercises into today's session (one session per day), applying and undoing progression.
import { evaluate, type Decision, type ExerciseLog, type Planned, type Session, type SetLog, type State } from './progression'

/** Put items into the session for `date`, replacing any earlier log of the same exercise. */
export function mergeIntoDay(sessions: Session[], date: string, items: ExerciseLog[], minutes: number): Session[] {
  const i = sessions.findIndex(x => x.date === date)
  if (i < 0) return [...sessions, { id: `${date}-${Date.now()}`, date, minutes, items }]
  const cur = sessions[i]
  const merged = [...cur.items.filter(it => !items.some(n => n.id === it.id)), ...items]
  return sessions.map((x, k) => k === i ? { ...cur, items: merged, minutes: cur.minutes + minutes } : x)
}

/** Log one exercise (ticked or edited) and apply its progression decision. */
export function logExercise(s: State, date: string, p: Planned, sets: SetLog[], quick: boolean): { state: State; decision: Decision } {
  const prev = s.sessions.find(x => x.date === date)?.items.find(it => it.id === p.ex.id)
  let base = s
  if (prev) base = undoLog(s, date, p.ex.id) // editing: roll back the earlier decision first
  const d = evaluate(p, sets, base.rules)
  const unlocked = d.tag === 'Level up' && !base.mastered.includes(p.ex.id)
  const item: ExerciseLog = { id: p.ex.id, planned: p.sets, target: p.target, sets, quick, unlocked: unlocked || undefined, kg: p.load }
  const minutes = Math.round(p.sets * ((p.ex.hold ? p.target : p.target * 3) + (p.ex.track ? 90 : 60)) / 60)
  return {
    decision: d,
    state: {
      ...base,
      targets: { ...base.targets, [p.ex.id]: d.next },
      loads: d.nextLoad != null ? { ...base.loads, [p.ex.id]: d.nextLoad } : base.loads,
      mastered: unlocked ? [...base.mastered, p.ex.id] : base.mastered,
      sessions: mergeIntoDay(base.sessions, date, [item], minutes),
    },
  }
}

/** Remove an exercise from a day's log and put its target and mastery back. */
export function undoLog(s: State, date: string, id: string): State {
  const ses = s.sessions.find(x => x.date === date)
  const item = ses?.items.find(it => it.id === id)
  if (!ses || !item) return s
  const items = ses.items.filter(it => it.id !== id)
  return {
    ...s,
    targets: { ...s.targets, [id]: item.target },
    loads: item.kg != null ? { ...s.loads, [id]: item.kg } : s.loads,
    mastered: item.unlocked ? s.mastered.filter(m => m !== id) : s.mastered,
    sessions: items.length ? s.sessions.map(x => x === ses ? { ...ses, items } : x) : s.sessions.filter(x => x !== ses),
  }
}
