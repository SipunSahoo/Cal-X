import { useEffect, useState } from 'react'
import { TIERS, videoUrl } from '../data/catalog'
import { bests, buildSession, dayKey, evaluate, lastSets, unit, type Decision, type Planned, type SetLog } from '../engine/progression'
import { setState, useStore } from '../store'
import { toast } from '../ui'

const RPE: [number, string][] = [[6, 'Easy'], [7, 'Solid'], [8, 'Hard'], [9, 'Grind'], [10, 'Max']]
const restFor = (p: Planned) => (p.ex.track ? 90 : 60) * 1000

let audio: AudioContext | undefined
function beep() {
  try {
    audio ??= new AudioContext()
    const o = audio.createOscillator(), g = audio.createGain()
    o.frequency.value = 880; g.gain.value = 0.15; o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.3)
    navigator.vibrate?.(200)
  } catch { /* sound is optional */ }
}

export default function Workout({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const [items] = useState(() => buildSession(s, s.readiness[dayKey()]))
  const [i, setI] = useState(0)
  const [logs, setLogs] = useState<SetLog[][]>(() => items.map(() => []))
  const [pain, setPain] = useState<Record<number, boolean>>({})
  const [val, setVal] = useState(items[0].target)
  const [rpe, setRpe] = useState(7)
  const [restEnd, setRestEnd] = useState<number | null>(null)
  const [holdStart, setHoldStart] = useState<number | null>(null)
  const [t0] = useState(Date.now)
  const [summary, setSummary] = useState<null | { minutes: number; results: { p: Planned; sets: SetLog[]; d: Decision; pain: boolean }[] }>(null)
  const [, tick] = useState(0)
  const [confirmQuit, setConfirmQuit] = useState(false)

  // keep the screen on while training
  useEffect(() => {
    let lock: WakeLockSentinel | undefined
    navigator.wakeLock?.request('screen').then(l => { lock = l }).catch(() => {})
    return () => { lock?.release().catch(() => {}) }
  }, [])

  // drive timers; timestamps keep them correct even if the phone sleeps
  useEffect(() => {
    if (!restEnd && !holdStart) return
    const id = setInterval(() => {
      if (restEnd && Date.now() >= restEnd) { setRestEnd(null); beep() }
      tick(n => n + 1)
    }, 250)
    return () => clearInterval(id)
  }, [restEnd, holdStart])

  const p = items[i], ex = p.ex, U = unit(ex), done = logs[i].length
  const last = lastSets(s, ex.id)

  const goTo = (k: number) => { setI(k); setVal(items[k].target); setRpe(7); setHoldStart(null) }
  const finish = (finalLogs = logs, finalPain = pain) => {
    const results = items.map((pl, k) => ({ p: pl, sets: finalLogs[k], d: evaluate(pl, finalLogs[k], s.rules, finalPain[k]), pain: !!finalPain[k] }))
    setRestEnd(null); setSummary({ minutes: Math.max(1, Math.round((Date.now() - t0) / 60000)), results })
  }
  const next = (l = logs, pn = pain) => (i === items.length - 1 ? finish(l, pn) : goTo(i + 1))

  const completeSet = () => {
    const value = holdStart ? Math.floor((Date.now() - holdStart) / 1000) : val
    const l = logs.map((x, k) => (k === i ? [...x, { value, rpe }] : x))
    setLogs(l); setHoldStart(null)
    if (l[i].length >= p.sets) {
      if (i === items.length - 1) return finish(l)
      goTo(i + 1)
    }
    setRestEnd(Date.now() + restFor(p))
  }

  if (summary) return <Summary {...summary} onDone={onClose} />

  if (restEnd) {
    const left = Math.max(0, Math.ceil((restEnd - Date.now()) / 1000))
    const n = items[i]
    return (
      <div className="full"><div className="stack" style={{ minHeight: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 18 }}>
        <div className="eyebrow">Rest</div>
        <div className="num" style={{ fontSize: 110, lineHeight: 1 }}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</div>
        <div className="muted">Next: {n.ex.name}, set {logs[i].length + 1} Â· {n.target}{unit(n.ex) || ' reps'}</div>
        <div className="row" style={{ width: '100%', maxWidth: 320 }}>
          <button className="btn ghost" onClick={() => setRestEnd(restEnd + 15000)}>+15 s</button>
          <button className="btn" onClick={() => setRestEnd(null)}>Skip rest</button>
        </div>
      </div></div>
    )
  }

  const holding = holdStart !== null
  return (
    <div className="full"><div className="stack" style={{ gap: 16 }}>
      <div className="row between">
        {confirmQuit
          ? <span className="row"><button className="chip" style={{ color: 'var(--bad)' }} onClick={onClose}>Discard workout</button><button className="chip" onClick={() => setConfirmQuit(false)}>Keep going</button></span>
          : <button className="chip" onClick={() => setConfirmQuit(true)}>âœ• Quit</button>}
        <span className="small muted">{i + 1} / {items.length}</span>
        <button className="chip" onClick={() => finish()}>Finish</button>
      </div>
      <div className="row" style={{ gap: 4 }}>
        {items.map((_, k) => <button key={k} aria-label={`Go to exercise ${k + 1}`} onClick={() => goTo(k)} style={{ flex: 1, height: 14, display: 'flex', alignItems: 'center' }}>
          <i style={{ flex: 1, height: 4, borderRadius: 4, background: logs[k].length >= items[k].sets ? 'var(--accent)' : k === i ? 'var(--text)' : 'var(--line)' }} /></button>)}
      </div>

      <div>
        <div className="eyebrow">{ex.track ? `${TIERS[ex.tier]} Â· ${ex.track}` : 'Accessory'}{ex.perSide ? ' Â· per side' : ''}</div>
        <h1 style={{ fontSize: 42, marginTop: 6 }}>{ex.name}</h1>
      </div>
      <div className="row">
        {Array.from({ length: p.sets }, (_, k) => <span key={k} style={{ width: 12, height: 12, borderRadius: '50%', background: k < done ? 'var(--accent)' : 'transparent', border: `2px solid ${k === done ? 'var(--text)' : 'var(--line)'}` }} />)}
        <span className="small muted">Set {Math.min(done + 1, p.sets)} of {p.sets}</span>
      </div>

      <div className="row">
        <div className="card grow"><div className="eyebrow">Target</div><div className="num" style={{ fontSize: 30 }}>{p.target}{U || ' reps'}</div></div>
        <div className="card grow"><div className="eyebrow">Last time</div><div className="num" style={{ fontSize: 30 }}>{last?.[done] != null ? `${last[done]}${U || ' reps'}` : 'â€“'}</div></div>
      </div>

      {ex.hold && (
        <button className="card" style={{ textAlign: 'center', padding: 18, borderColor: holding ? 'var(--accent)' : undefined }}
          onClick={() => { if (holding) { setVal(Math.floor((Date.now() - holdStart) / 1000)); setHoldStart(null) } else setHoldStart(Date.now()) }}>
          <div className="num" style={{ fontSize: 56 }}>{holding ? Math.floor((Date.now() - holdStart) / 1000) : val}s</div>
          <div className="small muted">{holding ? 'Tap to stop' : 'Tap to start the hold timer'}</div>
        </button>
      )}
      {!holding && (
        <div className="card row between" style={{ padding: 10 }}>
          <button className="btn ghost" style={{ width: 64 }} aria-label="Less" onClick={() => setVal(v => Math.max(0, v - (ex.hold ? 5 : 1)))}>âˆ’</button>
          <div style={{ textAlign: 'center' }}><div className="num" style={{ fontSize: 48, lineHeight: 1 }}>{val}</div><div className="small muted">{ex.hold ? 'seconds' : 'reps'} done</div></div>
          <button className="btn ghost" style={{ width: 64 }} aria-label="More" onClick={() => setVal(v => v + (ex.hold ? 5 : 1))}>+</button>
        </div>
      )}

      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>How hard was it? (effort out of 10)</div>
        <div className="row" style={{ gap: 6 }}>
          {RPE.map(([v, l]) => <button key={v} className={`chip ${rpe === v ? 'on' : ''}`} style={{ flex: 1, flexDirection: 'column', gap: 0, padding: '6px 0' }} onClick={() => setRpe(v)}>
            <b>{v}</b><span style={{ fontSize: 10, fontWeight: 500 }}>{l}</span></button>)}
        </div>
      </div>

      <button className="btn" onClick={completeSet}>{holding ? 'Stop & complete set' : 'Complete set'}</button>
      <div className="small muted">{ex.cue}</div>
      <div className="row wrap">
        <button className="chip" onClick={() => next()}>Skip exercise</button>
        <button className="chip" style={{ color: 'var(--bad)' }} onClick={() => {
          const pn = { ...pain, [i]: true }; setPain(pn)
          toast("Noted. Stop this exercise. Cal-X can't diagnose pain. If it's sharp or lasts, see a professional."); next(logs, pn)
        }}>Something hurts</button>
        <a className="chip" href={videoUrl(ex.name)} target="_blank" rel="noreferrer">Demo video â†—</a>
      </div>
      {items[i + 1] && <div className="small muted">Up next: {items[i + 1].ex.name} Â· {items[i + 1].sets} Ã— {items[i + 1].target}{unit(items[i + 1].ex)}</div>}
    </div></div>
  )
}

const TAG_COLOR = { 'Level up': 'var(--good)', Increase: 'var(--accent)', Hold: 'var(--warn)', 'Ease off': 'var(--bad)' }

function Summary({ minutes, results, onDone }: { minutes: number; results: { p: Planned; sets: SetLog[]; d: Decision; pain: boolean }[]; onDone: () => void }) {
  const s = useStore()
  const before = bests(s)
  const prs = results.filter(r => r.sets.length && Math.max(...r.sets.map(x => x.value)) > (before[r.p.ex.id]?.value ?? 0))
  const save = () => {
    setState(x => {
      const targets = { ...x.targets }, mastered = [...x.mastered]
      for (const r of results) {
        targets[r.p.ex.id] = r.d.next
        if (r.d.tag === 'Level up' && !mastered.includes(r.p.ex.id)) mastered.push(r.p.ex.id)
      }
      const date = dayKey()
      return { ...x, targets, mastered, sessions: [...x.sessions, {
        id: `${date}-${Date.now()}`, date, minutes,
        items: results.map(r => ({ id: r.p.ex.id, planned: r.p.sets, target: r.p.target, sets: r.sets, pain: r.pain || undefined })),
      }] }
    })
    const ups = results.filter(r => r.d.advanceTo).map(r => r.d.advanceTo!.name)
    toast(ups.length ? `Unlocked: ${ups.join(', ')}` : 'Workout saved.')
    onDone()
  }
  return (
    <div className="full"><div className="stack" style={{ gap: 14 }}>
      <div className="eyebrow">Session complete</div><h1>Nice work.</h1>
      <div className="row">
        {[[minutes, 'minutes'], [results.reduce((a, r) => a + r.sets.length, 0), 'sets'], [prs.length, 'new records']].map(([v, l]) =>
          <div key={l} className="card stat"><div className="num">{v}</div><div className="small muted">{l}</div></div>)}
      </div>
      <div className="eyebrow" style={{ marginTop: 6 }}>Coach decisions for next session</div>
      {results.map(r => (
        <div key={r.p.ex.id} className="card stack" style={{ gap: 6 }}>
          <div className="row between"><b>{r.p.ex.name}</b><span className="chip" style={{ color: TAG_COLOR[r.d.tag] }}>{r.d.tag}</span></div>
          <div className="small muted">Logged {r.sets.length ? r.sets.map(x => x.value).join(' Â· ') + unit(r.p.ex) : 'nothing'} Â· target {r.p.sets} Ã— {r.p.target}{unit(r.p.ex)}</div>
          <div className="small">{r.d.why}</div>
        </div>
      ))}
      <button className="btn" onClick={save}>Save workout</button>
    </div></div>
  )
}
