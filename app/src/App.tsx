import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { cacheReminders } from './engine/push'
import { exitDemo, useStore } from './store'
import { Toaster } from './ui'
import { Icon } from './icons'
import Today from './screens/Today'
import Skills from './screens/Skills'
import Breathe from './screens/Breathe'
import Progress from './screens/Progress'
import You from './screens/You'

// Only the one-off screens load on demand; tabs load up front so switching is instant.
const Onboarding = lazy(() => import('./screens/Onboarding'))
const Workout = lazy(() => import('./screens/Workout'))

type Tab = 'today' | 'skills' | 'breathe' | 'progress' | 'you'
const TABS: [Tab, string, string][] = [['today', 'Today', 'today'], ['skills', 'Skills', 'skills'], ['breathe', 'Breathe', 'breath'], ['progress', 'Progress', 'progress'], ['you', 'You', 'you']]

export default function App() {
  const s = useStore()
  const [tab, setTab] = useState<Tab>('today')
  const [training, setTraining] = useState(false)
  const main = useRef<HTMLElement>(null)
  // keep the service worker's copy of reminder texts fresh
  useEffect(() => { if (s.pushOn) void cacheReminders(s.reminders) }, [s.pushOn, s.reminders])
  const go = (t: Tab) => { setTab(t); main.current?.scrollTo(0, 0) }

  if (!s.onboarded) return <Suspense><Onboarding /><Toaster /></Suspense>

  return (
    <div className="shell">
      <main className="screen" ref={main}>
        {s.demo && (
          <button className="tile row" style={{ marginBottom: 14, borderColor: 'var(--accent)', background: 'var(--accent-soft)', padding: '10px 12px' }} onClick={exitDemo}>
            <Icon name="info" size={18} /><span className="grow t">Demo data. Nothing here is yours.</span><span className="chip">Exit</span>
          </button>
        )}
        {tab === 'today' && <Today onStart={() => setTraining(true)} onBreathe={() => go('breathe')} />}
        {tab === 'skills' && <Skills />}
        {tab === 'breathe' && <Breathe />}
        {tab === 'progress' && <Progress />}
        {tab === 'you' && <You />}
      </main>
      <nav className="tabs">
        {TABS.map(([id, label, icon]) => (
          <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => go(id)}>
            <Icon name={icon} size={22} />{label}
          </button>
        ))}
      </nav>
      {training && <Suspense><Workout onClose={() => setTraining(false)} /></Suspense>}
      <Toaster />
    </div>
  )
}
