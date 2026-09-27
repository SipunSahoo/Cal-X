import { useState } from 'react'
import { CHECKS, EX, TIERS, TRACKS, WEEK } from '../data/catalog'
import { addDays, buildSession, dayKey, lastSets, parseDay, readinessScore, targetOf, trainingNode, unit } from '../engine/progression'
import { CHECK_ICON, Icon, exIcon } from '../icons'
import { setState, useStore } from '../store'
import { CheckRow, Choice, Sheet } from '../ui'
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
  const selDate = parseDay(sel), plan = WEEK[selDate.getDay()], isToday = sel === todayKey
  const week = Math.max(1, Math.floor((now.getTime() - parseDay(s.startDate).getTime()) / 6048e5) + 1)
  const r = s.readiness[todayKey]
  const ses = buildSession(s, isToday ? r : undefined)
  const doneSession = s.sessions.find(x => x.date === sel)
  const mins = Math.round(ses.reduce((a, p) => a + p.sets * ((p.ex.hold ? p.target : p.target * 3) + (p.ex.track ? 90 : 60)), 0) / 60)
  const checks = s.checks[sel] ?? []
  const toggle = (k: string) => setState(x => ({ ...x, checks: { ...x.checks, [sel]: checks.includes(k) ? checks.filter(c => c !== k) : [...checks, k] } }))
  const push = trainingNode(s, TRACKS[0]), pushNext = TRACKS[0].nodes[push.index + 1]

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

  const tiles = doneSession
    ? doneSession.items.map(it => ({ id: it.id, big: it.sets.length ? it.sets.map(x => x.value).join('·') : '–', sub: it.sets.length ? 'logged' : 'skipped' }))
    : ses.map(p => { const last = lastSets(s, p.ex.id); return { id: p.ex.id, big: `${p.sets}×${p.target}${unit(p.ex)}`, sub: last ? `last ${last.join('·')}` : TIERS[p.ex.tier] } })

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

      {isToday && plan.kind === 'strength' && !doneSession && (
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
              <span className="grow"><h2>Full body circuit</h2><div className="d">{tiles.length} exercises · {doneSession ? `${doneSession.minutes} min` : `about ${mins} min`} + warm-up</div></span>
            </div>
            {doneSession ? <div className="btn ghost" style={{ color: 'var(--good)' }}><Icon name="check" size={18} /> Completed</div>
              : isToday ? <button className="btn" onClick={onStart}><Icon name="play" size={18} /> Start workout</button>
              : <div className="d">Preview. Targets update after each session.</div>}
          </div>
          <div className="grid2">
            {tiles.map(({ id, big, sub }) => {
              const ex = EX[id]
              return (
                <button key={id} className="tile" onClick={() => setSheet(id)}>
                  <span className="row between"><span className="ico sm"><Icon name={ex ? exIcon(ex) : 'target'} size={18} /></span><span className="n" style={{ fontSize: 18 }}>{big}</span></span>
                  <span><div className="t">{ex?.name ?? id}</div><div className="d">{sub}</div></span>
                </button>
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
