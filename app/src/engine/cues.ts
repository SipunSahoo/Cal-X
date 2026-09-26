// Phase-change cues: a soft synthesized singing bowl + vibration (Android only; iOS web apps can't vibrate on a timer).
// Call unlockCues() from a tap before the first cue (iOS audio requirement).
import type { PhaseKind } from '../data/breathing'

export type Cue = PhaseKind | 'done'
export const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'

let ctx: AudioContext | undefined
let bus: GainNode | undefined

export function unlockCues() {
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } }
    if (nav.audioSession) nav.audioSession.type = 'playback' // iOS 17+: play even with the silent switch on
    if (!ctx) {
      ctx = new AudioContext()
      // warm, rounded tone: gentle low-pass + light compression
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; lp.Q.value = 0.3
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -24; comp.ratio.value = 3
      bus = ctx.createGain()
      bus.connect(lp).connect(comp).connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume()
  } catch { /* audio unavailable */ }
}

// Singing-bowl partials: [frequency ratio, loudness, decay multiplier]. Inharmonic ratios give the bowl colour.
const PARTIALS: [number, number, number][] = [[1, 1, 1], [2.72, 0.32, 0.6], [5.1, 0.1, 0.35], [8.4, 0.035, 0.2]]

/** One soft bowl strike. Each partial is a slightly detuned pair, which makes the slow shimmer. */
function bowl(freq: number, at: number, vol: number, decay: number) {
  if (!ctx || !bus) return
  const t = ctx.currentTime + at
  PARTIALS.forEach(([ratio, amp, dMul], k) => {
    for (const detune of [0, 0.7 + k * 0.5]) {
      const o = ctx!.createOscillator(), g = ctx!.createGain()
      o.type = 'sine'
      o.frequency.value = freq * ratio + detune
      const peak = vol * amp * 0.5
      const end = t + decay * dMul
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(peak, t + 0.035) // soft mallet, no click
      g.gain.exponentialRampToValueAtTime(0.0001, end)
      o.connect(g).connect(bus!)
      o.start(t); o.stop(end + 0.05)
    }
  })
}

const SOUNDS: Record<Cue, (v: number) => void> = {
  inhale: v => bowl(293.7, 0, v, 4.5), // D4
  exhale: v => bowl(220, 0, v, 5), // A3, lower = letting go
  hold: v => bowl(392, 0, v * 0.45, 2.5), // G4, quieter and shorter
  rest: v => bowl(196, 0, v * 0.8, 5), // G3
  done: v => { bowl(220, 0, v, 6); bowl(293.7, 0.9, v * 0.8, 6); bowl(440, 1.8, v * 0.6, 7) },
}

const BUZZ: Record<Cue, number[]> = {
  inhale: [60], hold: [25, 80, 25], exhale: [160], rest: [25, 80, 25, 80, 25], done: [100, 90, 100, 90, 220],
}

export function cue(kind: Cue, prefs: { sound: boolean; haptic: boolean; volume: number }) {
  try {
    if (prefs.sound && ctx) { if (ctx.state === 'suspended') void ctx.resume(); SOUNDS[kind](prefs.volume * 0.6) }
    if (prefs.haptic && canVibrate) navigator.vibrate(BUZZ[kind])
  } catch { /* cues are best-effort */ }
}
