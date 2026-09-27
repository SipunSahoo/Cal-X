import { useEffect, useState } from 'react'
import { backupCode, backupNow, cloudAvailable, lastBackupAt, restoreFrom } from '../engine/cloud'
import { Icon } from '../icons'
import { exportBackup, importBackup, loadState, useStore } from '../store'
import { Sheet, toast } from '../ui'

const ago = (t: number) => {
  if (!t) return 'not yet'
  const m = Math.round((Date.now() - t) / 60000)
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`
}

/** Restore everything from a backup code. Used on the You tab and on the first setup screen. */
export function RestoreSheet({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true)
    try { const data = await restoreFrom(code); loadState(data); toast('Everything is restored.'); onClose() }
    catch (e) { toast((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <Sheet onClose={onClose}>
      <h2>Restore from backup code</h2>
      <div className="d">Enter the code shown under Backup on your old install. This replaces what's on this phone.</div>
      <input id="restore-code" type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
        autoCapitalize="characters" autoCorrect="off" spellCheck={false} style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '.05em' }} />
      <div className="row">
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn" disabled={busy || code.replace(/[^a-z0-9]/gi, '').length < 20} onClick={run}>{busy ? 'Restoring…' : 'Restore'}</button>
      </div>
    </Sheet>
  )
}

export default function BackupSection() {
  const s = useStore()
  const [restore, setRestore] = useState(false)
  const [, refresh] = useState(0)
  const code = backupCode(), on = cloudAvailable()
  useEffect(() => { const id = setInterval(() => refresh(n => n + 1), 15000); return () => clearInterval(id) }, [])

  const copy = async () => {
    try { await navigator.clipboard.writeText(code); toast('Code copied. Keep it in Notes or a password manager.') }
    catch { toast('Copy failed. Write the code down instead.') }
  }

  return (
    <section className="section">
      <div className="section-head"><h2>Backup</h2><span className="tag">{on ? 'automatic' : 'this phone only'}</span></div>

      {on ? (
        <div className="tile on">
          <div className="row">
            <span className="ico good"><Icon name="upload" /></span>
            <span className="grow"><div className="t">Cloud backup is on</div>
              <div className="d">{s.demo ? 'Paused while demo data is shown.' : `Saves by itself after changes and when you leave the app. Last saved ${ago(lastBackupAt())}.`}</div></span>
          </div>
          <div className="d">Your backup code (encrypted on this phone; only this code can restore it):</div>
          <div className="row" style={{ gap: 8 }}>
            <code className="grow" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.04em', padding: '10px 12px', borderRadius: 12, background: 'var(--panel-2)', border: '1px solid var(--line)', wordBreak: 'break-all' }}>{code}</code>
            <button className="chip" onClick={copy}>Copy</button>
          </div>
          <div className="d" style={{ color: 'var(--warn)' }}>Save this code somewhere safe (Notes, a screenshot). Without it the backup can't be restored, not even by the developer.</div>
          <div className="row">
            <button className="btn ghost" disabled={s.demo} onClick={() => backupNow(s).then(() => { refresh(n => n + 1); toast('Backed up.') }).catch(() => toast('Backup failed. Check your internet.'))}>Back up now</button>
            <button className="btn ghost" onClick={() => setRestore(true)}>Restore</button>
          </div>
        </div>
      ) : (
        <div className="tile row"><span className="ico muted"><Icon name="info" /></span><span className="d grow">Cloud backup needs the reminder server. Until then, export a file now and then.</span></div>
      )}

      <div className="grid2">
        <button className="tile" onClick={exportBackup}>
          <span className="ico sm"><Icon name="download" size={18} /></span><span><div className="t">Export file</div><div className="d">Extra copy in Files or iCloud Drive</div></span>
        </button>
        <label className="tile" style={{ cursor: 'pointer' }}>
          <span className="ico sm"><Icon name="upload" size={18} /></span><span><div className="t">Import file</div><div className="d">Restore from an exported file</div></span>
          <input type="file" accept="application/json,.json" hidden onChange={async e => {
            const f = e.target.files?.[0]; if (!f) return
            try { await importBackup(f); toast('Backup restored.') } catch (err) { toast((err as Error).message || 'Could not read that file.') }
          }} />
        </label>
      </div>
      {restore && <RestoreSheet onClose={() => setRestore(false)} />}
    </section>
  )
}
