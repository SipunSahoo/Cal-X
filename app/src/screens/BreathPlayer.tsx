import { useEffect, useMemo, useRef, useState } from 'react'
import { allPatterns, mmss, timeline, type BreathSequence, type Segment } from '../data/breathing'
import { cue, unlockCues } from '../engine/cues'
import { dayKey } from '../engine/progression'
import { setState, useStore } from '../store'
import { toast } from '../ui'
import { Icon } from '../icons'

const R = 88 // circle radius in the 200×200 viewBox
const ease = (p: number) => 0.5 - Math.cos(Math.PI * p) / 2 // gentle start and finish, like a real breath
const GET_READY = 3

type Timed = Segment & { start: number; end: number }

export default function BreathPlayer({ seq, onClose }: { seq: BreathSequence; onClose: () => void }) {
  const s = useStore()
  const prefs = s.breath.prefs
  const segs = useMemo<Timed[]>(() => {
    const list: Segment[] = [{ kind: 'rest', label: 'Get ready', dur: GET_READY, from: 0, to: 0, step: -1, round: 1, rounds: 1, patternName: seq.name }, ...timeline(seq, allPatterns(s.breath))]
    let t = 0
    return list.map(sg => { const x = { ...sg, start: t, end: t + sg.dur }; t += sg.dur; return x })
  }, [seq]) // eslint-disable-line react-hooks/exhaustive-deps
  const total = segs.length ? segs[segs.length - 1].end : 0

  const [started, setStarted] = useState(false)
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [done, setDone] = useState(false)
  const clock = useRef({ start: 0, pausedAt: 0, idx: 0 })
  const water = useRef<SVGRectElement>(null)
  const secs = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLElement>(null)
  const elapsedEl = useRef<HTMLSpanElement>(null)
  const prefsRef = useRef(prefs)
  prefsRef.current = prefs

  // animation loop: DOM is updated directly each frame; React only re-renders on phase change
  useEffect(() => {
    if (!started || paused || done) return
    let raf = 0
    const frame = () => {
      const el = (performance.now() - clock.current.start) / 1000
      let i = clock.current.idx
      while (i < segs.length && el >= segs[i].end) i++
      if (i >= segs.length) { cue('done', prefsRef.current); setDone(true); return }
      if (i !== clock.current.idx) { clock.current.idx = i; setIdx(i); cue(segs[i].kind, prefsRef.current) }
      const sg = segs[i]
      const fill = sg.from + (sg.to - sg.from) * ease(Math.min(1, (el - sg.start) / sg.dur))
      water.current?.setAttribute('y', String(100 + R - 2 * R * fill))
      if (secs.current) secs.current.textContent = String(Math.max(1, Math.ceil(sg.end - el)))
      if (bar.current) bar.current.style.width = `${(el / total) * 100}%`
      if (elapsedEl.current) elapsedEl.current.textContent = mmss(el)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [started, paused, done, segs, total])

  // keep the screen awake during the session
  useEffect(() => {
    if (!started || done) return
    let lock: WakeLockSentinel | undefined
    navigator.wakeLock?.request('screen').then(l => { lock = l }).catch(() => {})
    return () => { lock?.release().catch(() => {}) }
  }, [started, done])

  // log it as the morning or night sadhana check-off
  useEffect(() => {
    if (!done || seq.id === 'quick') return
    const key = new Date().getHours() < 15 ? 'morning' : 'night', today = dayKey()
    setState(x => { const c = x.checks[today] ?? []; return c.includes(key) ? x : { ...x, checks: { ...x.checks, [today]: [...c, key] } } })
    toast(`${key === 'morning' ? 'Morning' : 'Night'} sadhana ticked off.`)
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps

  const begin = () => { unlockCues(); clock.current = { start: performance.now(), pausedAt: 0, idx: 0 }; setIdx(0); setStarted(true); cue('rest', prefs) }
  const togglePause = () => {
    if (paused) clock.current.start += performance.now() - clock.current.pausedAt
    else clock.current.pausedAt = performance.now()
    setPaused(!paused)
  }
  const skipStep = () => {
    const cur = segs[clock.current.idx]
    const nxt = segs.find(x => x.step > cur.step)
    if (!nxt) { setDone(true); cue('done', prefs); return }
    clock.current.start = performance.now() - nxt.start * 1000
    if (paused) { clock.current.pausedAt = performance.now() }
  }

  const sg = segs[idx]
  const next = segs[idx + 1]
  const stepCount = seq.steps.length
  const color = sg.kind === 'rest' ? 'var(--muted)' : 'var(--breath)'

  if (done) return (
    <div className="full"><div className="stack" style={{ minHeight: '100%', justifyContent: 'center', gap: 18 }}>
      <div className="tag">Complete</div>
      <h1 style={{ fontSize: 40 }}>{seq.name}</h1>
      <div className="stats"><div className="stat"><div className="num">{mmss(total - GET_READY)}</div><div className="tag">Breathing time</div></div>
        <div className="stat"><div className="num">{stepCount}</div><div className="tag">Steps</div></div></div>
      <button className="btn breath" onClick={onClose}>Done</button>
    </div></div>
  )

  return (
    <div className="full"><div className="stack" style={{ minHeight: '100%', gap: 14 }}>
      <div className="row between">
        <button className="chip icon" aria-label="Close" onClick={onClose}><Icon name="close" size={16} /></button>
        <span className="tag">{sg.step < 0 ? seq.name : `Step ${sg.step + 1} of ${stepCount}`}</span>
        <span className="num small"><span ref={elapsedEl}>0:00</span><span className="muted"> / {mmss(total)}</span></span>
      </div>
      <div className="bar"><i ref={bar} style={{ width: 0, background: 'var(--breath)' }} /></div>

      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <div className="tag">{sg.patternName}{sg.kind !== 'rest' ? ` · round ${sg.round}/${sg.rounds}` : ''}</div>
        <h1 style={{ fontSize: 44, marginTop: 6, color: started ? color : undefined }}>{started ? sg.label : 'Ready'}</h1>
        <div className="small" style={{ minHeight: 20, color: 'var(--breath)' }}>{sg.side ? `${sg.side} nostril` : ''}</div>
      </div>

      <svg viewBox="-12 -12 224 224" style={{ overflow: 'visible', width: 'min(80vw, 330px)', alignSelf: 'center', display: 'block' }} role="img" aria-label={`${sg.label} circle`}>
        <defs><clipPath id="breath-clip"><circle cx="100" cy="100" r={R - 3} /></clipPath></defs>
        <circle cx="100" cy="100" r={R} fill="none" stroke="var(--line-2)" strokeWidth="1.5" />
        {started && <circle key={idx} className="pulse" cx="100" cy="100" r={R} fill="none" stroke={color} strokeWidth="2" />}
        <rect ref={water} x="0" y={100 + R} width="200" height="200" fill={color} opacity="0.85" clipPath="url(#breath-clip)" />
        {[0.25, 0.5, 0.75].map(f => <line key={f} x1={100 - R * 1.08} x2={100 - R * 0.98} y1={100 + R - 2 * R * f} y2={100 + R - 2 * R * f} stroke="var(--muted)" strokeWidth="1" />)}
      </svg>

      <div style={{ textAlign: 'center' }}>
        <span ref={secs} className="num" style={{ fontSize: 56, lineHeight: 1 }}>{sg.dur}</span><span className="tag"> sec</span>
        <div className="small muted" style={{ marginTop: 6, minHeight: 20 }}>{next ? `Next: ${next.label}${next.side ? ` (${next.side})` : ''} · ${next.dur}s` : 'Last phase'}</div>
      </div>

      <div className="grow" />
      {!started
        ? <button className="btn breath" onClick={begin}>Begin</button>
        : <div className="row">
            <button className="btn ghost" onClick={skipStep}>Skip step</button>
            <button className="btn breath" onClick={togglePause}>{paused ? 'Resume' : 'Pause'}</button>
          </div>}
    </div></div>
  )
}
