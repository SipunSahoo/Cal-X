import { useState } from 'react'
import { CHECKS, EX, TIERS, TRACKS, WEEK } from '../data/catalog'
import { addDays, buildSession, dayKey, lastSets, parseDay, readinessScore, targetOf, trainingNode, unit } from '../engine/progression'
import { setState, useStore } from '../store'
import { CheckRow, Choice, Sheet } from '../ui'
import { NodeSheet } from './Skills'

const pad = (n: number) => String(n).padStart(2, '0')

export default function Today({ onStart, onBreathe }: { onStart: () => void; onBreathe: () => void }) {
  const s = useStore()
  const now = new Date(), todayKey = dayKey(now)
  const monday = addDays(now, -((now.getDay() + 6) % 7))
  const [sel, setSel] = useState(todayKey)
  const [sheet, setSheet] = useState<null | 'checkin' | string>(null)
  const selDate = parseDay(sel), plan = WEEK[selDate.getDay()], isToday = sel === todayKey
  const week = Math.max(1, Math.floor((now.getTime() - parseDay(s.startDate).getTime()) / 6048e5) + 1)
  const r = s.readiness[todayKey]
  const ses = buildSession(s, isToday ? r : undefined)
  const doneSession = s.sessions.find(x => x.date === sel)
  const mins = Math.round(ses.reduce((a, p) => a + p.sets * ((p.ex.hold ? p.target : p.target * 3) + (p.ex.track ? 90 : 60)), 0) / 60)
  const checks = s.checks[sel] ?? []
  const toggle = (k: string) => setState(x => ({ ...x, checks: { ...x.checks, [sel]: checks.includes(k) ? checks.filter(c => c !== k) : [...checks, k] } }))
  const push = trainingNode(s, TRACKS[0]), pushNext = TRACKS[0].nodes[push.index + 1]

  const checkList = (group: 'session' | 'rhythm') => CHECKS.filter(c => c.group === group && (!c.on || c.on.includes(plan.kind))).map(c => (
    <div key={c.key} className="row">
      <div className="grow"><CheckRow on={checks.includes(c.key)} onToggle={() => toggle(c.key)}
        title={c.key === 'ysec' ? `Yoga sector: ${plan.yoga}` : c.key === 'yoga' ? `Hatha yoga: ${plan.yoga}` : c.title}
        sub={c.key === 'evening' ? plan.evening : c.sub} /></div>
      {(c.key === 'morning' || c.key === 'night') && <button className="chip" style={{ color: 'var(--breath)', borderColor: 'var(--breath)' }} onClick={onBreathe}>Breathe</button>}
    </div>
  ))

  const rows = doneSession
    ? doneSession.items.map(it => ({ id: it.id, right: it.sets.length ? it.sets.map(x => x.value).join(' · ') : 'skipped' }))
    : ses.map(p => ({ id: p.ex.id, right: `${p.sets}×${p.target}${unit(p.ex)}` }))

  return (
    <>
      <header className="row between" style={{ alignItems: 'flex-end' }}>
        <div className="row" style={{ alignItems: 'flex-end', gap: 12 }}>
          <span className="num" style={{ fontSize: 64, lineHeight: .82, fontWeight: 800 }}>{pad(selDate.getDate())}</span>
          <span><div className="wide" style={{ fontWeight: 700, fontSize: 16 }}>{selDate.toLocaleDateString('en-GB', { weekday: 'long' })}</div>
            <div className="tag">{selDate.toLocaleDateString('en-GB', { month: 'long' })}{isToday ? ' · today' : ''}</div></span>
        </div>
        <span className="tag">Week {pad(week)}</span>
      </header>

      <nav style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginTop: 18, borderTop: '1px solid var(--line-2)', borderBottom: '1px solid var(--line)' }}>
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(monday, i), k = dayKey(d), p = WEEK[d.getDay()]
          const done = s.sessions.some(x => x.date === k) || (p.kind === 'yoga' && s.checks[k]?.includes('yoga'))
          return (
            <button key={k} onClick={() => setSel(k)} aria-pressed={k === sel}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '9px 0 8px', boxShadow: k === sel ? 'inset 0 -2px var(--accent)' : undefined }}>
              <span className="tag">{d.toLocaleDateString('en-GB', { weekday: 'narrow' })}</span>
              <span className="num" style={{ fontSize: 17, color: k === todayKey ? 'var(--accent)' : k === sel ? 'var(--text)' : 'var(--muted)' }}>{d.getDate()}</span>
              <span className="dot" style={{ background: done ? 'var(--good)' : p.kind === 'strength' ? 'var(--accent)' : p.kind === 'yoga' ? 'var(--breath)' : 'transparent', border: p.kind === 'rest' ? '1px solid var(--line-2)' : 0 }} />
            </button>
          )
        })}
      </nav>

      {isToday && plan.kind === 'strength' && !doneSession && (
        <button className="item" style={{ borderBottom: '1px solid var(--line)' }} onClick={() => setSheet('checkin')}>
          {r ? <>
            <span className="num" style={{ fontSize: 30, width: 52, color: r.score >= 70 ? 'var(--good)' : r.score >= s.rules.lightBelow ? 'var(--warn)' : 'var(--bad)' }}>{r.score}</span>
            <span className="grow"><span className="tag">Readiness</span><div className="small">{r.pain ? 'Pain reported. Skip anything that hurts. See a professional if it persists.' : r.score >= 70 ? 'Good to train as planned.' : r.score >= s.rules.lightBelow ? 'Train as planned, stop 1–2 reps short.' : 'Lighter session applied: 1 set fewer each.'}</div></span>
          </> : <>
            <span className="grow"><b>How do you feel today?</b><div className="small muted">10-second check-in. Adjusts today's session.</div></span>
            <span className="chip">Check in</span>
          </>}
        </button>
      )}

      {plan.kind === 'strength' ? (
        <section className="section">
          <div className="row between" style={{ alignItems: 'flex-end' }}>
            <div><div className="tag">Strength circuit · {rows.length} exercises</div><h1 style={{ marginTop: 4 }}>Full body</h1></div>
            <div style={{ textAlign: 'right' }}><span className="num" style={{ fontSize: 28 }}>{doneSession ? doneSession.minutes : mins}</span><span className="tag"> min</span></div>
          </div>
          <div className="card list">
            {rows.map(({ id, right }, k) => {
              const ex = EX[id], last = lastSets(s, id)
              return (
                <button key={id} className="item" onClick={() => setSheet(id)}>
                  <span className="idx">{pad(k + 1)}</span>
                  <span className="grow"><b style={{ fontWeight: 600 }}>{ex?.name ?? id}</b>
                    <div className="small muted">{ex?.track ? `${TIERS[ex.tier]} · ${ex.track}` : 'Accessory'}{!doneSession && last ? ` · last ${last.join('·')}${ex ? unit(ex) : ''}` : ''}</div></span>
                  <span className="num" style={{ fontSize: 17 }}>{right}</span>
                </button>
              )
            })}
          </div>
          {doneSession ? <div className="btn ghost" style={{ color: 'var(--good)', borderColor: 'var(--good)' }}>✓ Completed</div>
            : isToday ? <button className="btn" onClick={onStart}>Start workout</button>
            : <div className="small muted">Preview. Targets update after each session.</div>}
        </section>
      ) : (
        <section className="section">
          <div className="tag">{plan.kind === 'yoga' ? 'Hatha yoga · 35 min' : 'Rest day'}</div>
          <h1>{plan.kind === 'yoga' ? plan.yoga : 'Recover'}</h1>
          <div className="small muted">{plan.kind === 'yoga' ? 'Tick it off below. Full yoga tracking comes later.' : `${plan.yoga}. Strength is built on rest days too.`}</div>
          {isToday && !doneSession && <button className="btn ghost" onClick={onStart}>Train calisthenics anyway</button>}
        </section>
      )}

      {plan.kind !== 'rest' && <section className="section"><div className="eyebrow">{plan.kind === 'strength' ? 'Warm-up & cool-down' : 'Session'}</div><div className="card list">{checkList('session')}</div></section>}

      {plan.kind === 'strength' && pushNext && (
        <section className="section"><div className="eyebrow">Next unlock</div>
          <button className="card" onClick={() => setSheet(push.id)}>
            <div className="row between"><b>{push.name} → {pushNext.name}</b><span className="num small">{targetOf(s, push)}/{push.hi}{unit(push)}</span></div>
            <div className="bar" style={{ marginTop: 10 }}><i style={{ width: `${Math.min(100, Math.round(targetOf(s, push) / push.hi * 100))}%` }} /></div>
          </button>
        </section>
      )}

      <section className="section"><div className="eyebrow">Daily rhythm</div><div className="card list">{checkList('rhythm')}</div></section>

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
