import { useEffect, useState, type ReactNode } from 'react'

export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

export function toast(msg: string) { window.dispatchEvent(new CustomEvent('calx-toast', { detail: msg })) }

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    let t: number | undefined
    const on = (e: Event) => { setMsg((e as CustomEvent<string>).detail); clearTimeout(t); t = window.setTimeout(() => setMsg(null), 3000) }
    window.addEventListener('calx-toast', on)
    return () => window.removeEventListener('calx-toast', on)
  }, [])
  return msg ? <div className="toast" role="status">{msg}</div> : null
}

export function CheckRow({ on, title, sub, onToggle, tone = 'on' }: { on: boolean; title: string; sub?: string; onToggle: () => void; tone?: 'on' | 'good' }) {
  return (
    <button className="item" onClick={onToggle} aria-pressed={on}>
      <span className={`check ${on ? tone : ''}`}>{on ? '✓' : ''}</span>
      <span className="grow"><b style={{ fontWeight: 600 }}>{title}</b>{sub && <div className="small muted">{sub}</div>}</span>
    </button>
  )
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return <div className="card stat"><div className="num">{value}</div><div className="small muted">{label}</div></div>
}

export function Choice<T extends string | number>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="row wrap">
      {options.map(([v, l]) => <button key={String(v)} className={`chip ${v === value ? 'on' : ''}`} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  )
}

export const TAB_ICONS: Record<string, ReactNode> = {
  today: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  skills: <><circle cx="12" cy="5" r="2.5" /><circle cx="6" cy="19" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M12 7.5v4l-6 5M12 11.5l6 5" /></>,
  progress: <path d="M4 20V11M10 20V5M16 20v-6M2 20h20" />,
  you: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
}
