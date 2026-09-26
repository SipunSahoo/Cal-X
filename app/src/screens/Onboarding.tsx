import { useState } from 'react'
import { EQUIPMENT, TIERS, TRACKS, type Equipment } from '../data/catalog'
import { dayKey, placement, trainingNode, type Assessment } from '../engine/progression'
import { setState, useStore } from '../store'
import { CheckRow, Choice, Stepper as NumStepper } from '../ui'
import { GoalPicker } from './Body'
import type { Goal } from '../data/body'

export default function Onboarding() {
  const s = useStore()
  const [step, setStep] = useState(0)
  const [gear, setGear] = useState<Equipment[]>(s.equipment)
  const [a, setA] = useState<Assessment>({ pushups: 5, plankSec: 45, squats: 20, pike: false })
  const [height, setHeight] = useState(s.body.height ?? 170)
  const [kg, setKg] = useState(s.body.weights.at(-1)?.kg ?? 70)
  const [goal, setGoal] = useState<Goal | undefined>(s.body.goal)
  const mastered = placement(a)
  const preview = { ...s, equipment: gear, mastered }

  const finish = () => setState(x => {
    const date = dayKey()
    const weights = [...x.body.weights.filter(w => w.date !== date), { date, kg }].sort((p, q) => p.date.localeCompare(q.date))
    return { ...x, onboarded: true, startDate: x.sessions.length ? x.startDate : date, equipment: gear, mastered, targets: {}, body: { ...x.body, height, goal: goal ?? x.body.goal, weights } }
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

  const pages = [
    <>
      <div className="eyebrow">Cal-X</div>
      <h1 style={{ fontSize: 46 }}>From zero to skills, one set at a time.</h1>
      <p className="muted">A 1-minute setup finds your starting point. After that the app plans every session, adjusts targets from how you actually perform, and unlocks harder skills when you've earned them.</p>
    </>,
    <>
      <div className="eyebrow">Step 1 of 4</div><h1>What equipment do you have?</h1>
      <div className="card list">
        {(Object.keys(EQUIPMENT) as Equipment[]).map(k => (
          <CheckRow key={k} on={gear.includes(k)} title={EQUIPMENT[k]} sub={k === 'bar' ? 'Unlocks dead hang, pull-ups and muscle-ups' : undefined}
            onToggle={() => setGear(g => g.includes(k) ? g.filter(x => x !== k) : [...g, k])} />
        ))}
      </div>
    </>,
    <>
      <div className="eyebrow">Step 2 of 4</div><h1>Your body & goal</h1>
      <p className="muted small">Used to track your weight trend and give pace advice. It stays on your phone.</p>
      <div className="card row between"><span>Height (cm)</span><NumStepper value={height} min={120} max={220} onChange={setHeight} /></div>
      <div className="card row between"><span>Weight (kg)</span><NumStepper value={kg} min={30} max={250} onChange={setKg} /></div>
      <div className="eyebrow">Your goal</div>
      <GoalPicker goal={goal} onPick={setGoal} />
    </>,
    <>
      <div className="eyebrow">Step 3 of 4</div><h1>Quick assessment</h1>
      <p className="muted small">Be honest. Clean reps only. You can always move up quickly.</p>
      <Stepper k="pushups" label="Push-ups in one set" />
      <Stepper k="squats" label="Bodyweight squats in one set" step={5} />
      <div className="card stack"><span>Plank hold</span>
        <Choice options={[[20, 'Under 30s'], [45, '30–60s'], [75, '60s+']]} value={a.plankSec} onChange={v => setA({ ...a, plankSec: v })} /></div>
      <div className="card stack"><span>10 clean pike push-ups?</span>
        <Choice options={[['no', 'Not yet'], ['yes', 'Yes']]} value={a.pike ? 'yes' : 'no'} onChange={v => setA({ ...a, pike: v === 'yes' })} /></div>
    </>,
    <>
      <div className="eyebrow">Step 4 of 4</div><h1>Your starting point</h1>
      <p className="muted small">You train Mon / Wed / Fri, with yoga Tue / Thu / Sat from your blueprint.</p>
      <div className="card list">
        {TRACKS.map(t => { const n = trainingNode(preview, t); return (
          <div className="item" key={t.id}><span className="grow"><b>{t.name}</b><div className="small muted">{n.name}</div></span><span className="chip">{TIERS[n.tier]}</span></div>
        ) })}
      </div>
    </>,
  ]

  return (
    <div className="full"><div className="stack" style={{ minHeight: '100%', gap: 16 }}>
      {pages[step]}
      <div className="grow" />
      <div className="row">
        {step > 0 && <button className="btn ghost" style={{ width: 110 }} onClick={() => setStep(step - 1)}>Back</button>}
        <button className="btn" onClick={() => step < pages.length - 1 ? setStep(step + 1) : finish()}>{step === 0 ? 'Get started' : step < pages.length - 1 ? 'Next' : 'Start training'}</button>
      </div>
    </div></div>
  )
}
