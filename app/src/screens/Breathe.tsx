import { useState, type ReactNode } from 'react'
import {
  PRESETS, allPatterns, cycleSeconds, isPreset, mmss, myPatterns, mySequences, phaseText, sequenceSeconds, stepSeconds,
  type BreathPattern, type BreathSequence, type BreathState,
} from '../data/breathing'
import { canVibrate, cue, unlockCues } from '../engine/cues'
import { Icon, PATTERN_ICON } from '../icons'
import { setState, useStore } from '../store'
import { CheckRow, Sheet, Stepper, toast } from '../ui'
import BreathPlayer from './BreathPlayer'

const pad = (n: number) => String(n).padStart(2, '0')
export const setBreath = (fn: (b: BreathState) => BreathState) => setState(x => ({ ...x, breath: fn(x.breath) }))
const newId = (p: string) => `${p}-${Date.now()}`
const patIcon = (id: string) => PATTERN_ICON[id] ?? 'wave'

type View = 'suggested' | 'mine'

export default function Breathe() {
  const s = useStore(), b = s.breath
  const [view, setView] = useState<View>(() => (myPatterns(b).length || mySequences(b).length ? 'mine' : 'suggested'))
  const [playing, setPlaying] = useState<BreathSequence | null>(null)
  const [editSeq, setEditSeq] = useState<BreathSequence | null>(null)
  const [openPat, setOpenPat] = useState<BreathPattern | null>(null)
  const [cues, setCues] = useState(false)
  const patterns = allPatterns(b)

  if (playing) return <BreathPlayer seq={playing} onClose={() => setPlaying(null)} />
  if (editSeq) return <SequenceEditor initial={editSeq} onClose={() => setEditSeq(null)} />

  const copyOf = (p: BreathPattern): BreathPattern => ({ ...p, id: newId('p'), name: `${p.name} (mine)` })
  const seqs = view === 'suggested' ? PRESETS.sequences : mySequences(b)
  const pats = view === 'suggested' ? PRESETS.patterns : myPatterns(b)

  return (
    <>
      <div className="row between" style={{ alignItems: 'flex-end' }}>
        <div><div className="eyebrow">Pranayama</div><h1 style={{ marginTop: 2 }}>Breathe</h1></div>
        <button className="chip" onClick={() => setCues(true)}><Icon name="sound" size={15} /> Cues</button>
      </div>

      <div role="tablist" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 16, padding: 4, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14 }}>
        {([['suggested', 'Suggested'], ['mine', 'My breathing']] as const).map(([v, l]) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
            style={{ padding: '9px 0', borderRadius: 10, textAlign: 'center', fontWeight: 600, fontSize: 14, background: view === v ? 'var(--panel-2)' : undefined, color: view === v ? 'var(--text)' : 'var(--muted)' }}>{l}</button>
        ))}
      </div>

      <section className="section">
        <div className="section-head"><h2>Sequences</h2>
          {view === 'mine' && <button className="chip" onClick={() => setEditSeq({ id: newId('s'), name: 'My sequence', steps: [{ kind: 'breath', patternId: patterns[0].id, rounds: 10 }] })}><Icon name="plus" size={15} /> New</button>}
        </div>
        {!seqs.length && <Empty icon="breath" text="No sequences yet. Mix your favourite patterns with pauses into one session." />}
        {seqs.map(seq => (
          <SequenceCard key={seq.id} seq={seq} patterns={patterns} onPlay={() => setPlaying(seq)}
            action={view === 'mine'
              ? <button className="chip icon" aria-label={`Edit ${seq.name}`} onClick={() => setEditSeq(seq)}><Icon name="edit" size={16} /></button>
              : <button className="chip" onClick={() => { setEditSeq({ ...seq, id: newId('s'), name: `${seq.name} (mine)` }); setView('mine') }}>Customize</button>} />
        ))}
      </section>

      <section className="section">
        <div className="section-head"><h2>Patterns</h2><span className="tag">in · hold · out · hold</span></div>
        <div className="grid2">
          {pats.map(p => (
            <button key={p.id} className="tile" onClick={() => setOpenPat(p)}>
              <span className="row between"><span className="ico sm breath"><Icon name={patIcon(p.id)} size={18} /></span><span style={{ textAlign: 'right' }}><span className="n" style={{ fontSize: 17, color: 'var(--breath)' }}>{p.rounds ?? 10}×</span><div className="d">{mmss(cycleSeconds(p) * (p.rounds ?? 10))}</div></span></span>
              <span><div className="t">{p.name}</div><PhaseBar p={p} /><div className="d num" style={{ fontWeight: 500 }}>{phaseText(p)} · {cycleSeconds(p)}s a round</div></span>
            </button>
          ))}
          {view === 'mine' && (
            <button className="tile" style={{ borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', color: 'var(--muted)', minHeight: 120 }}
              onClick={() => setOpenPat({ id: newId('p'), name: 'My pattern', inhale: 4, hold1: 2, exhale: 6, hold2: 0 })}>
              <Icon name="plus" size={22} /><span className="t">New pattern</span>
            </button>
          )}
        </div>
      </section>

      {openPat && (isPreset(openPat.id)
        ? <PresetSheet p={openPat} onClose={() => setOpenPat(null)} onPlay={setPlaying}
            onCopy={() => { const c = copyOf(openPat); setBreath(x => ({ ...x, patterns: [...x.patterns, c] })); setView('mine'); setOpenPat(c); toast('Copied to My breathing.') }} />
        : <PatternEditor initial={openPat} onClose={() => setOpenPat(null)} onPlay={seq => { setOpenPat(null); setPlaying(seq) }} />)}
      {cues && <CueSheet onClose={() => setCues(false)} />}
    </>
  )
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return <div className="tile row" style={{ borderStyle: 'dashed' }}><span className="ico sm muted"><Icon name={icon} size={18} /></span><span className="d grow">{text}</span></div>
}

function SequenceCard({ seq, patterns, onPlay, action }: { seq: BreathSequence; patterns: BreathPattern[]; onPlay: () => void; action: ReactNode }) {
  const total = sequenceSeconds(seq, patterns) || 1
  const pat = (id: string) => patterns.find(p => p.id === id)
  const first = seq.steps.find(st => st.kind === 'breath')
  return (
    <div className="tile" style={{ gap: 12 }}>
      <div className="row">
        <span className="ico breath"><Icon name={first?.kind === 'breath' ? patIcon(first.patternId) : 'breath'} /></span>
        <button className="grow" onClick={onPlay}>
          <div className="t" style={{ fontSize: 15 }}>{seq.name}</div>
          <div className="d">{seq.steps.length} step{seq.steps.length === 1 ? '' : 's'} · {mmss(sequenceSeconds(seq, patterns))}</div>
        </button>
        {action}
        <button className="chip icon" aria-label={`Play ${seq.name}`} style={{ background: 'var(--breath)', color: 'var(--bg)', borderColor: 'var(--breath)' }} onClick={onPlay}><Icon name="play" size={16} /></button>
      </div>
      <div className="row" style={{ gap: 3 }}>
        {seq.steps.map((st, k) => (
          <span key={k} style={{ height: 6, borderRadius: 3, flex: stepSeconds(st, patterns) / total, minWidth: 6, background: st.kind === 'pause' ? 'var(--line-2)' : 'var(--breath)', opacity: st.kind === 'pause' ? 1 : k % 2 ? 0.6 : 1 }} />
        ))}
      </div>
      <div className="d">{seq.steps.map(st => st.kind === 'pause' ? `pause ${st.seconds}s` : `${pat(st.patternId)?.name ?? '?'} ×${st.rounds}`).join('  →  ')}</div>
    </div>
  )
}

function PhaseBar({ p }: { p: BreathPattern }) {
  const parts: [number, string, number][] = [[p.inhale, 'var(--breath)', 1], [p.hold1, 'var(--breath)', 0.35], [p.exhale, 'var(--breath)', 0.7], [p.hold2, 'var(--line-2)', 1]]
  return <div className="row" style={{ gap: 2, margin: '8px 0 5px' }}>{parts.filter(([d]) => d > 0).map(([d, c, o], k) => <span key={k} style={{ flex: d, height: 5, borderRadius: 3, background: c, opacity: o }} />)}</div>
}

function RoundsPicker({ p, rounds, setRounds }: { p: BreathPattern; rounds: number; setRounds: (n: number) => void }) {
  return (
    <>
      <div className="section-head" style={{ marginTop: 4 }}><h2>Rounds</h2><span className="tag">1 round = {cycleSeconds(p)}s</span></div>
      <div className="grid3">
        {[5, 10, 20, 30, 40, 50].map(n => (
          <button key={n} className="tile mini" aria-pressed={rounds === n} onClick={() => setRounds(n)}
            style={rounds === n ? { borderColor: 'var(--breath)', background: 'color-mix(in srgb, var(--breath) 12%, var(--panel))' } : undefined}>
            <span className="n" style={{ fontSize: 22, color: rounds === n ? 'var(--breath)' : undefined }}>{n}</span>
            <span className="d">{mmss(cycleSeconds(p) * n)}</span>
          </button>
        ))}
      </div>
      <div className="tile row">
        <span className="grow"><span className="t">Custom</span><div className="d">{rounds} rounds · {mmss(cycleSeconds(p) * rounds)}</div></span>
        <Stepper value={rounds} min={1} max={200} onChange={setRounds} />
      </div>
    </>
  )
}

const PHASES: [keyof BreathPattern, string, number][] = [['inhale', 'Inhale', 1], ['hold1', 'Hold (full)', 0], ['exhale', 'Exhale', 1], ['hold2', 'Hold (empty)', 0]]

/** Suggested pattern: read-only, practise it or make an editable copy. */
function PresetSheet({ p, onClose, onPlay, onCopy }: { p: BreathPattern; onClose: () => void; onPlay: (s: BreathSequence) => void; onCopy: () => void }) {
  const [rounds, setRounds] = useState(p.rounds ?? 10)
  return (
    <Sheet onClose={onClose}>
      <div className="row"><span className="ico breath"><Icon name={patIcon(p.id)} /></span><span className="grow"><h2>{p.name}</h2>{p.note && <div className="d">{p.note}</div>}</span></div>
      <div className="grid3" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))' }}>
        {PHASES.map(([k, label]) => (
          <div key={k} className="tile mini" style={{ opacity: p[k] ? 1 : 0.45 }}><span className="n" style={{ fontSize: 22 }}>{p[k] as number}s</span><span className="d">{label}</span></div>
        ))}
      </div>
      <RoundsPicker p={p} rounds={rounds} setRounds={setRounds} />
      <button className="btn breath" onClick={() => { onClose(); onPlay({ id: 'quick', name: p.name, steps: [{ kind: 'breath', patternId: p.id, rounds }] }) }}><Icon name="play" size={18} /> Start</button>
      <button className="btn ghost" onClick={onCopy}><Icon name="edit" size={18} /> Make my own copy to edit</button>
    </Sheet>
  )
}

/** User's pattern: Save sits in the header so it never moves under the keyboard. */
function PatternEditor({ initial, onClose, onPlay }: { initial: BreathPattern; onClose: () => void; onPlay: (s: BreathSequence) => void }) {
  const s = useStore()
  const [p, setP] = useState(initial)
  const rounds = p.rounds ?? 10
  const setRounds = (n: number) => setP({ ...p, rounds: n })
  const [confirmDel, setConfirmDel] = useState(false)
  const exists = s.breath.patterns.some(x => x.id === p.id)
  const inUse = mySequences(s.breath).some(q => q.steps.some(st => st.kind === 'breath' && st.patternId === p.id))
  const clean = { ...p, name: p.name.trim() || 'My pattern' }
  const save = () => setBreath(b => ({ ...b, patterns: b.patterns.some(x => x.id === clean.id) ? b.patterns.map(x => x.id === clean.id ? clean : x) : [...b.patterns, clean] }))
  return (
    <Sheet onClose={onClose}>
      <div className="row between">
        <button className="chip" onClick={onClose}>Cancel</button>
        <span className="t">{exists ? 'Edit pattern' : 'New pattern'}</span>
        <button className="chip" style={{ background: 'var(--breath)', color: 'var(--bg)', borderColor: 'var(--breath)', fontWeight: 700 }} onClick={() => { (document.activeElement as HTMLElement)?.blur(); save(); toast('Pattern saved.'); onClose() }}>Save</button>
      </div>
      <input id="pattern-name" type="text" value={p.name} onChange={e => setP({ ...p, name: e.target.value })} aria-label="Pattern name" enterKeyHint="done" />
      <div className="card list">
        {PHASES.map(([k, label, min]) => (
          <div key={k} className="item"><span className="grow">{label}</span>
            <Stepper value={p[k] as number} min={min} max={30} suffix="s" onChange={v => setP({ ...p, [k]: v })} /></div>
        ))}
        <CheckRow on={!!p.alternate} title="Alternate nostrils" sub="Shows left / right on each breath" onToggle={() => setP({ ...p, alternate: !p.alternate })} />
      </div>
      <RoundsPicker p={p} rounds={rounds} setRounds={setRounds} />
      <button className="btn breath" onClick={() => { save(); onPlay({ id: 'quick', name: clean.name, steps: [{ kind: 'breath', patternId: clean.id, rounds }] }) }}><Icon name="play" size={18} /> Save & start</button>
      {exists && (inUse
        ? <div className="d">Used in one of your sequences, so it can't be deleted.</div>
        : <button className="btn ghost" style={{ color: 'var(--bad)' }} onClick={() => { if (!confirmDel) return setConfirmDel(true); setBreath(b => ({ ...b, patterns: b.patterns.filter(x => x.id !== p.id) })); onClose() }}>
            <Icon name="trash" size={18} /> {confirmDel ? 'Tap again to delete' : 'Delete pattern'}</button>)}
    </Sheet>
  )
}

function CueSheet({ onClose }: { onClose: () => void }) {
  const b = useStore().breath
  return (
    <Sheet onClose={onClose}>
      <h2>Cues</h2>
      <div className="grid2">
        <button className={`tile ${b.prefs.sound ? 'on' : ''}`} onClick={() => setBreath(x => ({ ...x, prefs: { ...x.prefs, sound: !x.prefs.sound } }))}>
          <span className={`ico sm ${b.prefs.sound ? 'good' : 'muted'}`}><Icon name="sound" size={18} /></span>
          <span><div className="t">Bowl sound</div><div className="d">{b.prefs.sound ? 'On' : 'Off'} · higher = inhale, lower = exhale</div></span>
        </button>
        <button className={`tile ${b.prefs.haptic && canVibrate ? 'on' : ''}`} disabled={!canVibrate} onClick={() => setBreath(x => ({ ...x, prefs: { ...x.prefs, haptic: !x.prefs.haptic } }))}>
          <span className={`ico sm ${b.prefs.haptic && canVibrate ? 'good' : 'muted'}`}><Icon name="vibrate" size={18} /></span>
          <span><div className="t">Vibration</div><div className="d">{canVibrate ? (b.prefs.haptic ? 'On' : 'Off') : "Not available on iPhone web apps."}</div></span>
        </button>
      </div>
      <div className="tile row">
        <span className="ico sm muted"><Icon name="sound" size={18} /></span>
        <input id="breath-volume" className="grow" type="range" min={0.1} max={1} step={0.05} value={b.prefs.volume} aria-label="Volume"
          onChange={e => setBreath(x => ({ ...x, prefs: { ...x.prefs, volume: +e.target.value } }))} />
        <button className="chip" onClick={() => { unlockCues(); cue('inhale', { ...b.prefs, sound: true }); setTimeout(() => cue('exhale', { ...b.prefs, sound: true }), 2200) }}>Test</button>
      </div>
    </Sheet>
  )
}

function SequenceEditor({ initial, onClose }: { initial: BreathSequence; onClose: () => void }) {
  const s = useStore(), patterns = allPatterns(s.breath), mine = myPatterns(s.breath)
  const [seq, setSeq] = useState(initial)
  const [confirmDel, setConfirmDel] = useState(false)
  const exists = s.breath.sequences.some(x => x.id === seq.id)
  const steps = seq.steps
  const setSteps = (next: typeof steps) => setSeq({ ...seq, steps: next })
  const move = (k: number, d: number) => { const n = [...steps]; const [x] = n.splice(k, 1); n.splice(k + d, 0, x); setSteps(n) }
  const save = () => {
    (document.activeElement as HTMLElement)?.blur()
    const clean = { ...seq, name: seq.name.trim() || 'My sequence' }
    setBreath(b => ({ ...b, sequences: b.sequences.some(x => x.id === clean.id) ? b.sequences.map(x => x.id === clean.id ? clean : x) : [...b.sequences, clean] }))
    toast('Sequence saved.'); onClose()
  }

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row between">
        <button className="chip" onClick={onClose}>Cancel</button>
        <span className="num">{mmss(sequenceSeconds(seq, patterns))}</span>
        <button className="chip" disabled={!steps.length} style={{ background: 'var(--breath)', color: 'var(--bg)', borderColor: 'var(--breath)', fontWeight: 700 }} onClick={save}>Save</button>
      </div>
      <input id="sequence-name" type="text" value={seq.name} onChange={e => setSeq({ ...seq, name: e.target.value })} aria-label="Sequence name" enterKeyHint="done" />
      <div className="card list">
        {steps.map((st, k) => (
          <div key={k} className="item" style={{ flexWrap: 'wrap' }}>
            <span className="idx">{pad(k + 1)}</span>
            {st.kind === 'breath' ? (
              <select value={st.patternId} aria-label="Pattern" className="grow" style={{ fontWeight: 600 }} onChange={e => setSteps(steps.map((x, j) => j === k ? { ...st, patternId: e.target.value } : x))}>
                <optgroup label="Suggested">{PRESETS.patterns.map(p => <option key={p.id} value={p.id}>{p.name} ({phaseText(p)})</option>)}</optgroup>
                {mine.length > 0 && <optgroup label="Mine">{mine.map(p => <option key={p.id} value={p.id}>{p.name} ({phaseText(p)})</option>)}</optgroup>}
              </select>
            ) : <span className="grow" style={{ fontWeight: 600, color: 'var(--muted)' }}>Pause</span>}
            <span className="row" style={{ gap: 4 }}>
              <button className="chip icon" aria-label="Move up" disabled={k === 0} onClick={() => move(k, -1)}><Icon name="up" size={15} /></button>
              <button className="chip icon" aria-label="Move down" disabled={k === steps.length - 1} onClick={() => move(k, 1)}><Icon name="down" size={15} /></button>
              <button className="chip icon" aria-label="Remove step" style={{ color: 'var(--bad)' }} onClick={() => setSteps(steps.filter((_, j) => j !== k))}><Icon name="close" size={15} /></button>
            </span>
            <span className="row between" style={{ width: '100%', paddingLeft: 34 }}>
              {st.kind === 'breath'
                ? <><span className="small muted">Rounds · {mmss(stepSeconds(st, patterns))}</span><Stepper value={st.rounds} min={1} max={200} onChange={v => setSteps(steps.map((x, j) => j === k ? { ...st, rounds: v } : x))} /></>
                : <><span className="small muted">Seconds</span><Stepper value={st.seconds} min={5} max={600} step={5} suffix="s" onChange={v => setSteps(steps.map((x, j) => j === k ? { ...st, seconds: v } : x))} /></>}
            </span>
          </div>
        ))}
      </div>
      <div className="row">
        <button className="btn ghost" onClick={() => setSteps([...steps, { kind: 'breath', patternId: patterns[0].id, rounds: 10 }])}><Icon name="plus" size={18} /> Breathing</button>
        <button className="btn ghost" onClick={() => setSteps([...steps, { kind: 'pause', seconds: 30 }])}><Icon name="pause" size={18} /> Pause</button>
      </div>
      {exists && (
        <button className="btn ghost" style={{ color: 'var(--bad)' }} onClick={() => { if (!confirmDel) return setConfirmDel(true); setBreath(b => ({ ...b, sequences: b.sequences.filter(x => x.id !== seq.id) })); onClose() }}>
          <Icon name="trash" size={18} /> {confirmDel ? 'Tap again to delete' : 'Delete sequence'}</button>
      )}
    </div>
  )
}
