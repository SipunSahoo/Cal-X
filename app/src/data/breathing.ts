// Breathing patterns (4 phases) and sequences (patterns mixed with pauses). Pure data + timeline builder.

export interface BreathPattern {
  id: string
  name: string
  inhale: number // seconds
  hold1: number // hold after inhale (0 = none)
  exhale: number
  hold2: number // hold after exhale (0 = none)
  alternate?: boolean // alternate-nostril cue (Nadi Shodhana)
  rounds?: number // default rounds when practised on its own (10 if unset)
  note?: string
}
export type BreathStep = { kind: 'breath'; patternId: string; rounds: number } | { kind: 'pause'; seconds: number }
export interface BreathSequence { id: string; name: string; steps: BreathStep[] }
export interface BreathPrefs { sound: boolean; haptic: boolean; volume: number }
export interface BreathState { patterns: BreathPattern[]; sequences: BreathSequence[]; prefs: BreathPrefs }

// App-suggested presets: fixed, never stored. The user's own patterns/sequences live in BreathState.
export const PRESETS: { patterns: BreathPattern[]; sequences: BreathSequence[] } = {
  patterns: [
    { id: 'box', name: 'Box breathing', inhale: 4, hold1: 4, exhale: 4, hold2: 4, note: 'Even and steady. Good before training.' },
    { id: 'nadi', name: 'Nadi Shodhana', inhale: 4, hold1: 4, exhale: 8, hold2: 0, alternate: true, note: 'Alternate nostrils. Slow and silent at night.' },
    { id: 'coherent', name: 'Coherent', inhale: 5, hold1: 0, exhale: 5, hold2: 0, note: 'About 6 breaths a minute. Calms the nervous system.' },
    { id: '478', name: '4-7-8 relax', inhale: 4, hold1: 7, exhale: 8, hold2: 0, note: 'Long hold and exhale. Before sleep.' },
    { id: 'bhramari', name: 'Bhramari', inhale: 4, hold1: 0, exhale: 8, hold2: 0, note: 'Hum like a bee on the exhale.' },
  ],
  sequences: [
    { id: 'morning', name: 'Morning pranayama', steps: [
      { kind: 'breath', patternId: 'nadi', rounds: 10 }, { kind: 'pause', seconds: 30 }, { kind: 'breath', patternId: 'coherent', rounds: 12 },
    ] },
    { id: 'night', name: 'Night wind-down', steps: [
      { kind: 'breath', patternId: 'nadi', rounds: 11 }, { kind: 'pause', seconds: 20 }, { kind: 'breath', patternId: '478', rounds: 4 },
    ] },
    { id: 'pretrain', name: 'Before training', steps: [{ kind: 'breath', patternId: 'box', rounds: 8 }] },
  ],
}

export const DEFAULT_BREATH: BreathState = { patterns: [], sequences: [], prefs: { sound: true, haptic: true, volume: 0.45 } }

const PRESET_IDS = new Set([...PRESETS.patterns, ...PRESETS.sequences].map(x => x.id))
export const isPreset = (id: string) => PRESET_IDS.has(id)
/** User's own items (older saves also stored copies of the presets; those are skipped). */
export const myPatterns = (b: BreathState) => b.patterns.filter(p => !isPreset(p.id))
export const mySequences = (b: BreathState) => b.sequences.filter(q => !isPreset(q.id))
/** Every pattern a sequence can use: presets first, then the user's. */
export const allPatterns = (b: BreathState) => [...PRESETS.patterns, ...myPatterns(b)]

export type PhaseKind = 'inhale' | 'hold' | 'exhale' | 'rest'
export interface Segment {
  kind: PhaseKind
  label: string
  dur: number // seconds
  from: number // circle fill 0..1 at start
  to: number // circle fill at end
  step: number
  round: number
  rounds: number
  patternName: string
  side?: string
}

export const cycleSeconds = (p: BreathPattern) => p.inhale + p.hold1 + p.exhale + p.hold2
export const phaseText = (p: BreathPattern) => [p.inhale, p.hold1, p.exhale, p.hold2].join('·')

export function stepSeconds(step: BreathStep, patterns: BreathPattern[]) {
  if (step.kind === 'pause') return step.seconds
  const p = patterns.find(x => x.id === step.patternId)
  return p ? cycleSeconds(p) * step.rounds : 0
}
export const sequenceSeconds = (seq: BreathSequence, patterns: BreathPattern[]) =>
  seq.steps.reduce((a, st) => a + stepSeconds(st, patterns), 0)

export const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`

/** Flatten a sequence into timed segments. Zero-length phases are skipped. */
export function timeline(seq: BreathSequence, patterns: BreathPattern[]): Segment[] {
  const out: Segment[] = []
  seq.steps.forEach((st, step) => {
    if (st.kind === 'pause') {
      if (st.seconds > 0) out.push({ kind: 'rest', label: 'Rest', dur: st.seconds, from: 0, to: 0, step, round: 1, rounds: 1, patternName: 'Pause' })
      return
    }
    const p = patterns.find(x => x.id === st.patternId)
    if (!p) return
    for (let r = 1; r <= st.rounds; r++) {
      // Nadi Shodhana: in left / out right, in right / out left
      const inSide = p.alternate ? (r % 2 ? 'left' : 'right') : undefined
      const outSide = p.alternate ? (r % 2 ? 'right' : 'left') : undefined
      const base = { step, round: r, rounds: st.rounds, patternName: p.name }
      if (p.inhale) out.push({ ...base, kind: 'inhale', label: 'Inhale', dur: p.inhale, from: 0, to: 1, side: inSide })
      if (p.hold1) out.push({ ...base, kind: 'hold', label: 'Hold', dur: p.hold1, from: 1, to: 1 })
      if (p.exhale) out.push({ ...base, kind: 'exhale', label: 'Exhale', dur: p.exhale, from: 1, to: 0, side: outSide })
      if (p.hold2) out.push({ ...base, kind: 'hold', label: 'Hold', dur: p.hold2, from: 0, to: 0 })
    }
  })
  return out
}
