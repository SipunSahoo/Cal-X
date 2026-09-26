import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'

try { const t = localStorage.getItem('calx-theme'); if (t) document.documentElement.dataset.theme = t } catch { /* optional */ }

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
