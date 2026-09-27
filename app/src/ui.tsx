import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Drag-to-close. 'y': drag a sheet down (only when scrolled to the top).
 * 'x': swipe right starting at the left edge, like iOS back navigation.
 */
export function useSwipeClose<T extends HTMLElement>(onClose: () => void, axis: 'x' | 'y') {
  const ref = useRef<T>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let start: { x: number; y: number } | null = null, d = 0, locked = false
    const set = (px: number) => { el.style.transform = px ? (axis === 'x' ? `translateX(${px}px)` : `translateY(${px}px)`) : '' }
    const down = (e: TouchEvent) => {
      const t = e.touches[0]
      if (axis === 'x' ? t.clientX > 32 : el.scrollTop > 0) return
      start = { x: t.clientX, y: t.clientY }; d = 0; locked = false; el.style.transition = 'none'
    }
    const move = (e: TouchEvent) => {
      if (!start) return
      const t = e.touches[0], dx = t.clientX - start.x, dy = t.clientY - start.y
      const along = axis === 'x' ? dx : dy, across = axis === 'x' ? dy : dx
      if (!locked) { if (Math.abs(along) + Math.abs(across) < 8) return; if (along <= 0 || Math.abs(across) > Math.abs(along)) { start = null; return } locked = true }
      d = Math.max(0, along); set(d)
    }
    const up = () => {
      if (!start) return
      start = null; el.style.transition = 'transform .2s ease'
      if (d > 90) close.current(); else set(0)
    }
    el.addEventListener('touchstart', down, { passive: true })
    el.addEventListener('touchmove', move, { passive: true })
    el.addEventListener('touchend', up)
    el.addEventListener('touchcancel', up)
    return () => { el.removeEventListener('touchstart', down); el.removeEventListener('touchmove', move); el.removeEventListener('touchend', up); el.removeEventListener('touchcancel', up) }
  }, [axis])
  return ref
}

export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const ref = useSwipeClose<HTMLDivElement>(onClose, 'y')
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" ref={ref} onClick={e => e.stopPropagation()}>
        <span className="grabber" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}

/** Full page with back arrow and swipe-right-to-go-back. Stops above the tab bar. */
export function Page({ onClose, title, children }: { onClose: () => void; title: string; children: ReactNode }) {
  const ref = useSwipeClose<HTMLDivElement>(onClose, 'x')
  return (
    <div className="full" ref={ref}><div className="stack" style={{ gap: 0 }}>
      <div className="row between">
        <button className="chip" aria-label="Back" onClick={onClose} style={{ paddingLeft: 8 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg> Back</button>
        <span className="tag">{title}</span><span style={{ width: 60 }} />
      </div>
      {children}
    </div></div>
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
