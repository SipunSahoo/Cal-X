import { useEffect, useState } from 'react'
import { TIERS, trackById } from '../data/catalog'
import { bests, buildSession, dayKey, evaluate, lastSets, unit, type Decision, type Planned, type SetLog, plates, warmups } from '../engine/progression'
import { setState, useStore } from '../store'
import { Sheet, toast } from '../ui'
import { GuideBody } from './Manual'
import { mergeIntoDay } from '../engine/log'

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
  // exercises already ticked on Today are skipped, so the workout continues where you left off
  const [items] = useState(() => { const done = s.sessions.find(x => x.date === dayKey())?.items.filter(it => it.sets.length).map(it => it.id) ?? []; return buildSession(s, s.readiness[dayKey()]).filter(p => !done.includes(p.ex.id)) })
  const [i, setI] = useState(0)
  const [logs, setLogs] = useState<SetLog[][]>(() => items.map(() => []))
  const [pain, setPain] = useState<Record<number, boolean>>({})
  const [val, setVal] = useState(items[0]?.target ?? 0)
  const [kg, setKg] = useState(items[0]?.load)
  const [rpe, setRpe] = useState(7)
  const [restEnd, setRestEnd] = useState<number | null>(null)
  const [holdStart, setHoldStart] = useState<number | null>(null)
  const [t0] = useState(Date.now)
  const [summary, setSummary] = useState<null | { minutes: number; results: { p: Planned; sets: SetLog[]; d: Decision; pain: boolean }[] }>(null)
  const [, tick] = useState(0)
  const [confirmQuit, setConfirmQuit] = useState(false)
  const [howTo, setHowTo] = useState(false)

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

  const goTo = (k: number) => { setI(k); setVal(items[k].target); setKg(items[k].load); setRpe(7); setHoldStart(null) }
  const finish = (finalLogs = logs, finalPain = pain) => {
    const results = items.map((pl, k) => { const used = { ...pl, load: finalLogs[k].at(-1)?.kg ?? pl.load }; return { p: used, sets: finalLogs[k], d: evaluate(used, finalLogs[k], s.rules, finalPain[k]), pain: !!finalPain[k] } })
    setRestEnd(null); setSummary({ minutes: Math.max(1, Math.round((Date.now() - t0) / 60000)), results })
  }
  const next = (l = logs, pn = pain) => (i === items.length - 1 ? finish(l, pn) : goTo(i + 1))

  const completeSet = () => {
    const value = holdStart ? Math.floor((Date.now() - holdStart) / 1000) : val
    const l = logs.map((x, k) => (k === i ? [...x, { value, rpe, kg: p.ex.load ? kg : undefined }] : x))
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
      <div className="full focus"><div className="stack" style={{ minHeight: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 18 }}>
        <div className="tag">Rest</div>
        <div className="num" style={{ fontSize: 120, lineHeight: 1, fontWeight: 800 }}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</div>
        <div className="muted">Next: {n.ex.name}, set {logs[i].length + 1} · {n.target}{unit(n.ex) || ' reps'}</div>
        <div className="row" style={{ width: '100%', maxWidth: 320 }}>
          <button className="btn ghost" onClick={() => setRestEnd(restEnd + 15000)}>+15 s</button>
          <button className="btn" onClick={() => setRestEnd(null)}>Skip rest</button>
        </div>
      </div></div>
    )
  }

  const holding = holdStart !== null
  return (
    <div className="full focus"><div className="stack" style={{ gap: 16 }}>
      <div className="row between">
        {confirmQuit
          ? <span className="row"><button className="chip" style={{ color: 'var(--bad)' }} onClick={onClose}>Discard workout</button><button className="chip" onClick={() => setConfirmQuit(false)}>Keep going</button></span>
          : <button className="chip" onClick={() => setConfirmQuit(true)}>✕ Quit</button>}
        <span className="small muted">{i + 1} / {items.length}</span>
        <button className="chip" onClick={() => finish()}>Finish</button>
      </div>
      <div className="row" style={{ gap: 3 }}>
        {items.map((_, k) => <button key={k} aria-label={`Go to exercise ${k + 1}`} onClick={() => goTo(k)} style={{ flex: 1, height: 14, display: 'flex', alignItems: 'center' }}>
          <i style={{ flex: 1, height: 3, background: logs[k].length >= items[k].sets ? 'var(--accent)' : k === i ? 'var(--text)' : 'var(--line-2)' }} /></button>)}
      </div>

      <div>
        <div className="tag">{String(i + 1).padStart(2, '0')} · {ex.track ? `${TIERS[ex.tier]} · ${trackById(ex.track)?.name}` : 'Accessory'}{ex.perSide ? ' · per side' : ''}</div>
        <h1 style={{ fontSize: 36, marginTop: 6 }}>{ex.name}</h1>
      </div>

      <div className="stats">
        <div className="stat"><div className="num">{Math.min(done + 1, p.sets)}<span className="muted">/{p.sets}</span></div><div className="tag">Set</div></div>
        <div className="stat"><div className="num">{p.target}{U}</div><div className="tag">{ex.load && kg ? `Target · ${kg} kg` : 'Target'}</div></div>
        <div className="stat"><div className="num muted">{last?.[done] != null ? `${last[done]}${U}` : '–'}</div><div className="tag">Last time</div></div>
      </div>

      {ex.load && kg != null && ex.load.inc > 0 && (
        <div className="panel stack" style={{ gap: 8 }}>
          <div className="row between">
            <button className="btn ghost" style={{ width: 64, minHeight: 44 }} aria-label="Less weight" onClick={() => setKg(w => Math.max(0, (w ?? 0) - (ex.load!.barbell ? 2.5 : ex.load!.inc)))}>−</button>
            <div style={{ textAlign: 'center' }}><div className="num" style={{ fontSize: 34, lineHeight: 1 }}>{kg} kg</div><div className="tag">{ex.load.perHand ? 'each dumbbell' : ex.load.barbell ? 'on the bar' : 'weight'}</div></div>
            <button className="btn ghost" style={{ width: 64, minHeight: 44 }} aria-label="More weight" onClick={() => setKg(w => (w ?? 0) + (ex.load!.barbell ? 2.5 : ex.load!.inc))}>+</button>
          </div>
          {ex.load.barbell && <div className="d" style={{ textAlign: 'center' }}>Each side: {plates(kg).length ? plates(kg).join(' + ') + ' kg' : 'empty 20 kg bar'}</div>}
          {ex.load.barbell && done === 0 && <div className="d" style={{ textAlign: 'center' }}>Warm up first: {warmups(kg).map(w => `${w.kg} kg × ${w.reps}`).join(' → ')}</div>}
        </div>
      )}

      {ex.hold && (
        <button className="panel" style={{ textAlign: 'center', padding: 18, borderColor: holding ? 'var(--accent)' : undefined }}
          onClick={() => { if (holding) { setVal(Math.floor((Date.now() - holdStart) / 1000)); setHoldStart(null) } else setHoldStart(Date.now()) }}>
          <div className="num" style={{ fontSize: 64, color: holding ? 'var(--accent)' : undefined }}>{holding ? Math.floor((Date.now() - holdStart) / 1000) : val}s</div>
          <div className="tag">{holding ? 'Tap to stop' : 'Tap to start the hold timer'}</div>
        </button>
      )}
      {!holding && (
        <div className="row between" style={{ borderTop: '1px solid var(--line-2)', borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
          <button className="btn ghost" style={{ width: 72 }} aria-label="Less" onClick={() => setVal(v => Math.max(0, v - (ex.hold ? 5 : 1)))}>−</button>
          <div style={{ textAlign: 'center' }}><div className="num" style={{ fontSize: 60, lineHeight: 1 }}>{val}</div><div className="tag">{ex.hold ? 'seconds' : 'reps'} done</div></div>
          <button className="btn ghost" style={{ width: 72 }} aria-label="More" onClick={() => setVal(v => v + (ex.hold ? 5 : 1))}>+</button>
        </div>
      )}

      <div>
        <div className="tag" style={{ marginBottom: 8 }}>Effort · out of 10</div>
        <div className="row" style={{ gap: 4 }}>
          {RPE.map(([v, l]) => <button key={v} className={`chip ${rpe === v ? 'on' : ''}`} style={{ flex: 1, flexDirection: 'column', gap: 0, padding: '7px 0' }} onClick={() => setRpe(v)}>
            <b className="num" style={{ fontSize: 16 }}>{v}</b><span style={{ fontSize: 10, fontWeight: 500 }}>{l}</span></button>)}
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
        <button className="chip" onClick={() => setHowTo(true)}>How to</button>
      </div>
      {howTo && <Sheet onClose={() => setHowTo(false)}><h2>{ex.name}</h2><GuideBody ex={ex} /></Sheet>}
      {items[i + 1] && <div className="small muted">Up next: {items[i + 1].ex.name} · {items[i + 1].sets} × {items[i + 1].target}{unit(items[i + 1].ex)}</div>}
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
      const targets = { ...x.targets }, loads = { ...x.loads }, mastered = [...x.mastered], unlocked = new Set<string>()
      for (const r of results) {
        targets[r.p.ex.id] = r.d.next
        if (r.d.nextLoad != null) loads[r.p.ex.id] = r.d.nextLoad
        if (r.d.tag === 'Level up' && !mastered.includes(r.p.ex.id)) { mastered.push(r.p.ex.id); unlocked.add(r.p.ex.id) }
      }
      const items = results.map(r => ({ id: r.p.ex.id, planned: r.p.sets, target: r.p.target, sets: r.sets, pain: r.pain || undefined, unlocked: unlocked.has(r.p.ex.id) || undefined, kg: r.p.load }))
      return { ...x, targets, loads, mastered, sessions: mergeIntoDay(x.sessions, dayKey(), items, minutes) }
    })
    const ups = results.filter(r => r.d.advanceTo).map(r => r.d.advanceTo!.name)
    toast(ups.length ? `Unlocked: ${ups.join(', ')}` : 'Workout saved.')
    onDone()
  }
  return (
    <div className="full focus"><div className="stack" style={{ gap: 14 }}>
      <div className="tag">Session complete · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div><h1>Logged.</h1>
      <div className="stats">
        {[[minutes, 'minutes'], [results.reduce((a, r) => a + r.sets.length, 0), 'sets'], [prs.length, 'records']].map(([v, l]) =>
          <div key={l} className="stat"><div className="num">{v}</div><div className="tag">{l}</div></div>)}
      </div>
      <div className="eyebrow" style={{ marginTop: 10 }}>Next session</div>
      {results.map((r, k) => (
        <div key={r.p.ex.id} className="card stack" style={{ gap: 6 }}>
          <div className="row between"><span className="row"><span className="idx">{String(k + 1).padStart(2, '0')}</span><b>{r.p.ex.name}</b></span><span className="tag" style={{ color: TAG_COLOR[r.d.tag] }}>{r.d.tag}</span></div>
          <div className="small muted">Logged {r.sets.length ? r.sets.map(x => x.value).join(' · ') + unit(r.p.ex) : 'nothing'} · target {r.p.sets} × {r.p.target}{unit(r.p.ex)}</div>
          <div className="small">{r.d.why}</div>
        </div>
      ))}
      <button className="btn" onClick={save}>Save workout</button>
    </div></div>
  )
}
