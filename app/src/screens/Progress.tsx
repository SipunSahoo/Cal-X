import { useState } from 'react'
import { EX, TRACKS, WEEK } from '../data/catalog'
import { addDays, bests, dayKey, parseDay, unit, weekStreak } from '../engine/progression'
import { useStore } from '../store'
import { Stat } from '../ui'

const WEEKS = 10

export default function Progress() {
  const s = useStore()
  const [trackId, setTrackId] = useState('push')
  const best = bests(s)
  const today = new Date(), todayKey = dayKey(today)
  const monday = addDays(today, -((today.getDay() + 6) % 7))
  const thisWeek = s.sessions.filter(x => parseDay(x.date) >= monday).length

  if (!s.sessions.length) return (
    <>
      <div className="tag">Progress</div><h1 style={{ marginTop: 4 }}>Your story starts here</h1>
      <div className="card" style={{ marginTop: 16 }}><p className="muted" style={{ margin: 0 }}>Finish your first workout and this page fills with records, charts and your consistency calendar.</p></div>
    </>
  )

  // consistency heatmap: last WEEKS weeks, Mon..Sun
  const start = addDays(monday, -7 * (WEEKS - 1))
  const cells = Array.from({ length: WEEKS * 7 }, (_, k) => {
    const d = addDays(start, k), key = dayKey(d), plan = WEEK[d.getDay()]
    const trained = s.sessions.some(x => x.date === key)
    const yoga = s.checks[key]?.includes('yoga')
    const past = key < todayKey, before = key < s.startDate
    const kind = trained ? 'str' : yoga ? 'yoga' : key > todayKey || before ? 'none' : plan.kind === 'rest' ? 'rest' : past ? 'miss' : 'none'
    return { key, kind }
  })
  const CELL = { str: 'var(--accent)', yoga: 'var(--breath)', rest: 'var(--panel-2)', miss: 'transparent', none: 'transparent' }

  // chart: best set per session for the chosen track
  const track = TRACKS.find(t => t.id === trackId)!
  const pts = s.sessions.flatMap(ses => ses.items.filter(it => EX[it.id]?.track === trackId && it.sets.length)
    .map(it => ({ id: it.id, v: Math.max(...it.sets.map(x => x.value)) })))
  const W = 320, H = 150, P = 26
  const max = Math.max(5, ...pts.map(p => p.v)) * 1.15
  const x = (k: number) => P + (pts.length < 2 ? (W - 2 * P) / 2 : k * (W - 2 * P) / (pts.length - 1))
  const y = (v: number) => H - P - (v / max) * (H - 2 * P)
  const ticks = [0, 1, 2, 3].map(k => Math.round((max / 1.15) * k / 3))
  const segs: { id: string; from: number; to: number }[] = []
  pts.forEach((p, k) => { const last = segs[segs.length - 1]; if (last?.id === p.id) last.to = k; else segs.push({ id: p.id, from: k, to: k }) })
  const segColor = (k: number) => (k === segs.length - 1 ? 'var(--accent)' : k % 2 ? 'var(--muted)' : 'var(--breath)')

  const milestones: [string, number][] = [
    ['First workout logged', Math.min(1, s.sessions.length)],
    ['10 workouts', Math.min(1, s.sessions.length / 10)],
    ['4 weeks in a row (2+ sessions)', Math.min(1, weekStreak(s) / 4)],
    ['10 push-ups in one set', Math.min(1, (best.pushup?.value ?? 0) / 10)],
    ['60-second hollow hold', Math.min(1, (best.hollow_hold?.value ?? 0) / 60)],
    ['30-second crow', Math.min(1, (best.crow?.value ?? 0) / 30)],
    ['First pull-up', Math.min(1, best.pullup?.value ?? 0)],
    ['10-second L-sit', Math.min(1, (best.lsit?.value ?? 0) / 10)],
    ['30-second chest-to-wall handstand', Math.min(1, (best.ctw_hs?.value ?? 0) / 30)],
  ]

  return (
    <>
      <div className="eyebrow">Progress</div>
      <h1 style={{ marginTop: 4 }}>Since {parseDay(s.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</h1>
      <div className="stats" style={{ marginTop: 14 }}>
        <Stat value={s.sessions.length} label="workouts" />
        <Stat value={weekStreak(s)} label="week streak" />
        <Stat value={`${thisWeek}/3`} label="this week" />
      </div>

      <div className="section">
        <div className="row between"><div className="eyebrow">Consistency</div>
          <div className="row small muted" style={{ gap: 8 }}><span style={{ color: 'var(--accent)' }}>■</span>Strength<span style={{ color: 'var(--breath)' }}>■</span>Yoga<span style={{ color: 'var(--bad)' }}>▢</span>Missed</div></div>
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, k) => <span key={k} className="small muted" style={{ textAlign: 'center' }}>{d}</span>)}
            {cells.map(c => <i key={c.key} title={c.key} style={{ aspectRatio: '1', borderRadius: 1, background: CELL[c.kind as keyof typeof CELL],
              border: c.kind === 'miss' ? '1px dashed var(--bad)' : c.key === todayKey ? '1px solid var(--text)' : '1px solid transparent' }} />)}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="eyebrow">Best set per session</div>
        <div className="row scroll-x" style={{ gap: 6 }}>
          {TRACKS.map(t => <button key={t.id} className={`chip ${t.id === trackId ? 'on' : ''}`} onClick={() => setTrackId(t.id)}>{t.name}</button>)}
        </div>
        <div className="card">
          {pts.length ? <>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img" aria-label={`${track.name} progress chart`}>
              {ticks.map(v => <g key={v}><line x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="var(--line)" /><text x={4} y={y(v) + 4} fontSize="10" fill="var(--muted)">{v}</text></g>)}
              {segs.map((sg, k) => <g key={k}>
                <polyline fill="none" stroke={segColor(k)} strokeWidth="2.5" points={pts.slice(sg.from, sg.to + 1).map((p, j) => `${x(sg.from + j)},${y(p.v)}`).join(' ')} />
                {pts.slice(sg.from, sg.to + 1).map((p, j) => <circle key={j} cx={x(sg.from + j)} cy={y(p.v)} r="3" fill={segColor(k)} />)}
              </g>)}
            </svg>
            <div className="row wrap small muted" style={{ marginTop: 6 }}>
              {segs.map((sg, k) => <span key={k}><span style={{ color: segColor(k) }}>━</span> {EX[sg.id].name}{EX[sg.id].hold ? ' (s)' : ''}</span>)}
            </div>
          </> : <div className="small muted">No {track.name.toLowerCase()} sets logged yet.</div>}
        </div>
      </div>

      <div className="section">
        <div className="eyebrow">Personal records</div>
        <div className="card list">
          {Object.entries(best).map(([id, b]) => (
            <div className="item" key={id}><span className="grow">{EX[id]?.name ?? id}<div className="small muted">{parseDay(b.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div></span>
              <span className="num" style={{ fontSize: 22 }}>{b.value} <span className="small muted">{EX[id] && unit(EX[id]) ? 'sec' : 'reps'}</span></span></div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="eyebrow">Milestones</div>
        <div className="card list">
          {milestones.map(([l, p]) => (
            <div className="item" key={l}>
              <span className={`check ${p >= 1 ? 'good' : ''}`}>{p >= 1 ? '✓' : ''}</span>
              <span className="grow"><span style={{ color: p >= 1 ? undefined : 'var(--muted)' }}>{l}</span>
                {p > 0 && p < 1 && <span className="bar" style={{ display: 'block', marginTop: 6 }}><i style={{ width: `${p * 100}%` }} /></span>}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
