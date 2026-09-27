import { useState, type ReactNode } from 'react'
import { EQUIPMENT, STYLES, TIERS, type Equipment, type Style } from '../data/catalog'
import { activeTracks, dayKey, gymStart, loadOf, placement, trainingNode, type Assessment } from '../engine/progression'
import { Icon } from '../icons'
import { setState, useStore } from '../store'
import { CheckRow, Choice, Stepper as NumStepper } from '../ui'
import { GoalPicker } from './Body'
import { RestoreSheet } from './Backup'
import { cloudAvailable } from '../engine/cloud'
import type { Goal } from '../data/body'

/** Style picker, shared with the You tab. */
export function StylePicker({ style, onPick }: { style: Style; onPick: (s: Style) => void }) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      {(Object.keys(STYLES) as Style[]).map(k => (
        <button key={k} className="tile row" aria-pressed={style === k} onClick={() => onPick(k)}
          style={style === k ? { borderColor: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 8%, var(--panel))' } : undefined}>
          <span className="ico"><Icon name={STYLES[k].icon} /></span>
          <span className="grow"><div className="t" style={{ fontSize: 15 }}>{STYLES[k].name}</div><div className="d">{STYLES[k].short}</div></span>
        </button>
      ))}
    </div>
  )
}

export default function Onboarding() {
  const s = useStore()
  const [step, setStep] = useState(0)
  const [style, setStyle] = useState<Style>(s.style ?? 'cali')
  const [gear, setGear] = useState<Equipment[]>(s.equipment)
  const [a, setA] = useState<Assessment>({ pushups: 5, plankSec: 45, squats: 20, pike: false })
  const [exp, setExp] = useState(0)
  const [height, setHeight] = useState(s.body.height ?? 170)
  const [kg, setKg] = useState(s.body.weights.at(-1)?.kg ?? 70)
  const [goal, setGoal] = useState<Goal | undefined>(s.body.goal)
  const [restore, setRestore] = useState(false)

  const cali = style !== 'gym', gym = style !== 'cali'
  const g = gymStart(exp, kg)
  const mastered = [...(cali ? placement(a) : []), ...(gym ? g.mastered : [])]
  const preview = { ...s, style, equipment: gear, mastered, loads: g.loads }

  const finish = () => setState(x => {
    const date = dayKey()
    const weights = [...x.body.weights.filter(w => w.date !== date), { date, kg }].sort((p, q) => p.date.localeCompare(q.date))
    return { ...x, onboarded: true, style, startDate: x.sessions.length ? x.startDate : date, equipment: gear, mastered, targets: {}, loads: g.loads, body: { ...x.body, height, goal: goal ?? x.body.goal, weights } }
  })
  const Stepper = ({ k, label, step: d = 1 }: { k: 'pushups' | 'squats'; label: string; step?: number }) => (
    <div className="card row between">
      <span>{label}</span>
      <span className="row">
        <button className="chip" aria-label="Less" onClick={() => setA({ ...a, [k]: Math.max(0, a[k] - d) })}>−</button>
        <b className="num" style={{ fontSize: 26, minWidth: 36, textAlign: 'center' }}>{a[k]}</b>
        <button className="chip" aria-label="More" onClick={() => setA({ ...a, [k]: a[k] + d })}>+</button>
      </span>
    </div>
  )

  // pages depend on the chosen style
  const steps: ReactNode[] = [
    <>
      <h1>How do you want to train?</h1>
      <p className="muted small">You can change this later on the You tab. Breathing, yoga and body tracking work the same for everyone.</p>
      <StylePicker style={style} onPick={setStyle} />
    </>,
    ...(cali ? [<>
      <h1>What equipment do you have at home?</h1>
      <div className="card list">
        {(Object.keys(EQUIPMENT) as Equipment[]).map(k => (
          <CheckRow key={k} on={gear.includes(k)} title={EQUIPMENT[k]} sub={k === 'bar' ? 'Unlocks dead hang, pull-ups and muscle-ups' : undefined}
            onToggle={() => setGear(v => v.includes(k) ? v.filter(x => x !== k) : [...v, k])} />
        ))}
      </div>
    </>] : []),
    <>
      <h1>Your body & goal</h1>
      <p className="muted small">Used to track your weight trend and give pace advice. It stays on your phone.</p>
      <div className="card row between"><span>Height (cm)</span><NumStepper value={height} min={120} max={220} onChange={setHeight} /></div>
      <div className="card row between"><span>Weight (kg)</span><NumStepper value={kg} min={30} max={250} onChange={setKg} /></div>
      <div className="eyebrow">Your goal</div>
      <GoalPicker goal={goal} onPick={setGoal} />
    </>,
    ...(cali ? [<>
      <h1>Quick assessment</h1>
      <p className="muted small">Be honest. Clean reps only. You can always move up quickly.</p>
      <Stepper k="pushups" label="Push-ups in one set" />
      <Stepper k="squats" label="Bodyweight squats in one set" step={5} />
      <div className="card stack"><span>Plank hold</span>
        <Choice options={[[20, 'Under 30s'], [45, '30–60s'], [75, '60s+']]} value={a.plankSec} onChange={v => setA({ ...a, plankSec: v })} /></div>
      <div className="card stack"><span>10 clean pike push-ups?</span>
        <Choice options={[['no', 'Not yet'], ['yes', 'Yes']]} value={a.pike ? 'yes' : 'no'} onChange={v => setA({ ...a, pike: v === 'yes' })} /></div>
    </>] : []),
    ...(gym ? [<>
      <h1>Gym experience</h1>
      <p className="muted small">Sets which lifts you start with and how heavy. Start light: the app adds weight as soon as you earn it.</p>
      <div className="stack" style={{ gap: 10 }}>
        {([[0, 'New to lifting', 'Machines and dumbbells, light weights, learn the movements'], [1, 'Some experience', 'Comfortable with dumbbells and basic lifts'], [2, 'Experienced', 'Barbell squat, bench and deadlift with good form']] as const).map(([v, t, d]) => (
          <button key={v} className="tile row" aria-pressed={exp === v} onClick={() => setExp(v)}
            style={exp === v ? { borderColor: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 8%, var(--panel))' } : undefined}>
            <span className="ico sm"><Icon name="dumbbell" size={18} /></span><span className="grow"><div className="t">{t}</div><div className="d">{d}</div></span>
          </button>
        ))}
      </div>
    </>] : []),
    <>
      <h1>Your starting point</h1>
      <p className="muted small">Strength days Mon / Wed / Fri, yoga Tue / Thu / Sat.</p>
      <div className="card list">
        {activeTracks(preview).map(t => { const n = trainingNode(preview, t); return (
          <div className="item" key={t.id}><span className="grow"><b>{t.name}</b><div className="small muted">{n.name}{n.load ? ` · ${loadOf(preview, n)} kg${n.load.perHand ? ' each' : ''}` : ''}</div></span><span className="chip">{TIERS[n.tier]}</span></div>
        ) })}
      </div>
    </>,
  ]
  const pages: ReactNode[] = [
    <>
      <div className="eyebrow">Cal-X</div>
      <h1 style={{ fontSize: 46 }}>Get stronger, one set at a time.</h1>
      <p className="muted">A 1-minute setup finds your starting point. After that the app plans every session, adjusts targets from how you actually perform, and moves you up when you've earned it.</p>
      {cloudAvailable() && <button className="chip" style={{ alignSelf: 'flex-start' }} onClick={() => setRestore(true)}>Used Cal-X before? Restore from backup code</button>}
      {restore && <RestoreSheet onClose={() => setRestore(false)} />}
    </>,
    ...steps.map((p, k) => <><div className="eyebrow">Step {k + 1} of {steps.length}</div>{p}</>),
  ]
  const at = Math.min(step, pages.length - 1)

  return (
    <div className="full focus"><div className="stack" style={{ minHeight: '100%', gap: 16 }}>
      {pages[at]}
      <div className="grow" />
      <div className="row">
        {at > 0 && <button className="btn ghost" style={{ width: 110 }} onClick={() => setStep(at - 1)}>Back</button>}
        <button className="btn" onClick={() => at < pages.length - 1 ? setStep(at + 1) : finish()}>{at === 0 ? 'Get started' : at < pages.length - 1 ? 'Next' : 'Start training'}</button>
      </div>
    </div></div>
  )
}
