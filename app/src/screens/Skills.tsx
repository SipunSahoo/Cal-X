import { useState } from 'react'
import { EQUIPMENT, EX, TIERS, trackById } from '../data/catalog'
import { GuideBody } from './Manual'
import { activeTracks, bests, loadOf, status, targetOf, trainingNode, unit } from '../engine/progression'
import { useStore } from '../store'
import { Sheet } from '../ui'
import { Icon, TRACK_ICON } from '../icons'

const COLOR = { done: 'var(--good)', current: 'var(--accent)', gear: 'var(--locked)', locked: 'var(--locked)' }

export default function Skills() {
  const s = useStore()
  const tracks = activeTracks(s)
  const [trackId, setTrackId] = useState(tracks[0].id)
  const [open, setOpen] = useState<string | null>(null)
  const all = tracks.flatMap(t => t.nodes)
  const t = tracks.find(x => x.id === trackId) ?? tracks[0]
  const training = trainingNode(s, t)

  return (
    <>
      <div className="row between" style={{ alignItems: 'flex-end' }}>
        <div><div className="eyebrow">Skill tree</div><h1 style={{ marginTop: 2 }}>Your path</h1></div>
        <span className="chip"><Icon name="trophy" size={15} /> {all.filter(n => s.mastered.includes(n.id)).length}/{all.length}</span>
      </div>
      <div className="grid3" style={{ marginTop: 16 }}>
        {tracks.map(x => {
          const d = x.nodes.filter(n => s.mastered.includes(n.id)).length, on = x.id === trackId
          return (
            <button key={x.id} className="tile mini" aria-pressed={on} onClick={() => setTrackId(x.id)}
              style={on ? { borderColor: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 8%, var(--panel))' } : undefined}>
              <span className="ico sm"><Icon name={TRACK_ICON[x.id] ?? 'dumbbell'} size={18} /></span>
              <span className="t" style={{ fontWeight: 600 }}>{x.name}</span>
              <span className="bar" style={{ width: '100%' }}><i style={{ width: `${(d / x.nodes.length) * 100}%` }} /></span>
              <span className="d">{d}/{x.nodes.length}</span>
            </button>
          )
        })}
      </div>

      <div className="section-head" style={{ marginTop: 22 }}><h2>{t.name}</h2><span className="tag">now: {training.name}</span></div>
      <div className="card" style={{ marginTop: 10, paddingBottom: 4 }}>
        {t.nodes.map((n, k) => {
          const st = status(s, n), cur = training.id === n.id && st !== 'done', dim = st === 'locked' || st === 'gear'
          return (
            <button key={n.id} className="row" style={{ width: '100%', alignItems: 'stretch', gap: 14 }} onClick={() => setOpen(n.id)}>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32 }}>
                <span className={`ico sm ${st === 'done' ? 'good' : cur ? '' : 'muted'}`} style={cur ? { boxShadow: '0 0 0 2px var(--accent)' } : undefined}>
                  <Icon name={st === 'done' ? 'check' : dim ? 'lock' : TRACK_ICON[t.id] ?? 'dumbbell'} size={16} /></span>
                {k < t.nodes.length - 1 && <span style={{ flex: 1, width: 2, minHeight: 14, margin: '4px 0', borderRadius: 2, background: st === 'done' ? COLOR.done : 'var(--line)' }} />}
              </span>
              <span className="grow" style={{ paddingBottom: 16, paddingTop: 5, opacity: dim ? 0.55 : 1 }}>
                <span className="row between"><b style={{ fontWeight: 600 }}>{n.name}</b><span className="tag">{TIERS[n.tier]}</span></span>
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
  const t = trackById(n.track)
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
        <div className="small muted">Current target {targetOf(s, n)}{unit(n)}{n.load ? ` at ${loadOf(s, n)} kg` : ''} · best {best ? `${best.value}${unit(n)}` : '–'}</div>
        {n.load?.grad && <div className="small muted">Moves on to the next lift at {n.load.grad} kg for {n.hi} reps.</div>}
      </div>
      {req.length > 0 && <div className="stack" style={{ gap: 6 }}><div className="eyebrow">To unlock</div>
        {req.map(([l, ok]) => <div key={l} className="row small"><span style={{ color: ok ? 'var(--good)' : 'var(--bad)' }}>{ok ? '✓' : '✕'}</span>{l}</div>)}</div>}
      {nxt && <div className="small muted">Unlocks next: <b style={{ color: 'var(--text)' }}>{nxt.name}</b></div>}
      <GuideBody ex={n} />
    </Sheet>
  )
}
