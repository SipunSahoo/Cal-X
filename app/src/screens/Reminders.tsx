import { useState } from 'react'
import { DAY_LETTERS, DEFAULT_REMINDERS, type Reminder } from '../data/reminders'
import { disablePush, enablePush, pushSupport, syncReminders, testPush } from '../engine/push'
import { Icon } from '../icons'
import { setState, useStore } from '../store'
import { Sheet, toast } from '../ui'

const daysText = (d: number[]) => d.length === 7 ? 'Every day' : [...d].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(x => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][x]).join(' · ')

export default function Reminders() {
  const s = useStore()
  const [edit, setEdit] = useState<Reminder | null>(null)
  const [busy, setBusy] = useState(false)
  const support = pushSupport()

  const save = (list: Reminder[]) => {
    setState(x => ({ ...x, reminders: list }))
    if (s.pushOn) syncReminders(list).catch(e => toast((e as Error).message))
  }
  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn() } catch (e) { toast((e as Error).message) } finally { setBusy(false) } }

  const status = {
    'no-server': 'The reminder server is not connected yet.',
    'install-first': 'Open Cal-X from your Home Screen to use notifications.',
    unsupported: "This browser can't show push notifications.",
    ok: s.pushOn ? 'On. Reminders arrive even when the app is closed.' : 'Off. Turn on to get reminders at the times below.',
  }[support]

  return (
    <section className="section">
      <div className="section-head"><h2>Reminders</h2><span className="tag">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span></div>
      <div className={`tile ${s.pushOn ? 'on' : ''}`}>
        <div className="row">
          <span className={`ico ${s.pushOn ? 'good' : 'muted'}`}><Icon name="bell" /></span>
          <span className="grow"><div className="t">Notifications</div><div className="d">{status}</div></span>
        </div>
        {support === 'ok' && (s.pushOn
          ? <div className="row">
              <button className="btn ghost" disabled={busy} onClick={() => run(async () => { await testPush(); toast('Test sent. It should arrive in a few seconds.') })}>Send test</button>
              <button className="btn ghost" disabled={busy} onClick={() => run(async () => { await disablePush(); setState(x => ({ ...x, pushOn: false })); toast('Reminders turned off.') })}>Turn off</button>
            </div>
          : <button className="btn" disabled={busy} onClick={() => run(async () => { await enablePush(s.reminders); setState(x => ({ ...x, pushOn: true })); toast('Reminders on.') })}>
              <Icon name="bell" size={18} /> Turn on reminders</button>)}
      </div>

      <div className="grid2">
        {s.reminders.map(r => (
          <button key={r.id} className="tile" style={{ opacity: r.on ? 1 : 0.5 }} onClick={() => setEdit(r)}>
            <span className="row between"><span className="ico sm breath"><Icon name={r.icon} size={18} /></span><span className="n" style={{ fontSize: 20 }}>{r.time}</span></span>
            <span><div className="t">{r.title}</div><div className="d">{r.on ? daysText(r.days) : 'Off'}</div></span>
          </button>
        ))}
      </div>
      {s.reminders.length < DEFAULT_REMINDERS.length && (
        <button className="chip" style={{ alignSelf: 'flex-start' }} onClick={() => save([...s.reminders, ...DEFAULT_REMINDERS.filter(d => !s.reminders.some(r => r.id === d.id))])}>Restore default reminders</button>
      )}

      {edit && <EditSheet r={edit} onClose={() => setEdit(null)} onSave={r => { save(s.reminders.map(x => x.id === r.id ? r : x)); setEdit(null) }} />}
    </section>
  )
}

function EditSheet({ r: initial, onClose, onSave }: { r: Reminder; onClose: () => void; onSave: (r: Reminder) => void }) {
  const [r, setR] = useState(initial)
  const toggleDay = (d: number) => setR({ ...r, days: r.days.includes(d) ? r.days.filter(x => x !== d) : [...r.days, d] })
  return (
    <Sheet onClose={onClose}>
      <div className="row"><span className="ico breath"><Icon name={r.icon} /></span><h2 className="grow">{r.title}</h2></div>
      <input id="reminder-time" type="time" value={r.time} onChange={e => setR({ ...r, time: e.target.value })} aria-label="Time"
        style={{ font: 'inherit', fontSize: 34, fontWeight: 700, fontStretch: '118%', color: 'var(--text)', background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 14, padding: '10px 14px', width: '100%' }} />
      <div className="stack" style={{ gap: 8 }}>
        <div className="eyebrow">Days</div>
        <div className="row" style={{ gap: 6 }}>
          {[1, 2, 3, 4, 5, 6, 0].map(d => (
            <button key={d} className={`chip ${r.days.includes(d) ? 'on' : ''}`} style={{ flex: 1, padding: 0 }} aria-pressed={r.days.includes(d)} onClick={() => toggleDay(d)}>{DAY_LETTERS[d]}</button>
          ))}
        </div>
      </div>
      <button className={`tile row ${r.on ? 'on' : ''}`} onClick={() => setR({ ...r, on: !r.on })}>
        <span className={`ico sm ${r.on ? 'good' : 'muted'}`}><Icon name="bell" size={18} /></span>
        <span className="grow t">{r.on ? 'Reminder on' : 'Reminder off'}</span>
      </button>
      <div className="d">{r.body}</div>
      <button className="btn" disabled={!r.days.length} onClick={() => onSave(r)}>Save</button>
    </Sheet>
  )
}
