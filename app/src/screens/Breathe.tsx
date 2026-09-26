import { useState } from 'react'
import { mmss, phaseText, sequenceSeconds, stepSeconds, type BreathPattern, type BreathSequence, type BreathState } from '../data/breathing'
import { cue, unlockCues } from '../engine/cues'
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

  const summary = (seq: BreathSequence) => seq.steps.map(st => st.kind === 'pause' ? `pause ${st.seconds}s`
    : `${b.patterns.find(p => p.id === st.patternId)?.name ?? '?'} ×${st.rounds}`).join(' · ')

  if (playing) return <BreathPlayer seq={playing} onClose={() => setPlaying(null)} />
  if (editSeq) return <SequenceEditor initial={editSeq} onClose={() => setEditSeq(null)} />

  return (
    <>
      <div className="tag">Breathe</div>
      <h1 style={{ marginTop: 4 }}>Pranayama</h1>
      <p className="small muted" style={{ margin: '6px 0 0' }}>Inhale · hold · exhale · hold. Keep the phone in your hand or in front of you. A tone and a buzz mark every phase change.</p>

      <section className="section">
        <div className="eyebrow">Sequences</div>
        <div className="card list">
          {b.sequences.map((seq, k) => (
            <div key={seq.id} className="item">
              <span className="idx">{pad(k + 1)}</span>
              <button className="grow" onClick={() => setPlaying(seq)}>
                <b style={{ fontWeight: 600 }}>{seq.name}</b>
                <div className="small muted">{summary(seq) || 'No steps yet'}</div>
              </button>
              <span className="num" style={{ fontSize: 16 }}>{mmss(sequenceSeconds(seq, b.patterns))}</span>
              <button className="chip" onClick={() => setEditSeq(seq)}>Edit</button>
            </div>
          ))}
        </div>
        <button className="btn ghost" onClick={() => setEditSeq({ id: `s-${Date.now()}`, name: 'My sequence', steps: [{ kind: 'breath', patternId: b.patterns[0].id, rounds: 6 }] })}>+ New sequence</button>
      </section>

      <section className="section">
        <div className="eyebrow">Patterns · in · hold · out · hold</div>
        <div className="card list">
          {b.patterns.map(p => (
            <button key={p.id} className="item" onClick={() => setEditPat(p)}>
              <span className="grow"><b style={{ fontWeight: 600 }}>{p.name}</b>{p.note && <div className="small muted">{p.note}</div>}</span>
              <span className="num" style={{ fontSize: 16, color: 'var(--breath)' }}>{phaseText(p)}</span>
            </button>
          ))}
        </div>
        <button className="btn ghost" onClick={() => setEditPat({ id: `p-${Date.now()}`, name: 'My pattern', inhale: 4, hold1: 2, exhale: 6, hold2: 0 })}>+ New pattern</button>
      </section>

      <section className="section">
        <div className="eyebrow">Cues</div>
        <div className="card list">
          <CheckRow on={b.prefs.sound} title="Sound" sub="Rising tone = inhale · falling = exhale · single note = hold" onToggle={() => setBreath(x => ({ ...x, prefs: { ...x.prefs, sound: !x.prefs.sound } }))} />
          <CheckRow on={b.prefs.haptic} title="Vibration" sub="Short = inhale · long = exhale · double = hold. On iPhone this needs iOS 18 and is lighter than Android." onToggle={() => setBreath(x => ({ ...x, prefs: { ...x.prefs, haptic: !x.prefs.haptic } }))} />
          <label className="item" style={{ display: 'block' }}>
            <span className="row between"><span>Volume</span><b className="num">{Math.round(b.prefs.volume * 100)}</b></span>
            <input id="breath-volume" type="range" min={0.1} max={1} step={0.05} value={b.prefs.volume} onChange={e => setBreath(x => ({ ...x, prefs: { ...x.prefs, volume: +e.target.value } }))} />
          </label>
        </div>
        <button className="btn ghost" onClick={() => { unlockCues(); cue('inhale', b.prefs); setTimeout(() => cue('exhale', b.prefs), 1300) }}>Test cues</button>
      </section>

      {editPat && <PatternSheet initial={editPat} onClose={() => setEditPat(null)} onPlay={seq => { setEditPat(null); setPlaying(seq) }} />}
    </>
  )
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
