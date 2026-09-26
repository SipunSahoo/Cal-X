import { lazy, Suspense, useState } from 'react'
import { useStore } from './store'
import { TAB_ICONS, Toaster } from './ui'
import Today from './screens/Today'
import Skills from './screens/Skills'

// Loaded on first use to keep startup small.
const Onboarding = lazy(() => import('./screens/Onboarding'))
const Workout = lazy(() => import('./screens/Workout'))
const Breathe = lazy(() => import('./screens/Breathe'))
const Progress = lazy(() => import('./screens/Progress'))
const You = lazy(() => import('./screens/You'))

type Tab = 'today' | 'skills' | 'breathe' | 'progress' | 'you'
const TABS: [Tab, string][] = [['today', 'Today'], ['skills', 'Skills'], ['breathe', 'Breathe'], ['progress', 'Progress'], ['you', 'You']]

export default function App() {
  const s = useStore()
  const [tab, setTab] = useState<Tab>('today')
  const [training, setTraining] = useState(false)
  const go = (t: Tab) => { setTab(t); window.scrollTo(0, 0) }

  if (!s.onboarded) return <Suspense><Onboarding /><Toaster /></Suspense>

  return (
    <>
      <main className="screen">
        <Suspense>
          {tab === 'today' && <Today onStart={() => setTraining(true)} onBreathe={() => go('breathe')} />}
          {tab === 'skills' && <Skills />}
          {tab === 'breathe' && <Breathe />}
          {tab === 'progress' && <Progress />}
          {tab === 'you' && <You />}
        </Suspense>
      </main>
      <nav className="tabs">
        {TABS.map(([id, label]) => (
          <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => go(id)}>
            <svg viewBox="0 0 24 24">{TAB_ICONS[id]}</svg>{label}
          </button>
        ))}
      </nav>
      {training && <Suspense><Workout onClose={() => setTraining(false)} /></Suspense>}
      <Toaster />
    </>
  )
}
