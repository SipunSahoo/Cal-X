import { useState } from 'react'
import { EQUIPMENT, TIERS, TRACKS, type Equipment, type Tier } from '../data/catalog'
import { parseDay, trainingNode, type Rules } from '../engine/progression'
import { exportBackup, importBackup, resetAll, setState, useStore } from '../store'
import { CheckRow, toast } from '../ui'

const RULES: { k: keyof Rules; label: string; min: number; max: number; step: number; fmt: (v: number) => string }[] = [
  { k: 'maxRpe', label: 'Max effort to progress', min: 7, max: 9, step: 1, fmt: v => `${v}/10` },
  { k: 'failPct', label: 'Ease off below', min: 60, max: 90, step: 5, fmt: v => `${v}%` },
  { k: 'lightBelow', label: 'Lighter session below readiness', min: 30, max: 70, step: 5, fmt: v => `${v}` },
]

export default function You() {
  const s = useStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const tiers = TRACKS.map(t => trainingNode(s, t).tier)
  const level = (['E', 'A', 'I', 'B', 'F'] as Tier[]).find(t => tiers.filter(x => x === t).length >= 3) ?? tiers.sort()[0]
  const toggleGear = (e: Equipment) => setState(x => ({ ...x, equipment: x.equipment.includes(e) ? x.equipment.filter(y => y !== e) : [...x.equipment, e] }))
  const setTheme = (t: string) => { document.documentElement.dataset.theme = t; try { localStorage.setItem('calx-theme', t) } catch { /* optional */ } }

  return (
    <>
      <div className="eyebrow">You</div>
      <h1 style={{ marginTop: 4 }}>{TIERS[level]}</h1>
      <div className="small muted">Training since {parseDay(s.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · Mon / Wed / Fri strength</div>

      <div className="section"><div className="eyebrow">Equipment</div>
        <div className="card list">
          {(Object.keys(EQUIPMENT) as Equipment[]).map(e => <CheckRow key={e} on={s.equipment.includes(e)} title={EQUIPMENT[e]}
            sub={e === 'bar' ? 'Unlocks dead hang, pull-ups and muscle-ups' : undefined}
            onToggle={() => { toggleGear(e); if (e === 'bar' && !s.equipment.includes('bar')) toast('Pull-up bar added. Bar skills can now unlock.') }} />)}
        </div>
      </div>

      <div className="section"><div className="eyebrow">Progression rules</div>
        <div className="card stack">
          {RULES.map(r => (
            <label key={r.k} className="stack" style={{ gap: 4 }}>
              <span className="row between"><span>{r.label}</span><b>{r.fmt(s.rules[r.k])}</b></span>
              <input id={`rule-${r.k}`} type="range" min={r.min} max={r.max} step={r.step} value={s.rules[r.k]}
                onChange={e => setState(x => ({ ...x, rules: { ...x.rules, [r.k]: +e.target.value } }))} />
            </label>
          ))}
          <div className="small muted">Hit every set at or under the max effort and the target goes up. Hit the top of the range and you move to the next variation. Fall below the floor and the target goes down.</div>
        </div>
      </div>

      <div className="section"><div className="eyebrow">Backup</div>
        <div className="small muted">Your data lives only on this phone. Export a backup now and then, and save it to Files or iCloud Drive.</div>
        <button className="btn ghost" onClick={exportBackup}>Export backup</button>
        <label className="btn ghost">Import backup
          <input type="file" accept="application/json,.json" hidden onChange={async e => {
            const f = e.target.files?.[0]; if (!f) return
            try { await importBackup(f); toast('Backup restored.') } catch (err) { toast((err as Error).message || 'Could not read that file.') }
          }} /></label>
      </div>

      <div className="section"><div className="eyebrow">Appearance</div>
        <div className="row"><button className="btn ghost" onClick={() => setTheme('dark')}>Dark</button><button className="btn ghost" onClick={() => setTheme('light')}>Light</button></div>
      </div>

      <div className="section"><div className="eyebrow">Start over</div>
        <button className="btn ghost" onClick={() => setState(x => ({ ...x, onboarded: false }))}>Redo assessment (keeps history)</button>
        {confirmReset
          ? <div className="row"><button className="btn ghost" onClick={() => setConfirmReset(false)}>Cancel</button><button className="btn" style={{ background: 'var(--bad)' }} onClick={resetAll}>Delete everything</button></div>
          : <button className="btn ghost" style={{ color: 'var(--bad)' }} onClick={() => setConfirmReset(true)}>Delete all data</button>}
      </div>
    </>
  )
}
