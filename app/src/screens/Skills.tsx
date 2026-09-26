import { useState } from 'react'
import { EQUIPMENT, EX, TIERS, TRACKS, videoUrl } from '../data/catalog'
import { bests, status, targetOf, trainingNode, unit } from '../engine/progression'
import { useStore } from '../store'
import { Sheet } from '../ui'

const COLOR = { done: 'var(--good)', current: 'var(--accent)', gear: 'var(--locked)', locked: 'var(--locked)' }

export default function Skills() {
  const s = useStore()
  const [trackId, setTrackId] = useState('push')
  const [open, setOpen] = useState<string | null>(null)
  const all = TRACKS.flatMap(t => t.nodes)
  const t = TRACKS.find(x => x.id === trackId)!
  const training = trainingNode(s, t)

  return (
    <>
      <div className="row between" style={{ alignItems: 'flex-end' }}>
        <div><div className="tag">Skill tree</div><h1 style={{ marginTop: 4 }}>{t.name}</h1></div>
        <span><span className="num" style={{ fontSize: 28 }}>{all.filter(n => s.mastered.includes(n.id)).length}</span><span className="muted num" style={{ fontSize: 16 }}>/{all.length}</span></span>
      </div>
      <div className="row scroll-x" style={{ gap: 4, marginTop: 14 }}>
        {TRACKS.map(x => <button key={x.id} className={`chip ${x.id === trackId ? 'on' : ''}`} onClick={() => setTrackId(x.id)}>
          {x.name} <span style={{ opacity: .6 }}>{x.nodes.filter(n => s.mastered.includes(n.id)).length}/{x.nodes.length}</span></button>)}
      </div>

      <div className="card" style={{ marginTop: 14, paddingBottom: 4 }}>
        {t.nodes.map((n, k) => {
          const st = status(s, n), cur = training.id === n.id && st !== 'done', dim = st === 'locked' || st === 'gear'
          return (
            <button key={n.id} className="row" style={{ width: '100%', alignItems: 'stretch', gap: 14 }} onClick={() => setOpen(n.id)}>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22 }}>
                <span style={{ width: 16, height: 16, marginTop: 2, flex: 'none', transform: cur ? 'rotate(45deg)' : undefined, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, color: 'var(--bg)',
                  background: st === 'done' ? COLOR.done : cur ? COLOR.current : 'transparent', border: `1.5px solid ${cur ? COLOR.current : dim ? 'var(--line-2)' : COLOR[st]}` }}>
                  {st === 'done' ? '✓' : ''}</span>
                {k < t.nodes.length - 1 && <span style={{ flex: 1, width: 1.5, minHeight: 18, marginTop: 4, background: st === 'done' ? COLOR.done : 'var(--line-2)' }} />}
              </span>
              <span className="grow" style={{ paddingBottom: 18, opacity: dim ? 0.55 : 1 }}>
                <span className="row between"><b>{n.name}</b><span className="tag">{TIERS[n.tier]}</span></span>
                <span className="small muted" style={{ display: 'block' }}>
                  {st === 'done' ? 'Mastered' : st === 'gear' ? `Needs: ${n.needs.filter(e => !s.equipment.includes(e)).map(e => EQUIPMENT[e]).join(', ')}`
                    : cur ? `Training now · target ${targetOf(s, n)}${unit(n)} → goal ${n.hi}${unit(n)}` : `Goal 3 × ${n.hi}${unit(n)}`}</span>
                {cur && <span className="bar" style={{ display: 'block', marginTop: 6 }}><i style={{ width: `${Math.round(targetOf(s, n) / n.hi * 100)}%` }} /></span>}
              </span>
            </button>
          )
        })}
      </div>
      {open && <NodeSheet id={open} onClose={() => setOpen(null)} />}
    </>
  )
}

export function NodeSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const s = useStore()
  const n = EX[id], st = status(s, n), best = bests(s)[id]
  const t = n.track ? TRACKS.find(x => x.id === n.track) : undefined
  const prev = t?.nodes[n.index - 1], nxt = t?.nodes[n.index + 1]
  const req: [string, boolean][] = []
  if (prev) req.push([`Master ${prev.name} (3 × ${prev.hi}${unit(prev)})`, s.mastered.includes(prev.id)])
  n.needs.forEach(e => req.push([EQUIPMENT[e], s.equipment.includes(e)]))
  return (
    <Sheet onClose={onClose}>
      <div><div className="eyebrow">{t ? `${TIERS[n.tier]} · ${t.name}` : 'Accessory'}</div><h2 style={{ marginTop: 4 }}>{n.name}</h2></div>
      <span className="chip" style={{ alignSelf: 'flex-start', color: COLOR[st] === 'var(--locked)' ? 'var(--muted)' : COLOR[st] }}>
        {{ done: 'Mastered', current: 'Unlocked', gear: 'Locked: missing equipment', locked: 'Locked' }[st]}</span>
      <div className="card">
        <div className="eyebrow">Mastery goal</div>
        <div className="num" style={{ fontSize: 26 }}>3 sets × {n.hi}{unit(n) || ' reps'}{n.perSide ? ' per side' : ''}</div>
        <div className="small muted">Current target {targetOf(s, n)}{unit(n)} · best {best ? `${best.value}${unit(n)}` : '–'}</div>
      </div>
      {req.length > 0 && <div className="stack" style={{ gap: 6 }}><div className="eyebrow">To unlock</div>
        {req.map(([l, ok]) => <div key={l} className="row small"><span style={{ color: ok ? 'var(--good)' : 'var(--bad)' }}>{ok ? '✓' : '✕'}</span>{l}</div>)}</div>}
      {nxt && <div className="small muted">Unlocks next: <b style={{ color: 'var(--text)' }}>{nxt.name}</b></div>}
      <div className="stack" style={{ gap: 6 }}><div className="eyebrow">Form cue</div><div>{n.cue}</div></div>
      <a className="btn ghost" href={videoUrl(n.name)} target="_blank" rel="noreferrer">Watch demo ↗</a>
    </Sheet>
  )
}
