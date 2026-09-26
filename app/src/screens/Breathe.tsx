import { useState } from 'react'
import { cycleSeconds, mmss, phaseText, sequenceSeconds, stepSeconds, type BreathPattern, type BreathSequence, type BreathState } from '../data/breathing'
import { canVibrate, cue, unlockCues } from '../engine/cues'
import { Icon, PATTERN_ICON } from '../icons'
import { setState, useStore } from '../store'
import { CheckRow, Sheet, Stepper } from '../ui'
import BreathPlayer from './BreathPlayer'

const pad = (n: number) => String(n).padStart(2, '0')
export const setBreath = (fn: (b: BreathState) => BreathState) => setState(x => ({ ...x, breath: fn(x.breath) }))

export default function Breathe() {
  const s = useStore(), b = s.breath
  const [playing, setPlaying] = useState<BreathSequence | null>(null)
  const [editSeq, setEditSeq] = useState<BreathSequence | null>(null)
  const [editPat, setEditPat] = useState<BreathPattern | null>(null)
  const pat = (id: string) => b.patterns.find(p => p.id === id)

  if (playing) return <BreathPlayer seq={playing} onClose={() => setPlaying(null)} />
  if (editSeq) return <SequenceEditor initial={editSeq} onClose={() => setEditSeq(null)} />

  return (
    <>
      <div className="eyebrow">Pranayama</div>
      <h1 style={{ marginTop: 2 }}>Breathe</h1>

      <section className="section">
        <div className="section-head"><h2>Sequences</h2><button className="chip" onClick={() => setEditSeq({ id: `s-${Date.now()}`, name: 'My sequence', steps: [{ kind: 'breath', patternId: b.patterns[0].id, rounds: 6 }] })}><Icon name="plus" size={16} /> New</button></div>
        {b.sequences.map(seq => {
          const total = sequenceSeconds(seq, b.patterns) || 1
          const first = seq.steps.find(st => st.kind === 'breath')
          return (
            <div key={seq.id} className="tile" style={{ gap: 12 }}>
              <div className="row">
                <span className="ico breath"><Icon name={first && first.kind === 'breath' ? PATTERN_ICON[first.patternId] ?? 'breath' : 'breath'} /></span>
                <button className="grow" onClick={() => setPlaying(seq)}>
                  <div className="t" style={{ fontSize: 15 }}>{seq.name}</div>
                  <div className="d">{seq.steps.length} steps · {mmss(sequenceSeconds(seq, b.patterns))}</div>
                </button>
                <button className="chip icon" aria-label={`Edit ${seq.name}`} onClick={() => setEditSeq(seq)}><Icon name="edit" size={16} /></button>
                <button className="chip icon" aria-label={`Play ${seq.name}`} style={{ background: 'var(--breath)', color: 'var(--bg)', borderColor: 'var(--breath)' }} onClick={() => setPlaying(seq)}><Icon name="play" size={16} /></button>
              </div>
              <div className="row" style={{ gap: 3 }}>
                {seq.steps.map((st, k) => (
                  <span key={k} title={st.kind === 'pause' ? 'Pause' : pat(st.patternId)?.name}
                    style={{ height: 6, borderRadius: 3, flex: stepSeconds(st, b.patterns) / total, minWidth: 6, background: st.kind === 'pause' ? 'var(--line-2)' : 'var(--breath)', opacity: st.kind === 'pause' ? 1 : 0.55 + 0.45 * ((k % 2) ? 0.5 : 1) }} />
                ))}
              </div>
              <div className="row wrap" style={{ gap: 6 }}>
                {seq.steps.map((st, k) => <span key={k} className="tag">{st.kind === 'pause' ? `pause ${st.seconds}s` : `${pat(st.patternId)?.name ?? '?'} ×${st.rounds}`}{k < seq.steps.length - 1 ? '  →' : ''}</span>)}
              </div>
            </div>
          )
        })}
      </section>

      <section className="section">
        <div className="section-head"><h2>Patterns</h2><span className="tag">in · hold · out · hold</span></div>
        <div className="grid2">
          {b.patterns.map(p => (
            <button key={p.id} className="tile" onClick={() => setEditPat(p)}>
              <span className="row between"><span className="ico sm breath"><Icon name={PATTERN_ICON[p.id] ?? 'wave'} size={18} /></span><span className="n" style={{ fontSize: 15, color: 'var(--breath)' }}>{cycleSeconds(p)}s</span></span>
              <span><div className="t">{p.name}</div><PhaseBar p={p} /><div className="d num" style={{ fontWeight: 500 }}>{phaseText(p)}</div></span>
            </button>
          ))}
          <button className="tile" style={{ borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', color: 'var(--muted)' }} onClick={() => setEditPat({ id: `p-${Date.now()}`, name: 'My pattern', inhale: 4, hold1: 2, exhale: 6, hold2: 0 })}>
            <Icon name="plus" size={22} /><span className="t">New pattern</span>
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Cues</h2></div>
        <div className="grid2">
          <button className={`tile ${b.prefs.sound ? 'on' : ''}`} onClick={() => setBreath(x => ({ ...x, prefs: { ...x.prefs, sound: !x.prefs.sound } }))}>
            <span className={`ico sm ${b.prefs.sound ? 'good' : 'muted'}`}><Icon name="sound" size={18} /></span>
            <span><div className="t">Bowl sound</div><div className="d">{b.prefs.sound ? 'On' : 'Off'} · higher = inhale, lower = exhale</div></span>
          </button>
          <button className={`tile ${b.prefs.haptic && canVibrate ? 'on' : ''}`} disabled={!canVibrate} onClick={() => setBreath(x => ({ ...x, prefs: { ...x.prefs, haptic: !x.prefs.haptic } }))}>
            <span className={`ico sm ${b.prefs.haptic && canVibrate ? 'good' : 'muted'}`}><Icon name="vibrate" size={18} /></span>
            <span><div className="t">Vibration</div><div className="d">{canVibrate ? (b.prefs.haptic ? 'On' : 'Off') : 'iPhone doesn\'t allow web apps to vibrate. Use the sound.'}</div></span>
          </button>
        </div>
        <div className="tile row">
          <span className="ico sm muted"><Icon name="sound" size={18} /></span>
          <input id="breath-volume" className="grow" type="range" min={0.1} max={1} step={0.05} value={b.prefs.volume} aria-label="Volume"
            onChange={e => setBreath(x => ({ ...x, prefs: { ...x.prefs, volume: +e.target.value } }))} />
          <button className="chip" onClick={() => { unlockCues(); cue('inhale', { ...b.prefs, sound: true }); setTimeout(() => cue('exhale', { ...b.prefs, sound: true }), 2200) }}>Test</button>
        </div>
      </section>

      {editPat && <PatternSheet initial={editPat} onClose={() => setEditPat(null)} onPlay={seq => { setEditPat(null); setPlaying(seq) }} />}
    </>
  )
}

function PhaseBar({ p }: { p: BreathPattern }) {
  const parts: [number, string, number][] = [[p.inhale, 'var(--breath)', 1], [p.hold1, 'var(--breath)', 0.35], [p.exhale, 'var(--breath)', 0.7], [p.hold2, 'var(--line-2)', 1]]
  return <div className="row" style={{ gap: 2, margin: '8px 0 5px' }}>{parts.filter(([d]) => d > 0).map(([d, c, o], k) => <span key={k} style={{ flex: d, height: 5, borderRadius: 3, background: c, opacity: o }} />)}</div>
}

function PatternSheet({ initial, onClose, onPlay }: { initial: BreathPattern; onClose: () => void; onPlay: (s: BreathSequence) => void }) {
  const s = useStore()
  const [p, setP] = useState(initial)
  const [rounds, setRounds] = useState(8)
  const exists = s.breath.patterns.some(x => x.id === p.id)
  const inUse = s.breath.sequences.some(q => q.steps.some(st => st.kind === 'breath' && st.patternId === p.id))
  const save = () => setBreath(b => ({ ...b, patterns: exists ? b.patterns.map(x => x.id === p.id ? p : x) : [...b.patterns, p] }))
  const phases: [keyof BreathPattern, string, number][] = [['inhale', 'Inhale', 1], ['hold1', 'Hold (full)', 0], ['exhale', 'Exhale', 1], ['hold2', 'Hold (empty)', 0]]
  return (
    <Sheet onClose={onClose}>
      <input id="pattern-name" type="text" value={p.name} onChange={e => setP({ ...p, name: e.target.value })} aria-label="Pattern name" />
      <div className="card list">
        {phases.map(([k, label, min]) => (
          <div key={k} className="item"><span className="grow">{label}</span>
            <Stepper value={p[k] as number} min={min} max={30} suffix="s" onChange={v => setP({ ...p, [k]: v })} /></div>
        ))}
        <CheckRow on={!!p.alternate} title="Alternate nostrils" sub="Shows left / right on each breath" onToggle={() => setP({ ...p, alternate: !p.alternate })} />
        <div className="item"><span className="grow">Rounds to practise now</span><Stepper value={rounds} min={1} max={99} onChange={setRounds} /></div>
      </div>
      <div className="small muted">One round = {p.inhale + p.hold1 + p.exhale + p.hold2}s · {rounds} rounds = {mmss((p.inhale + p.hold1 + p.exhale + p.hold2) * rounds)}</div>
      <button className="btn breath" onClick={() => { save(); onPlay({ id: 'quick', name: p.name, steps: [{ kind: 'breath', patternId: p.id, rounds }] }) }}>Save & start</button>
      <div className="row">
        <button className="btn ghost" onClick={() => { save(); onClose() }}>Save</button>
        {exists && <button className="btn ghost" style={{ color: 'var(--bad)' }} disabled={inUse} onClick={() => { setBreath(b => ({ ...b, patterns: b.patterns.filter(x => x.id !== p.id) })); onClose() }}>Delete</button>}
      </div>
      {exists && inUse && <div className="small muted">Used in a sequence, so it can't be deleted.</div>}
    </Sheet>
  )
}

function SequenceEditor({ initial, onClose }: { initial: BreathSequence; onClose: () => void }) {
  const s = useStore(), patterns = s.breath.patterns
  const [seq, setSeq] = useState(initial)
  const [confirmDel, setConfirmDel] = useState(false)
  const exists = s.breath.sequences.some(x => x.id === seq.id)
  const steps = seq.steps
  const setSteps = (next: typeof steps) => setSeq({ ...seq, steps: next })
  const move = (k: number, d: number) => { const n = [...steps]; const [x] = n.splice(k, 1); n.splice(k + d, 0, x); setSteps(n) }
  const save = () => { setBreath(b => ({ ...b, sequences: exists ? b.sequences.map(x => x.id === seq.id ? seq : x) : [...b.sequences, seq] })); onClose() }

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row between"><button className="chip" onClick={onClose}>← Back</button><span className="num">{mmss(sequenceSeconds(seq, patterns))}</span></div>
      <input id="sequence-name" type="text" value={seq.name} onChange={e => setSeq({ ...seq, name: e.target.value })} aria-label="Sequence name" />
      <div className="card list">
        {steps.map((st, k) => (
          <div key={k} className="item" style={{ flexWrap: 'wrap' }}>
            <span className="idx">{pad(k + 1)}</span>
            {st.kind === 'breath' ? (
              <select value={st.patternId} aria-label="Pattern" onChange={e => setSteps(steps.map((x, j) => j === k ? { ...st, patternId: e.target.value } : x))}
                className="grow" style={{ font: 'inherit', fontWeight: 600, color: 'var(--text)', background: 'var(--panel-2)', border: '1px solid var(--line-2)', borderRadius: 4, padding: '8px 6px' }}>
                {patterns.map(p => <option key={p.id} value={p.id}>{p.name} ({phaseText(p)})</option>)}
              </select>
            ) : <span className="grow" style={{ fontWeight: 600, color: 'var(--muted)' }}>Pause</span>}
            <span className="row" style={{ gap: 4 }}>
              <button className="chip" aria-label="Move up" disabled={k === 0} onClick={() => move(k, -1)}>↑</button>
              <button className="chip" aria-label="Move down" disabled={k === steps.length - 1} onClick={() => move(k, 1)}>↓</button>
              <button className="chip" aria-label="Remove step" style={{ color: 'var(--bad)' }} onClick={() => setSteps(steps.filter((_, j) => j !== k))}>✕</button>
            </span>
            <span className="row between" style={{ width: '100%', paddingLeft: 34 }}>
              {st.kind === 'breath'
                ? <><span className="small muted">Rounds · {mmss(stepSeconds(st, patterns))}</span><Stepper value={st.rounds} min={1} max={99} onChange={v => setSteps(steps.map((x, j) => j === k ? { ...st, rounds: v } : x))} /></>
                : <><span className="small muted">Seconds</span><Stepper value={st.seconds} min={5} max={600} step={5} suffix="s" onChange={v => setSteps(steps.map((x, j) => j === k ? { ...st, seconds: v } : x))} /></>}
            </span>
          </div>
        ))}
      </div>
      <div className="row">
        <button className="btn ghost" onClick={() => setSteps([...steps, { kind: 'breath', patternId: patterns[0].id, rounds: 6 }])}>+ Breathing</button>
        <button className="btn ghost" onClick={() => setSteps([...steps, { kind: 'pause', seconds: 30 }])}>+ Pause</button>
      </div>
      <button className="btn breath" disabled={!steps.length} onClick={save}>Save sequence</button>
      {exists && (confirmDel
        ? <div className="row"><button className="btn ghost" onClick={() => setConfirmDel(false)}>Cancel</button><button className="btn" style={{ background: 'var(--bad)' }} onClick={() => { setBreath(b => ({ ...b, sequences: b.sequences.filter(x => x.id !== seq.id) })); onClose() }}>Delete</button></div>
        : <button className="btn ghost" style={{ color: 'var(--bad)' }} onClick={() => setConfirmDel(true)}>Delete sequence</button>)}
    </div>
  )
}
