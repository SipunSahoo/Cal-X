import { useState } from 'react'
import { useStore } from './store'
import { TAB_ICONS, Toaster } from './ui'
import Onboarding from './screens/Onboarding'
import Today from './screens/Today'
import Workout from './screens/Workout'
import Skills from './screens/Skills'
import Progress from './screens/Progress'
import You from './screens/You'

type Tab = 'today' | 'skills' | 'progress' | 'you'
const TABS: [Tab, string][] = [['today', 'Today'], ['skills', 'Skills'], ['progress', 'Progress'], ['you', 'You']]

export default function App() {
  const s = useStore()
  const [tab, setTab] = useState<Tab>('today')
  const [training, setTraining] = useState(false)

  if (!s.onboarded) return <><Onboarding /><Toaster /></>

  return (
    <>
      <main className="screen">
        {tab === 'today' && <Today onStart={() => setTraining(true)} />}
        {tab === 'skills' && <Skills />}
        {tab === 'progress' && <Progress />}
        {tab === 'you' && <You />}
      </main>
      <nav className="tabs">
        {TABS.map(([id, label]) => (
          <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => { setTab(id); window.scrollTo(0, 0) }}>
            <svg viewBox="0 0 24 24">{TAB_ICONS[id]}</svg>{label}
          </button>
        ))}
      </nav>
      {training && <Workout onClose={() => setTraining(false)} />}
      <Toaster />
    </>
  )
}
