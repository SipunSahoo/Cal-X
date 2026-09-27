import { useRef, useState } from 'react'
import { CHECKS, EX, TIERS, WEEK } from '../data/catalog'
import { activeTracks, addDays, buildSession, dayKey, lastSets, parseDay, readinessScore, targetOf, trainingNode, unit, type Decision, type ExerciseLog, type Planned } from '../engine/progression'
import { logExercise, undoLog } from '../engine/log'
import { CHECK_ICON, Icon, exIcon } from '../icons'
import { setState, useStore } from '../store'
import { CheckRow, Choice, Sheet, Stepper, toast } from '../ui'
import { NodeSheet } from './Skills'
import Plan from './Plan'
import Manual from './Manual'
import { BodyPrompt } from './Body'

export default function Today({ onStart, onBreathe }: { onStart: () => void; onBreathe: () => void }) {
  const s = useStore()
  const now = new Date(), todayKey = dayKey(now)
  const monday = addDays(now, -((now.getDay() + 6) % 7))
  const [sel, setSel] = useState(todayKey)
  const [sheet, setSheet] = useState<null | 'checkin' | string>(null)
  const [showPlan, setShowPlan] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [edit, setEdit] = useState<{ p: Planned; it: ExerciseLog } | null>(null)
  const selDate = parseDay(sel), plan = WEEK[selDate.getDay()], isToday = sel === todayKey
  const week = Math.max(1, Math.floor((now.getTime() - parseDay(s.startDate).getTime()) / 6048e5) + 1)
  const r = s.readiness[todayKey]
  const ses = buildSession(s, isToday ? r : undefined)
  const doneSession = s.sessions.find(x => x.date === sel)
  const mins = Math.round(ses.reduce((a, p) => a + p.sets * ((p.ex.hold ? p.target : p.target * 3) + (p.ex.track ? 90 : 60)), 0) / 60)
  const checks = s.checks[sel] ?? []
  const toggle = (k: string) => setState(x => ({ ...x, checks: { ...x.checks, [sel]: checks.includes(k) ? checks.filter(c => c !== k) : [...checks, k] } }))
  const firstTrack = activeTracks(s)[0]
  const push = trainingNode(s, firstTrack), pushNext = firstTrack.nodes[push.index + 1]

  const miniTiles = (group: 'session' | 'rhythm') => CHECKS.filter(c => c.group === group && (!c.on || c.on.includes(plan.kind)) && c.key !== 'yoga').map(c => {
    const on = checks.includes(c.key)
    return (
      <button key={c.key} className={`tile mini ${on ? 'on' : ''}`} onClick={() => toggle(c.key)} aria-pressed={on} title={c.title}>
        {on && <span className="tick"><Icon name="check" size={12} /></span>}
        <span className={`ico sm ${c.group === 'rhythm' ? 'breath' : ''}`}><Icon name={CHECK_ICON[c.key]} size={18} /></span>
        <span className="t">{c.short}</span>
      </button>
    )
  })

  // each row = a planned exercise and, if logged that day, its log (a level-up today still shows the exercise you did)
  const logged = (doneSession?.items ?? []).filter(it => it.sets.length)
  const canLog = sel <= todayKey
  const rows: Row[] = canLog || !doneSession
    ? ses.map(p => {
        const it = logged.find(l => l.id === p.ex.id || (p.ex.track && EX[l.id]?.track === p.ex.track))
        return it ? { p: { ex: EX[it.id], sets: it.planned, target: it.target, load: it.kg }, it } : { p }
      })
    : doneSession.items.map(it => ({ p: { ex: EX[it.id], sets: it.planned, target: it.target, load: it.kg }, it: it.sets.length ? it : undefined }))
  const lastTap = useRef<{ id: string; t: number }>({ id: '', t: 0 })
  const tapTimer = useRef<number | undefined>(undefined)
  const [ask, setAsk] = useState<Row | null>(null)
  const openEdit = (p: Planned, it?: ExerciseLog) => setEdit({ p, it: it ?? { id: p.ex.id, planned: p.sets, target: p.target, sets: Array.from({ length: p.sets }, () => ({ value: p.target, rpe: 8 })) } })
  const doneCount = rows.filter(x => x.it).length, allDone = rows.length > 0 && doneCount === rows.length

  const tick = (p: Planned) => {
    let d: Decision | undefined
    setState(x => { const r = logExercise(x, sel, p, Array.from({ length: p.sets }, () => ({ value: p.target, rpe: 8, kg: p.load })), true); d = r.decision; return r.state })
    if (d) toast(d.advanceTo ? `Mastered! Next time: ${d.advanceTo.name}` : d.tag === 'Increase' ? `Done. Next: ${d.next}${unit(p.ex)}${d.nextLoad ? ` @ ${d.nextLoad} kg` : ''}` : 'Done.')
  }

  return (
    <>
      <header className="row between" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">{isToday ? 'Today' : selDate.toLocaleDateString('en-GB', { weekday: 'long' })}</div>
          <h1 style={{ marginTop: 2 }}>{selDate.toLocaleDateString('en-GB', { weekday: isToday ? 'long' : undefined, day: 'numeric', month: 'long' })}</h1>
        </div>
        <button className="chip" onClick={() => setShowPlan(true)}><Icon name="calendar" size={15} /> Week {week} plan</button>
      </header>

      <nav style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginTop: 16 }}>
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(monday, i), k = dayKey(d), p = WEEK[d.getDay()]
          const done = s.sessions.some(x => x.date === k) || (p.kind === 'yoga' && s.checks[k]?.includes('yoga'))
          const on = k === sel
          return (
            <button key={k} onClick={() => setSel(k)} aria-pressed={on}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 0', borderRadius: 12, background: on ? 'var(--panel)' : undefined, border: `1px solid ${on ? 'var(--line-2)' : 'transparent'}` }}>
              <span className="tag">{d.toLocaleDateString('en-GB', { weekday: 'narrow' })}</span>
              <span className="num" style={{ fontSize: 17, color: k === todayKey ? 'var(--accent)' : undefined }}>{d.getDate()}</span>
              {done ? <span style={{ color: 'var(--good)', height: 8, display: 'grid', placeItems: 'center' }}><Icon name="check" size={11} /></span>
                : <span className="dot" style={{ margin: '1.5px 0', background: p.kind === 'strength' ? 'var(--accent)' : p.kind === 'yoga' ? 'var(--breath)' : 'var(--line-2)' }} />}
            </button>
          )
        })}
      </nav>

      {isToday && <BodyPrompt />}

      {isToday && plan.kind === 'strength' && doneCount === 0 && (
        <button className="tile row" style={{ marginTop: 14, width: '100%' }} onClick={() => setSheet('checkin')}>
          <span className={`ico ${r ? (r.score >= 70 ? 'good' : '') : 'muted'}`}><Icon name="bolt" /></span>
          {r ? <span className="grow"><span className="t">Readiness <span className="num" style={{ fontSize: 16, color: r.score >= 70 ? 'var(--good)' : r.score >= s.rules.lightBelow ? 'var(--warn)' : 'var(--bad)' }}>{r.score}</span></span>
            <div className="d">{r.pain ? 'Pain reported. Skip anything that hurts; see a professional if it persists.' : r.score >= 70 ? 'Good to train as planned.' : r.score >= s.rules.lightBelow ? 'Train as planned, stop 1–2 reps short.' : 'Lighter session: 1 set fewer each.'}</div></span>
            : <span className="grow"><span className="t">How do you feel?</span><div className="d">10-second check-in adjusts today's session</div></span>}
        </button>
      )}

      {plan.kind === 'strength' ? (
        <section className="section">
          <div className="tile hero">
            <div className="row">
              <span className="ico"><Icon name="dumbbell" /></span>
              <span className="grow"><h2>Full body circuit</h2><div className="d">{doneCount} of {rows.length} done · about {mins} min + warm-up</div></span>
            </div>
            <div className="bar"><i style={{ width: `${rows.length ? doneCount / rows.length * 100 : 0}%`, background: 'var(--good)' }} /></div>
            {allDone ? <div className="btn ghost" style={{ color: 'var(--good)' }}><Icon name="check" size={18} /> Completed</div>
              : canLog && !isToday ? <div className="d" style={{ textAlign: 'center' }}>Missed logging this day? Tap each exercise you did.</div>
              : isToday ? <><button className="btn" onClick={onStart}><Icon name="play" size={18} /> {doneCount ? `Continue guided workout (${rows.length - doneCount} left)` : 'Start guided workout'}</button>
                  <div className="d" style={{ textAlign: 'center' }}>Or train your own way and tap each exercise when it's done.</div></>
              : <div className="d">{doneSession ? 'Logged on this day.' : 'Preview. Targets update after each session.'}</div>}
          </div>
          <div className="grid2">
            {rows.map(({ p, it }) => {
              const ex = p.ex, last = lastSets(s, ex.id)
              const open = () => {
                if (!canLog) { setSheet(ex.id); toast('You can log this on the day.'); return }
                const now = Date.now(), dbl = lastTap.current.id === ex.id && now - lastTap.current.t < 350
                lastTap.current = { id: ex.id, t: now }
                window.clearTimeout(tapTimer.current)
                if (dbl) { openEdit(p, it); return }
                tapTimer.current = window.setTimeout(() => setAsk({ p, it }), 280)
              }
              return (
                <div key={ex.id} className={`tile ${it ? 'on' : ''}`} role="button" tabIndex={0} aria-pressed={!!it}
                  onClick={open} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } }} style={{ cursor: 'pointer', touchAction: 'manipulation', userSelect: 'none' }}>
                  <span className="row between">
                    <span className={`ico sm ${it ? 'good' : ''}`}><Icon name={it ? 'check' : exIcon(ex)} size={18} /></span>
                    <span className="n" style={{ fontSize: 18, color: it ? 'var(--good)' : undefined }}>{it ? it.sets.map(x => x.value).join('·') : `${p.sets}×${p.target}${unit(ex)}`}</span>
                  </span>
                  <span><div className="t">{ex.name}</div>
                    <div className="d">{(it ? it.kg : p.load) ? <b style={{ color: 'var(--text)' }}>{it ? it.kg : p.load} kg{ex.load?.perHand ? ' each' : ''} · </b> : null}{it ? (it.quick ? 'Done as planned' : 'Logged') + ' · tap to change' : canLog ? `Tap = done · double-tap = enter reps${last ? ` · last ${last.join('·')}` : ''}` : TIERS[ex.tier]}</div></span>
                  <button className="chip" style={{ alignSelf: 'flex-end', minHeight: 26, padding: '2px 10px', fontSize: 12 }} onClick={e => { e.stopPropagation(); setSheet(ex.id) }}>
                    <Icon name="info" size={13} /> How to</button>
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="section">
          <button className={`tile hero ${checks.includes('yoga') ? 'on' : ''}`} onClick={() => plan.kind === 'yoga' && toggle('yoga')} style={{ width: '100%' }}>
            {checks.includes('yoga') && <span className="tick"><Icon name="check" size={12} /></span>}
            <div className="row">
              <span className="ico breath"><Icon name={plan.kind === 'yoga' ? 'lotus' : 'rest'} /></span>
              <span className="grow"><h2>{plan.kind === 'yoga' ? 'Hatha yoga' : 'Rest day'}</h2><div className="d">{plan.yoga}</div></span>
            </div>
            <div className="d">{plan.kind === 'yoga' ? 'About 35 min. Tap this tile when done.' : 'Strength is built on rest days too.'}</div>
          </button>
          {isToday && !doneSession && <button className="btn ghost" onClick={onStart}>Train calisthenics anyway</button>}
        </section>
      )}

      {plan.kind === 'strength' && (
        <section className="section">
          <div className="section-head"><h2>Warm-up & cool-down</h2><span className="tag">{CHECKS.filter(c => c.group === 'session' && c.on?.includes('strength') && checks.includes(c.key)).length}/5</span></div>
          <div className="grid3">{miniTiles('session')}</div>
        </section>
      )}

      {plan.kind === 'strength' && pushNext && (
        <section className="section">
          <button className="tile row" onClick={() => setSheet(push.id)}>
            <span className="ico"><Icon name="target" /></span>
            <span className="grow"><span className="t">Next unlock: {pushNext.name}</span>
              <div className="bar" style={{ margin: '8px 0 4px' }}><i style={{ width: `${Math.min(100, Math.round(targetOf(s, push) / push.hi * 100))}%` }} /></div>
              <div className="d">{push.name}: {targetOf(s, push)} of {push.hi}{unit(push)} per set</div></span>
          </button>
        </section>
      )}

      <section className="section">
        <button className="tile row" onClick={() => setShowManual(true)}>
          <span className="ico good"><Icon name="info" /></span>
          <span className="grow"><span className="t">Exercise manual</span><div className="d">How to do each exercise, why it helps, and the basics of training safely</div></span>
          <Icon name="play" size={16} />
        </button>
      </section>

      <section className="section">
        <div className="section-head"><h2>Daily rhythm</h2><span className="tag">{plan.evening}</span></div>
        <div className="grid3">{miniTiles('rhythm')}</div>
        <button className="tile row" onClick={onBreathe}>
          <span className="ico breath"><Icon name="breath" /></span>
          <span className="grow"><span className="t">Pranayama</span><div className="d">Guided breathing with soft bowl cues</div></span>
          <span style={{ color: 'var(--breath)' }}><Icon name="play" /></span>
        </button>
      </section>

      {showPlan && <Plan onClose={() => setShowPlan(false)} />}
      {showManual && <Manual onClose={() => setShowManual(false)} />}
      {edit && <LogEdit row={edit} date={sel} onClose={() => setEdit(null)} />}
      {ask && (
        <Sheet onClose={() => setAsk(null)}>
          <div className="row">
            <span className={`ico ${ask.it ? 'good' : ''}`}><Icon name={ask.it ? 'check' : exIcon(ask.p.ex)} /></span>
            <span className="grow"><h2>{ask.it ? `Mark ${ask.p.ex.name} as not done?` : `Mark ${ask.p.ex.name} done?`}</h2>
              <div className="d">{ask.it ? `Logged: ${ask.it.sets.map(x => x.value).join(' · ')}${unit(ask.p.ex)}. Your target goes back to ${ask.it.target}${unit(ask.p.ex)}.` : `As planned: ${ask.p.sets} × ${ask.p.target}${unit(ask.p.ex) || ' reps'}${ask.p.load ? ` at ${ask.p.load} kg` : ''}`}</div></span>
          </div>
          <div className="row">
            <button className="btn ghost" onClick={() => setAsk(null)}>No</button>
            <button className="btn" style={ask.it ? { background: 'var(--bad)', color: '#fff' } : undefined}
              onClick={() => { const a = ask; setAsk(null); if (a.it) { setState(x => undoLog(x, sel, a.p.ex.id)); toast('Marked as not done.') } else tick(a.p) }}>Yes</button>
          </div>
          <button className="chip" style={{ alignSelf: 'center' }} onClick={() => { const a = ask; setAsk(null); openEdit(a.p, a.it) }}>
            <Icon name="edit" size={14} /> {ask.it ? 'Change reps instead' : 'Enter actual reps instead'}</button>
        </Sheet>
      )}
      {sheet === 'checkin' && <CheckIn onClose={() => setSheet(null)} />}
      {sheet && sheet !== 'checkin' && <NodeSheet id={sheet} onClose={() => setSheet(null)} />}
    </>
  )
}

function CheckIn({ onClose }: { onClose: () => void }) {
  const s = useStore(), k = dayKey()
  const [c, setC] = useState(s.readiness[k] ?? { sleep: 2, energy: 2, sore: 1, pain: false, score: 0 })
  const save = () => { setState(x => ({ ...x, readiness: { ...x.readiness, [k]: { ...c, score: readinessScore(c.sleep, c.energy, c.sore) } } })); onClose() }
  return (
    <Sheet onClose={onClose}>
      <h2>Daily check-in</h2>
      <div className="stack"><div className="eyebrow">Sleep last night</div><Choice options={[[0, '<6h'], [1, '6–7h'], [2, '7–8h'], [3, '8h+']]} value={c.sleep} onChange={v => setC({ ...c, sleep: v })} /></div>
      <div className="stack"><div className="eyebrow">Energy</div><Choice options={[[0, 'Very low'], [1, 'Low'], [2, 'OK'], [3, 'Good'], [4, 'Great']]} value={c.energy} onChange={v => setC({ ...c, energy: v })} /></div>
      <div className="stack"><div className="eyebrow">Muscle soreness</div><Choice options={[[0, 'None'], [1, 'Light'], [2, 'Moderate'], [3, 'High'], [4, 'Severe']]} value={c.sore} onChange={v => setC({ ...c, sore: v })} /></div>
      <CheckRow on={c.pain} tone="good" onToggle={() => setC({ ...c, pain: !c.pain })} title="Any sharp or joint pain?" sub="Cal-X can't diagnose pain. If it's sharp or lasting, see a physio or doctor." />
      <button className="btn" onClick={save}>Save</button>
    </Sheet>
  )
}

type Row = { p: Planned; it?: ExerciseLog }

/** Edit what you actually did for a ticked exercise, or unmark it. */
function LogEdit({ row, date, onClose }: { row: { p: Planned; it: ExerciseLog }; date: string; onClose: () => void }) {
  const { p, it } = row, U = unit(p.ex)
  const [vals, setVals] = useState(it.sets.map(x => x.value))
  const [rpe, setRpe] = useState(Math.max(...it.sets.map(x => x.rpe)))
  const [kg, setKg] = useState(it.sets[0]?.kg ?? p.load)
  const save = () => {
    let d: Decision | undefined
    setState(x => { const r = logExercise(x, date, { ...p, load: kg ?? p.load }, vals.map(value => ({ value, rpe, kg })), false); d = r.decision; return r.state })
    if (d) toast(`Saved. ${d.tag}: next target ${d.next}${U}`)
    onClose()
  }
  return (
    <Sheet onClose={onClose}>
      <div className="row between"><button className="chip" onClick={onClose}>Cancel</button><span className="t">{p.ex.name}</span>
        <button className="chip" style={{ background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'var(--accent)', fontWeight: 700 }} onClick={save}>Save</button></div>
      <div className="d">Target was {p.sets} × {p.target}{U || ' reps'}. Enter what you actually did so the next target is right.</div>
      {p.ex.load && kg != null && p.ex.load.inc > 0 && (
        <div className="tile row"><span className="grow t">Weight{p.ex.load.perHand ? ' (each)' : ''}</span>
          <Stepper value={kg} min={0} max={400} step={p.ex.load.barbell ? 2.5 : p.ex.load.inc} suffix=" kg" onChange={setKg} /></div>
      )}
      <div className="card list">
        {vals.map((v, k) => (
          <div key={k} className="item"><span className="grow">Set {k + 1}</span>
            <Stepper value={v} min={0} max={500} step={p.ex.hold ? 5 : 1} suffix={U} onChange={n => setVals(vals.map((x, j) => j === k ? n : x))} /></div>
        ))}
      </div>
      <div className="stack" style={{ gap: 8 }}><div className="eyebrow">How hard was it? (effort out of 10)</div>
        <Choice options={[[6, '6 Easy'], [7, '7 Solid'], [8, '8 Hard'], [9, '9 Grind'], [10, '10 Max']]} value={rpe} onChange={setRpe} /></div>
      <button className="btn ghost" style={{ color: 'var(--bad)' }} onClick={() => { setState(x => undoLog(x, date, p.ex.id)); toast('Unmarked.'); onClose() }}>
        <Icon name="close" size={18} /> Unmark as not done</button>
    </Sheet>
  )
}
