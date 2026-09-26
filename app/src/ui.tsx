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
  return <div className="stat"><div className="num">{value}</div><div className="tag">{label}</div></div>
}

export function Choice<T extends string | number>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="row wrap">
      {options.map(([v, l]) => <button key={String(v)} className={`chip ${v === value ? 'on' : ''}`} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  )
}

export function Stepper({ value, onChange, min = 0, max = 999, step = 1, suffix = '' }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string }) {
  return (
    <span className="row" style={{ gap: 4 }}>
      <button className="chip" style={{ width: 34, height: 34 }} aria-label="Less" onClick={() => onChange(Math.max(min, value - step))}>−</button>
      <b className="num" style={{ fontSize: 18, minWidth: 44, textAlign: 'center' }}>{value}{suffix}</b>
      <button className="chip" style={{ width: 34, height: 34 }} aria-label="More" onClick={() => onChange(Math.min(max, value + step))}>+</button>
    </span>
  )
}
