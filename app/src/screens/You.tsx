import { useState } from 'react'
import { EQUIPMENT, TIERS, TRACKS, type Equipment, type Tier } from '../data/catalog'
import { parseDay, trainingNode, type Rules } from '../engine/progression'
import { EQUIP_ICON, Icon } from '../icons'
import { enterDemo, exitDemo, exportBackup, importBackup, resetAll, setState, useStore } from '../store'
import { toast } from '../ui'
import Reminders from './Reminders'

const RULES: { k: keyof Rules; label: string; min: number; max: number; step: number; fmt: (v: number) => string }[] = [
  { k: 'maxRpe', label: 'Max effort to progress', min: 7, max: 9, step: 1, fmt: v => `${v}/10` },
  { k: 'failPct', label: 'Ease off below', min: 60, max: 90, step: 5, fmt: v => `${v}%` },
  { k: 'lightBelow', label: 'Lighter session below readiness', min: 30, max: 70, step: 5, fmt: v => `${v}` },
]

export default function You() {
  const s = useStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const tiers = TRACKS.map(t => trainingNode(s, t).tier)
  const level = (['E', 'A', 'I', 'B', 'F'] as Tier[]).find(t => tiers.filter(x => x === t).length >= 3) ?? [...tiers].sort()[0]
  const toggleGear = (e: Equipment) => {
    setState(x => ({ ...x, equipment: x.equipment.includes(e) ? x.equipment.filter(y => y !== e) : [...x.equipment, e] }))
    if (e === 'bar' && !s.equipment.includes('bar')) toast('Pull-up bar added. Bar skills can now unlock.')
  }
  const setTheme = (t: string) => {
    if (t === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t
    try { if (t === 'system') localStorage.removeItem('calx-theme'); else localStorage.setItem('calx-theme', t) } catch { /* optional */ }
  }

  return (
    <>
      <div className="tile hero">
        <div className="row">
          <span className="ico" style={{ width: 52, height: 52, borderRadius: 16 }}><Icon name="you" size={26} /></span>
          <span className="grow"><div className="eyebrow">Current level</div><h1 style={{ fontSize: 26 }}>{TIERS[level]}</h1></span>
        </div>
        <div className="d">Training since {parseDay(s.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · strength Mon / Wed / Fri</div>
      </div>

      <Reminders />

      <section className="section">
        <div className="section-head"><h2>Equipment</h2><span className="tag">tap to toggle</span></div>
        <div className="grid3">
          {(Object.keys(EQUIPMENT) as Equipment[]).map(e => {
            const on = s.equipment.includes(e)
            return (
              <button key={e} className={`tile mini ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggleGear(e)}>
                {on && <span className="tick"><Icon name="check" size={12} /></span>}
                <span className={`ico sm ${on ? 'good' : 'muted'}`}><Icon name={EQUIP_ICON[e]} size={18} /></span>
                <span className="t">{EQUIPMENT[e]}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Progression rules</h2></div>
        <div className="tile" style={{ gap: 16 }}>
          {RULES.map(r => (
            <label key={r.k} className="stack" style={{ gap: 6 }}>
              <span className="row between"><span className="t">{r.label}</span><b className="num">{r.fmt(s.rules[r.k])}</b></span>
              <input id={`rule-${r.k}`} type="range" min={r.min} max={r.max} step={r.step} value={s.rules[r.k]}
                onChange={e => setState(x => ({ ...x, rules: { ...x.rules, [r.k]: +e.target.value } }))} />
            </label>
          ))}
          <div className="d">Every set at or under the max effort → target goes up. Top of the range → next variation. Below the floor → target goes down.</div>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Backup</h2><span className="tag">data lives on this phone</span></div>
        <div className="grid2">
          <button className="tile" onClick={exportBackup}>
            <span className="ico sm"><Icon name="download" size={18} /></span><span><div className="t">Export</div><div className="d">Save to Files or iCloud Drive</div></span>
          </button>
          <label className="tile" style={{ cursor: 'pointer' }}>
            <span className="ico sm"><Icon name="upload" size={18} /></span><span><div className="t">Import</div><div className="d">Restore from a backup file</div></span>
            <input type="file" accept="application/json,.json" hidden onChange={async e => {
              const f = e.target.files?.[0]; if (!f) return
              try { await importBackup(f); toast('Backup restored.') } catch (err) { toast((err as Error).message || 'Could not read that file.') }
            }} />
          </label>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Appearance</h2></div>
        <div className="grid3">
          {([['dark', 'Dark', 'moon'], ['light', 'Light', 'sun'], ['system', 'System', 'contrast']] as const).map(([t, l, ic]) => (
            <button key={t} className="tile mini" onClick={() => setTheme(t)}><span className="ico sm muted"><Icon name={ic} size={18} /></span><span className="t">{l}</span></button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Preview</h2></div>
        <button className="tile row" style={s.demo ? { borderColor: 'var(--accent)' } : undefined}
          onClick={async () => { if (s.demo) { exitDemo(); toast('Your real data is back.') } else { try { await enterDemo(); toast('Demo data loaded. Your real data is safe.') } catch (e) { toast((e as Error).message) } } }}>
          <span className="ico"><Icon name={s.demo ? 'close' : 'progress'} /></span>
          <span className="grow"><span className="t">{s.demo ? 'Exit demo data' : 'Preview with demo data'}</span>
            <div className="d">{s.demo ? 'Brings back your real data exactly as it was.' : '8 weeks of sample training, breathing and weigh-ins. Your real data is set aside, not deleted.'}</div></span>
        </button>
      </section>

      <section className="section">
        <div className="section-head"><h2>Start over</h2></div>
        <div className="grid2">
          <button className="tile" onClick={() => setState(x => ({ ...x, onboarded: false }))}>
            <span className="ico sm muted"><Icon name="restart" size={18} /></span><span><div className="t">Redo assessment</div><div className="d">Keeps your history</div></span>
          </button>
          <button className="tile" style={confirmReset ? { borderColor: 'var(--bad)' } : undefined} onClick={() => confirmReset ? resetAll() : setConfirmReset(true)}>
            <span className="ico sm" style={{ background: 'color-mix(in srgb, var(--bad) 14%, transparent)', color: 'var(--bad)' }}><Icon name="trash" size={18} /></span>
            <span><div className="t" style={{ color: 'var(--bad)' }}>{confirmReset ? 'Tap again to delete' : 'Delete all data'}</div><div className="d">{confirmReset ? 'This cannot be undone' : 'Export a backup first'}</div></span>
          </button>
        </div>
      </section>
    </>
  )
}
