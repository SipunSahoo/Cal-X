import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'

try { const t = localStorage.getItem('calx-theme'); if (t) document.documentElement.dataset.theme = t } catch { /* optional */ }

// Updates: check for a new version whenever the app comes to the front (iOS resumes instead of relaunching),
// and reload once when the new version takes over. Skipped on first install (no previous controller).
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload() }
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') navigator.serviceWorker.getRegistration().then(r => r?.update()).catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
