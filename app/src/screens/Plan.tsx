import { WEEK } from '../data/catalog'
import { Icon } from '../icons'
import { useStore } from '../store'

// The whole program on one screen, for anyone new to it. Content follows the weekly blueprint PDF.
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const ORDER = [1, 2, 3, 4, 5, 6, 0]

type Step = [icon: string, title: string, time: string, note?: string]
const MORNING: Step[] = [
  ['sunrise', 'Wake, empty stomach', '', 'Mind first, then body.'],
  ['wrist', 'Micro-loosening', '3 min', 'Ankle, knee, hip and spine circles.'],
  ['breath', 'Pranayama', '10 min', '2 rounds Kapalabhati + Nadi Shodhana.'],
  ['lotus', 'Morning dhyana', '20–30 min', 'Seated on your yoga brick.'],
  ['bolt', 'Shift gears', '', 'A few sips of water, stand up.'],
  ['sun', 'Active warm-up', '5 min', 'Wrist prep, brick scapular presses, sun salutes.'],
  ['dumbbell', 'Main physical work', '35–45 min', 'Calisthenics (Mon/Wed/Fri) or hatha yoga (Tue/Thu/Sat).'],
  ['rest', 'Shavasana', '5 min', 'Cool the nervous system down.'],
]
const EVENING: Step[] = [
  ['run', 'Easy run (2–3× a week)', '20–30 min', 'Nasal breathing only for most runs.'],
  ['legs', 'Hip unlock', '2 min', 'Low lunge 60 s per leg + downward dog 60 s.'],
  ['calendar', 'Shower, dinner, digest', '1.5–2 h', 'Wait before meditating.'],
  ['alternate', 'Slow Nadi Shodhana', '3 min', 'No Kapalabhati at night.'],
  ['moon', 'Night dhyana', '20–30 min', 'Then sleep.'],
]
const STRENGTH: Step[] = [
  ['wrist', 'Wrist prep + brick scapular presses', '3 min'],
  ['sun', '5 crisp sun salutes', '4 min', '1 breath per movement. Heats the joints.'],
  ['dumbbell', 'Calisthenics circuit, 8 exercises', '30–35 min', 'Cal-X sets every target for you.'],
  ['sun', '5 slow sun salutes', '6 min', 'Knees down on the lowering. A flush, not a workout.'],
  ['lotus', 'Yoga sector: 2–3 deep holds', '8–10 min', 'Mon chest & upper back · Wed twists · Fri forward folds.'],
  ['rest', 'Shavasana', '5 min'],
]
const RULES: [string, string, string][] = [
  ['target', 'Targets rise', 'Hit every set at a manageable effort and the next session asks for 1 more rep (or 5 more seconds).'],
  ['trophy', 'Level up', 'Reach the top of the range on every set and you move to the next, harder variation.'],
  ['restart', 'Ease off', 'Fall well short of the plan and the target drops a little so reps stay clean.'],
  ['bolt', 'Readiness', 'A 10-second check-in before strength days. Poor sleep or high soreness gives a lighter session.'],
  ['info', 'Pain', 'Flag it and that exercise stops progressing. Sharp or lasting pain: see a physio or doctor.'],
]

function Timeline({ steps, tone = '' }: { steps: Step[]; tone?: string }) {
  return (
    <div className="card">
      {steps.map(([icon, title, time, note], k) => (
        <div key={k} className="row" style={{ alignItems: 'stretch', gap: 12 }}>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className={`ico sm ${tone}`}><Icon name={icon} size={17} /></span>
            {k < steps.length - 1 && <span style={{ flex: 1, width: 2, minHeight: 10, margin: '3px 0', borderRadius: 2, background: 'var(--line)' }} />}
          </span>
          <span className="grow" style={{ paddingTop: 6, paddingBottom: k < steps.length - 1 ? 12 : 0 }}>
            <span className="row between" style={{ alignItems: 'baseline' }}><span className="t" style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>{time && <span className="num small">{time}</span>}</span>
            {note && <div className="d" style={{ fontSize: 12.5 }}>{note}</div>}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Plan({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const timesFor = (d: number) => s.reminders.filter(r => r.on && r.days.includes(d)).sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div className="full"><div className="stack" style={{ gap: 0 }}>
      <div className="row between"><button className="chip icon" aria-label="Close" onClick={onClose}><Icon name="back" size={16} /></button><span className="tag">Cal-X program</span><span style={{ width: 36 }} /></div>
      <h1 style={{ marginTop: 14 }}>The weekly plan</h1>
      <p className="muted small" style={{ margin: '8px 0 0' }}>Three strength days, three yoga days and a full rest day. Every day opens and closes with breathing and meditation. Cal-X adjusts the calisthenics targets from how each session actually went.</p>

      <section className="section">
        <div className="section-head"><h2>The week</h2></div>
        {ORDER.map(d => {
          const p = WEEK[d], times = timesFor(d)
          const kind = p.kind === 'strength' ? ['dumbbell', 'Strength circuit', ''] : p.kind === 'yoga' ? ['lotus', 'Hatha yoga', 'breath'] : ['rest', 'Full rest', 'muted']
          return (
            <div key={d} className="tile row" style={{ alignItems: 'flex-start' }}>
              <span className={`ico ${kind[2]}`}><Icon name={kind[0]} /></span>
              <span className="grow">
                <span className="row between"><span className="t" style={{ fontSize: 15 }}>{DAY_NAMES[d]}</span><span className="tag">{kind[1]}</span></span>
                <div className="d" style={{ marginTop: 2 }}>{p.kind === 'strength' ? `8 exercises + yoga sector: ${p.yoga}` : p.yoga}</div>
                <div className="d">Evening: {p.evening}</div>
                {times.length > 0 && <div className="row wrap" style={{ marginTop: 8, gap: 4 }}>
                  {times.map(r => <span key={r.id} className="chip" style={{ minHeight: 26, padding: '2px 8px', fontSize: 11.5 }}><Icon name={r.icon} size={13} /> {r.time}</span>)}
                </div>}
              </span>
            </div>
          )
        })}
      </section>

      <section className="section"><div className="section-head"><h2>Every morning</h2><span className="tag">about 90 min</span></div><Timeline steps={MORNING} /></section>
      <section className="section"><div className="section-head"><h2>Strength days, block by block</h2></div><Timeline steps={STRENGTH} /></section>
      <section className="section"><div className="section-head"><h2>Evening & night</h2></div><Timeline steps={EVENING} tone="breath" /></section>

      <section className="section">
        <div className="section-head"><h2>How progression works</h2></div>
        <div className="grid2">
          {RULES.map(([icon, t, d]) => (
            <div key={t} className="tile"><span className="ico sm"><Icon name={icon} size={18} /></span><span><div className="t">{t}</div><div className="d">{d}</div></span></div>
          ))}
        </div>
      </section>

      <section className="section" style={{ marginBottom: 12 }}>
        <div className="section-head"><h2>Blueprint rules</h2></div>
        <div className="tile" style={{ gap: 8 }}>
          {['Meditate before calisthenics, never after.', 'No Kapalabhati at night. It is too stimulating before sleep.', 'Put runs on yoga days (Tue/Thu/Sat) to spread leg load.', 'Run at a pace you can keep with nasal breathing for 80% of runs.', 'Always do the 2-minute hip unlock after a run.', 'Sunday is full rest: breathing, meditation and a gentle walk only.'].map(t => (
            <div key={t} className="row" style={{ alignItems: 'flex-start', gap: 8 }}><span style={{ color: 'var(--accent)', marginTop: 1 }}><Icon name="check" size={15} /></span><span className="small">{t}</span></div>
          ))}
        </div>
      </section>
    </div></div>
  )
}
