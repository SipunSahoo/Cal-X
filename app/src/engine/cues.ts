// Sound + haptic cues for phase changes. Call unlockCues() from a tap before the first cue (iOS requirement).
import type { PhaseKind } from '../data/breathing'

export type Cue = PhaseKind | 'done'

let ctx: AudioContext | undefined

export function unlockCues() {
  try {
    // iOS 17+: play through the silent switch like a media app
    const nav = navigator as Navigator & { audioSession?: { type: string } }
    if (nav.audioSession) nav.audioSession.type = 'playback'
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch { /* audio unavailable */ }
}

/** Soft bell-like tone gliding from f1 to f2. */
function tone(f1: number, f2: number, at: number, dur: number, vol: number) {
  if (!ctx) return
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain()
  const t = ctx.currentTime + at
  o.type = 'sine'; o2.type = 'sine'
  o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur * 0.6)
  o2.frequency.setValueAtTime(f1 * 2, t); o2.frequency.exponentialRampToValueAtTime(f2 * 2, t + dur * 0.6) // soft overtone
  const g2 = ctx.createGain(); g2.gain.value = 0.15
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.03)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g); o2.connect(g2).connect(g); g.connect(ctx.destination)
  o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05)
}

const SOUNDS: Record<Cue, (v: number) => void> = {
  inhale: v => tone(392, 587, 0, 0.9, v), // rising
  exhale: v => tone(587, 392, 0, 1.1, v), // falling
  hold: v => tone(494, 494, 0, 0.5, v * 0.7), // single soft note
  rest: v => tone(330, 330, 0, 1.2, v * 0.7),
  done: v => { tone(392, 392, 0, 0.9, v); tone(494, 494, 0.25, 0.9, v); tone(587, 587, 0.5, 1.4, v) },
}

// Vibration patterns (ms). Different rhythm per phase so you can feel which one started.
const BUZZ: Record<Cue, number[]> = {
  inhale: [70],
  hold: [25, 70, 25],
  exhale: [180],
  rest: [25, 70, 25, 70, 25],
  done: [120, 90, 120, 90, 250],
}

// iOS Safari has no vibrate(); toggling a <input switch> gives a system haptic tick (iOS 18+).
function iosTick() {
  const label = document.createElement('label')
  label.ariaHidden = 'true'
  label.style.display = 'none'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  label.appendChild(input)
  document.body.appendChild(label)
  label.click()
  label.remove()
}

function buzz(pattern: number[]) {
  if (typeof navigator.vibrate === 'function') { navigator.vibrate(pattern); return }
  // one tick per "on" pulse, spaced like the pattern
  let at = 0
  pattern.forEach((ms, k) => { if (k % 2 === 0) setTimeout(iosTick, at); at += ms })
}

export function cue(kind: Cue, prefs: { sound: boolean; haptic: boolean; volume: number }) {
  try {
    if (prefs.sound && ctx) { if (ctx.state === 'suspended') void ctx.resume(); SOUNDS[kind](Math.max(0.02, prefs.volume * 0.5)) }
    if (prefs.haptic) buzz(BUZZ[kind])
  } catch { /* cues are best-effort */ }
}
