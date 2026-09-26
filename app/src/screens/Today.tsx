import { useState } from 'react'
import { CHECKS, EX, TIERS, TRACKS, WEEK } from '../data/catalog'
import { addDays, buildSession, dayKey, lastSets, readinessScore, targetOf, trainingNode, unit } from '../engine/progression'
import { setState, useStore } from '../store'
import { CheckRow, Choice, Sheet } from '../ui'
import { NodeSheet } from './Skills'

export default function Today({ onStart }: { onStart: () => void }) {
  const s = useStore()
  const now = new Date(), todayKey = dayKey(now)
  const monday = addDays(now, -((now.getDay() + 6) % 7))
  const [sel, setSel] = useState(todayKey)
  const [sheet, setSheet] = useState<null | 'checkin' | string>(null)
  const selDate = new Date(sel + 'T12:00'), plan = WEEK[selDate.getDay()], isToday = sel === todayKey
  const r = s.readiness[todayKey]
  const ses = buildSession(s, isToday ? r : undefined)
  const doneSession = s.sessions.find(x => x.date === sel)
  const mins = Math.round(ses.reduce((a, p) => a + p.sets * ((p.ex.hold ? p.target : p.target * 3) + (p.ex.track ? 90 : 60)), 0) / 60)
  const checks = s.checks[sel] ?? []
  const toggle = (k: string) => setState(x => ({ ...x, checks: { ...x.checks, [sel]: checks.includes(k) ? checks.filter(c => c !== k) : [...checks, k] } }))
  const push = trainingNode(s, TRACKS[0]), pushNext = TRACKS[0].nodes[push.index + 1]

  const checkList = (group: 'session' | 'rhythm') => CHECKS.filter(c => c.group === group && (!c.on || c.on.includes(plan.kind))).map(c => (
    <CheckRow key={c.key} on={checks.includes(c.key)} onToggle={() => toggle(c.key)}
      title={c.key === 'ysec' ? `Yoga sector: ${plan.yoga}` : c.key === 'yoga' ? `Hatha yoga: ${plan.yoga}` : c.title}
      sub={c.key === 'evening' ? plan.evening : c.sub} />
  ))

  return (
    <>
      <div className="eyebrow">{isToday ? 'Today' : 'Plan'}</div>
      <h1 style={{ marginTop: 4 }}>{selDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginTop: 16 }}>
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(monday, i), k = dayKey(d), p = WEEK[d.getDay()]
          const done = s.sessions.some(x => x.date === k) || (p.kind === 'yoga' && s.checks[k]?.includes('yoga'))
          return (
            <button key={k} onClick={() => setSel(k)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 0', borderRadius: 12, border: `1px solid ${k === sel ? 'var(--line)' : 'transparent'}`, background: k === sel ? 'var(--card-2)' : undefined }}>
              <span className="small muted">{d.toLocaleDateString('en-GB', { weekday: 'narrow' })}</span>
              <span className="num" style={{ fontSize: 20, color: k === todayKey ? 'var(--accent)' : undefined }}>{d.getDate()}</span>
              <span className="dot" style={{ background: done ? 'var(--good)' : p.kind === 'strength' ? 'var(--accent)' : p.kind === 'yoga' ? 'var(--steel)' : 'var(--locked)' }} />
            </button>
          )
        })}
      </div>

      {isToday && plan.kind === 'strength' && !doneSession && (
        <button className="card row" style={{ marginTop: 16, width: '100%' }} onClick={() => setSheet('checkin')}>
          {r ? <>
            <span className="num" style={{ fontSize: 34, color: r.score >= 70 ? 'var(--good)' : r.score >= s.rules.lightBelow ? 'var(--warn)' : 'var(--bad)' }}>{r.score}</span>
            <span className="grow"><b>Readiness</b><div className="small muted">{r.pain ? 'Pain reported. Skip anything that hurts. See a professional if it persists.' : r.score >= 70 ? 'Good to train as planned.' : r.score >= s.rules.lightBelow ? 'Train as planned, stop 1–2 reps short.' : 'Lighter session applied: 1 set fewer each.'}</div></span>
          </> : <>
            <span className="grow"><b>How do you feel today?</b><div className="small muted">10-second check-in. Adjusts today's session.</div></span>
            <span className="chip">Check in</span>
          </>}
        </button>
      )}

      <div className="section">
        {plan.kind === 'strength' ? (
          <div className="card stack">
            <div className="row between">
              <div><div className="eyebrow">Strength circuit · {ses.length} exercises</div><h2 style={{ marginTop: 4 }}>Full body</h2></div>
              <div style={{ textAlign: 'right' }}><div className="num" style={{ fontSize: 26 }}>{mins}<span className="small muted"> min</span></div><div className="small muted">+ warm-up & cool-down</div></div>
            </div>
            <div className="list">
              {(doneSession ? doneSession.items.map(it => ({ id: it.id, label: it.sets.length ? it.sets.map(x => x.value).join(' · ') : 'skipped' })) : ses.map(p => ({ id: p.ex.id, label: `${p.sets} × ${p.target}${unit(p.ex)}` }))).map(({ id, label }) => {
                const p = EX[id]
                const last = lastSets(s, id)
                return (
                  <button key={id} className="item" onClick={() => setSheet(id)}>
                    <span className="grow"><b style={{ fontWeight: 600 }}>{p?.name ?? id}</b>
                      <div className="small muted">{p?.track ? `${TIERS[p.tier]} · ${p.track}` : 'Accessory'}{!doneSession && last ? ` · last ${last.join('·')}${p ? unit(p) : ''}` : ''}</div></span>
                    <span className="num" style={{ fontSize: 20 }}>{label}</span>
                  </button>
                )
              })}
            </div>
            {doneSession ? <div className="chip on">✓ Completed · {doneSession.minutes} min</div>
              : isToday ? <button className="btn" onClick={onStart}>Start workout</button>
              : <div className="small muted" style={{ textAlign: 'center' }}>Preview. Targets update after each session.</div>}
          </div>
        ) : (
          <div className="card stack">
            <div className="eyebrow">{plan.kind === 'yoga' ? 'Hatha yoga · 35 min' : 'Rest day'}</div>
            <h2>{plan.kind === 'yoga' ? plan.yoga : 'Recover'}</h2>
            <div className="small muted">{plan.kind === 'yoga' ? 'Tick it off below. Full yoga tracking comes later.' : `${plan.yoga}. Strength is built on rest days too.`}</div>
            {isToday && !doneSession && <button className="btn ghost" onClick={onStart}>Train calisthenics anyway</button>}
          </div>
        )}
      </div>

      {plan.kind !== 'rest' && <div className="section"><div className="eyebrow">{plan.kind === 'strength' ? 'Warm-up & cool-down' : 'Session'}</div><div className="card list">{checkList('session')}</div></div>}

      {plan.kind === 'strength' && pushNext && (
        <div className="section"><div className="eyebrow">Next unlock</div>
          <button className="card" style={{ width: '100%' }} onClick={() => setSheet(push.id)}>
            <div className="row between"><b>{push.name}</b><span className="small muted">goal 3 × {push.hi}{unit(push)}</span></div>
            <div className="bar" style={{ marginTop: 10 }}><i style={{ width: `${Math.min(100, Math.round(targetOf(s, push) / push.hi * 100))}%` }} /></div>
            <div className="small muted" style={{ marginTop: 8 }}>Master it to unlock <b style={{ color: 'var(--text)' }}>{pushNext.name}</b>.</div>
          </button>
        </div>
      )}

      <div className="section"><div className="eyebrow">Daily rhythm</div><div className="card list">{checkList('rhythm')}</div></div>

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
