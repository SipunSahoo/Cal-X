import { useState } from 'react'
import { GOALS, bmi, bmiLabel, paceVerdict, weeklyRate, type Body, type Goal } from '../data/body'
import { dayKey, parseDay } from '../engine/progression'
import { Icon } from '../icons'
import { setState, useStore } from '../store'
import { Sheet, Stepper, toast } from '../ui'

const setBody = (fn: (b: Body) => Body) => setState(x => ({ ...x, body: fn(x.body) }))
const fmt = (n: number) => n.toFixed(1)
const short = (d: string) => parseDay(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

/** Number field with − / + for decimal values (weight, waist). */
function Dial({ value, onChange, step = 0.1, unit, id }: { value: number; onChange: (v: number) => void; step?: number; unit: string; id: string }) {
  const round = (v: number) => Math.round(v * 10) / 10
  return (
    <div className="row" style={{ gap: 6 }}>
      <button className="chip icon" aria-label="Less" onClick={() => onChange(round(value - step))}>−</button>
      <input id={id} type="number" inputMode="decimal" step={step} value={value} onChange={e => onChange(+e.target.value)}
        style={{ flex: 1, textAlign: 'center', font: 'inherit', fontSize: 30, fontWeight: 700, fontStretch: '118%', color: 'var(--text)', background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 14, padding: '8px 0', minWidth: 0 }} />
      <span className="tag" style={{ width: 24 }}>{unit}</span>
      <button className="chip icon" aria-label="More" onClick={() => onChange(round(value + step))}>+</button>
    </div>
  )
}

/** Goal picker used by onboarding and the goal sheet. */
export function GoalPicker({ goal, onPick }: { goal?: Goal; onPick: (g: Goal) => void }) {
  return (
    <div className="grid2">
      {(Object.keys(GOALS) as Goal[]).map(g => (
        <button key={g} className="tile" aria-pressed={goal === g} onClick={() => onPick(g)}
          style={goal === g ? { borderColor: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 8%, var(--panel))' } : undefined}>
          <span className="ico sm"><Icon name={GOALS[g].icon} size={18} /></span>
          <span><div className="t">{GOALS[g].name}</div><div className="d">{GOALS[g].short}</div></span>
        </button>
      ))}
    </div>
  )
}

export function GoalSheet({ onClose }: { onClose: () => void }) {
  const s = useStore(), last = s.body.weights.at(-1)?.kg
  const [height, setHeight] = useState(s.body.height ?? 170)
  const [goal, setGoal] = useState<Goal | undefined>(s.body.goal)
  const [target, setTarget] = useState(s.body.target ?? last ?? 70)
  const [useTarget, setUseTarget] = useState(s.body.target != null)
  const save = () => { setBody(b => ({ ...b, height, goal, target: useTarget ? target : undefined })); toast('Goal saved.'); onClose() }
  return (
    <Sheet onClose={onClose}>
      <h2>Your body & goal</h2>
      <div className="stack" style={{ gap: 8 }}><div className="eyebrow">Height</div><div className="row between"><span className="t">cm</span><Stepper value={height} min={120} max={220} onChange={setHeight} /></div></div>
      <div className="stack" style={{ gap: 8 }}><div className="eyebrow">Goal</div><GoalPicker goal={goal} onPick={setGoal} /></div>
      {goal && <div className="d">{GOALS[goal].tip}</div>}
      {goal && goal !== 'maintain' && goal !== 'recomp' && (
        <div className="stack" style={{ gap: 8 }}>
          <button className={`tile row ${useTarget ? 'on' : ''}`} onClick={() => setUseTarget(!useTarget)}>
            <span className={`ico sm ${useTarget ? 'good' : 'muted'}`}><Icon name="target" size={18} /></span><span className="grow t">Set a target weight</span>
          </button>
          {useTarget && <Dial id="target-kg" value={target} onChange={setTarget} step={0.5} unit="kg" />}
        </div>
      )}
      <button className="btn" disabled={!goal} onClick={save}>Save</button>
    </Sheet>
  )
}

export function LogSheet({ onClose }: { onClose: () => void }) {
  const s = useStore(), prev = s.body.weights.at(-1)
  const [kg, setKg] = useState(prev?.kg ?? 70)
  const [waist, setWaist] = useState(prev?.waist ?? 80)
  const [withWaist, setWithWaist] = useState(prev?.waist != null || s.body.goal === 'recomp')
  const save = () => {
    const date = dayKey()
    setBody(b => ({ ...b, weights: [...b.weights.filter(w => w.date !== date), { date, kg, waist: withWaist ? waist : undefined }].sort((a, c) => a.date.localeCompare(c.date)) }))
    toast('Weigh-in saved.'); onClose()
  }
  return (
    <Sheet onClose={onClose}>
      <h2>Log today's weight</h2>
      <div className="d">Best first thing in the morning, before eating. Day-to-day changes are mostly water, so watch the trend.</div>
      <Dial id="weigh-kg" value={kg} onChange={setKg} unit="kg" />
      <button className={`tile row ${withWaist ? 'on' : ''}`} onClick={() => setWithWaist(!withWaist)}>
        <span className={`ico sm ${withWaist ? 'good' : 'muted'}`}><Icon name="ruler" size={18} /></span>
        <span className="grow"><span className="t">Waist too</span><div className="d">Measured at the belly button</div></span>
      </button>
      {withWaist && <Dial id="weigh-waist" value={waist} onChange={setWaist} step={0.5} unit="cm" />}
      <button className="btn" disabled={!(kg > 20 && kg < 300)} onClick={save}>Save</button>
    </Sheet>
  )
}

/** Shown on Today until a goal is set. */
export function BodyPrompt() {
  const s = useStore()
  const [open, setOpen] = useState(false)
  if (s.body.goal) return null
  return (
    <>
      <button className="tile row" style={{ marginTop: 14, width: '100%', borderColor: 'var(--accent)' }} onClick={() => setOpen(true)}>
        <span className="ico"><Icon name="scale" /></span>
        <span className="grow"><span className="t">What's your goal?</span><div className="d">Lose fat, gain muscle or maintain. Add height and weight to track it.</div></span>
        <Icon name="play" size={16} />
      </button>
      {open && <GoalSheet onClose={() => setOpen(false)} />}
    </>
  )
}

function WeightChart({ body }: { body: Body }) {
  const pts = body.weights.slice(-20)
  if (pts.length < 2) return <div className="d">Log at least two weigh-ins to see your trend.</div>
  const W = 320, H = 140, P = 26
  const vals = [...pts.map(p => p.kg), ...(body.target != null ? [body.target] : [])]
  const lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1)
  const x = (k: number) => P + k * (W - 2 * P) / (pts.length - 1)
  const y = (v: number) => H - P - (v - lo) / (hi - lo) * (H - 2 * P)
  const ticks = [lo, (lo + hi) / 2, hi]
  const path = pts.map((p, k) => `${k ? 'L' : 'M'}${x(k)},${y(p.kg)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img" aria-label="Weight trend">
      {ticks.map(v => <g key={v}><line x1={P} x2={W - 6} y1={y(v)} y2={y(v)} stroke="var(--line)" /><text x={0} y={y(v) + 4} fontSize="10" fill="var(--muted)">{Math.round(v)}</text></g>)}
      {body.target != null && <g><line x1={P} x2={W - 6} y1={y(body.target)} y2={y(body.target)} stroke="var(--good)" strokeDasharray="4 4" />
        <text x={W - 6} y={y(body.target) - 5} fontSize="10" fill="var(--good)" textAnchor="end">target {fmt(body.target)}</text></g>}
      <path d={`${path} L${x(pts.length - 1)},${H - P} L${x(0)},${H - P} Z`} fill="var(--accent)" opacity=".1" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1].kg)} r="4" fill="var(--accent)" />
      <text x={P} y={H - 8} fontSize="10" fill="var(--muted)">{short(pts[0].date)}</text>
      <text x={W - 6} y={H - 8} fontSize="10" fill="var(--muted)" textAnchor="end">{short(pts[pts.length - 1].date)}</text>
    </svg>
  )
}

/** Body section for the Progress tab. */
export function BodySection() {
  const s = useStore(), b = s.body
  const [sheet, setSheet] = useState<null | 'goal' | 'log'>(null)
  const last = b.weights.at(-1), first = b.weights[0]
  const rate = weeklyRate(b.weights)
  const verdict = b.goal && rate != null ? paceVerdict(b.goal, rate) : null
  const daysSince = last ? Math.floor((Date.now() - parseDay(last.date).getTime()) / 864e5) : null
  const lastWaist = [...b.weights].reverse().find(w => w.waist != null), firstWaist = b.weights.find(w => w.waist != null)

  return (
    <section className="section">
      <div className="section-head"><h2>Body</h2><button className="chip" onClick={() => setSheet('goal')}><Icon name={b.goal ? GOALS[b.goal].icon : 'target'} size={15} /> {b.goal ? GOALS[b.goal].name : 'Set goal'}</button></div>

      <div className="grid3">
        <div className="tile"><span className="ico sm"><Icon name="scale" size={18} /></span>
          <span><div className="n">{last ? fmt(last.kg) : '–'}</div><div className="d">kg{last && first && last !== first ? ` · ${last.kg - first.kg >= 0 ? '+' : ''}${fmt(last.kg - first.kg)} total` : ''}</div></span></div>
        <div className="tile"><span className={`ico sm ${verdict?.tone === 'good' ? 'good' : 'muted'}`}><Icon name="progress" size={18} /></span>
          <span><div className="n">{rate != null ? `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}` : '–'}</div><div className="d">{verdict ? verdict.label : 'kg / week'}</div></span></div>
        <div className="tile"><span className="ico sm muted"><Icon name="you" size={18} /></span>
          <span><div className="n">{last && b.height ? fmt(bmi(last.kg, b.height)) : '–'}</div><div className="d">{last && b.height ? `BMI · ${bmiLabel(bmi(last.kg, b.height))}` : 'BMI'}</div></span></div>
      </div>

      <div className="tile">
        <WeightChart body={b} />
        {b.goal && b.target != null && last && (
          <div className="d">{Math.abs(last.kg - b.target) < 0.3 ? 'Target reached. Set a new one or switch to Maintain.' : `${fmt(Math.abs(last.kg - b.target))} kg to go to your ${fmt(b.target)} kg target.`}</div>
        )}
        {lastWaist && firstWaist && lastWaist !== firstWaist && <div className="d">Waist {fmt(lastWaist.waist!)} cm ({lastWaist.waist! - firstWaist.waist! >= 0 ? '+' : ''}{fmt(lastWaist.waist! - firstWaist.waist!)} since {short(firstWaist.date)})</div>}
      </div>

      {b.goal && <div className="tile row"><span className="ico sm"><Icon name="info" size={18} /></span><span className="d grow">{GOALS[b.goal].tip} BMI doesn't account for muscle, so treat it as a rough guide.</span></div>}

      <button className="btn ghost" onClick={() => setSheet('log')}><Icon name="scale" size={18} /> {daysSince == null ? 'Log your first weigh-in' : daysSince === 0 ? 'Update today\'s weigh-in' : `Log weight · last ${daysSince} day${daysSince === 1 ? '' : 's'} ago`}</button>

      {sheet === 'goal' && <GoalSheet onClose={() => setSheet(null)} />}
      {sheet === 'log' && <LogSheet onClose={() => setSheet(null)} />}
    </section>
  )
}
