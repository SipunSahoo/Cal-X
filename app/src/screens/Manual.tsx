import { useState } from 'react'
import { TRACKS, videoUrl, type Exercise } from '../data/catalog'
import { BASICS, guideFor } from '../data/manual'
import { buildSession } from '../engine/progression'
import { Icon, exIcon } from '../icons'
import { useStore } from '../store'
import { NodeSheet } from './Skills'

/** How-to block for one exercise: why, steps, mistakes, breathing, easier/harder. */
export function GuideBody({ ex }: { ex: Exercise }) {
  const g = guideFor(ex)
  const t = ex.track ? TRACKS.find(x => x.id === ex.track) : undefined
  const easier = t?.nodes[ex.index - 1], harder = t?.nodes[ex.index + 1]
  return (
    <>
      <div className="tile row" style={{ alignItems: 'flex-start' }}>
        <span className="ico sm good"><Icon name="progress" size={17} /></span>
        <span className="grow"><div className="t">Why it helps</div><div className="d">{g.why}</div></span>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <div className="eyebrow">How to do it</div>
        {g.steps.map((st, k) => (
          <div key={k} className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
            <span className="num" style={{ width: 24, height: 24, flex: 'none', borderRadius: 8, display: 'grid', placeItems: 'center', fontSize: 13, background: 'var(--accent-soft)', color: 'var(--accent)' }}>{k + 1}</span>
            <span style={{ fontSize: 14, paddingTop: 2 }}>{st}</span>
          </div>
        ))}
      </div>
      <div className="grid2">
        <div className="tile"><span className="ico sm" style={{ background: 'color-mix(in srgb, var(--bad) 14%, transparent)', color: 'var(--bad)' }}><Icon name="close" size={16} /></span>
          <span><div className="t">Avoid</div>{g.avoid.map(a => <div key={a} className="d">· {a}</div>)}</span></div>
        <div className="tile"><span className="ico sm breath"><Icon name="breath" size={16} /></span>
          <span><div className="t">Breathing</div><div className="d">{g.breathe}</div></span></div>
      </div>
      {(easier || harder) && (
        <div className="d">{easier && <>Too hard? Go back to <b style={{ color: 'var(--text)' }}>{easier.name}</b>. </>}{harder && <>Next step: <b style={{ color: 'var(--text)' }}>{harder.name}</b>.</>}</div>
      )}
      <a className="btn ghost" href={videoUrl(ex.name)} target="_blank" rel="noreferrer"><Icon name="play" size={16} /> Watch a demo video</a>
    </>
  )
}

/** The beginner's manual: basics + today's exercises. */
export default function Manual({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const [open, setOpen] = useState<string | null>(null)
  const exercises = buildSession(s).map(p => p.ex)
  return (
    <div className="full"><div className="stack" style={{ gap: 0 }}>
      <div className="row between"><button className="chip icon" aria-label="Close" onClick={onClose}><Icon name="back" size={16} /></button><span className="tag">Exercise manual</span><span style={{ width: 36 }} /></div>
      <h1 style={{ marginTop: 14 }}>Train well, stay healthy</h1>
      <p className="muted small" style={{ margin: '8px 0 0' }}>New to training? Start with the basics below, then tap any exercise to learn how to do it safely.</p>

      <section className="section">
        <div className="section-head"><h2>The basics</h2><span className="tag">{BASICS.length} short reads</span></div>
        {BASICS.map(b => (
          <div key={b.title} className="tile row" style={{ alignItems: 'flex-start' }}>
            <span className="ico sm"><Icon name={b.icon} size={18} /></span>
            <span className="grow"><div className="t">{b.title}</div><div className="d" style={{ fontSize: 13 }}>{b.text}</div></span>
          </div>
        ))}
      </section>

      <section className="section" style={{ marginBottom: 12 }}>
        <div className="section-head"><h2>Your exercises</h2><span className="tag">tap for how-to</span></div>
        <div className="grid2">
          {exercises.map(ex => (
            <button key={ex.id} className="tile" onClick={() => setOpen(ex.id)}>
              <span className="ico sm"><Icon name={exIcon(ex)} size={18} /></span>
              <span><div className="t">{ex.name}</div><div className="d">{guideFor(ex).why.split('.')[0]}.</div></span>
            </button>
          ))}
        </div>
      </section>
      {open && <NodeSheet id={open} onClose={() => setOpen(null)} />}
    </div></div>
  )
}
