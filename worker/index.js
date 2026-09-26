// Cal-X reminder push server (Cloudflare Worker).
// POST /sync {subscription, reminders, tz}  -> store
// POST /remove {endpoint}                   -> delete
// POST /test {endpoint}                     -> push now
// Cron (every minute): send a push to each subscription with a reminder due at this local minute.
// Pushes carry no payload (no encryption needed); the app's service worker decides the text.

const KEY = 'subs'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

async function load(env) { return JSON.parse((await env.KV.get(KEY)) || '{}') }
async function save(env, subs) { await env.KV.put(KEY, JSON.stringify(subs)) }

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
    const path = new URL(req.url).pathname
    if (req.method !== 'POST') return json({ ok: true, service: 'calx-push' })
    const body = await req.json().catch(() => ({}))
    const subs = await load(env)

    if (path === '/sync') {
      const sub = body.subscription
      if (!sub?.endpoint || !Array.isArray(body.reminders)) return json({ error: 'bad request' }, 400)
      subs[sub.endpoint] = { sub, reminders: body.reminders.slice(0, 30), tz: body.tz || 'UTC', updated: Date.now() }
      await save(env, subs)
      return json({ ok: true })
    }
    if (path === '/remove') {
      delete subs[body.endpoint]
      await save(env, subs)
      return json({ ok: true })
    }
    if (path === '/test') {
      const s = subs[body.endpoint]
      if (!s) return json({ error: 'not subscribed' }, 404)
      const status = await sendPush(s.sub, env)
      return json({ ok: status < 300, status })
    }
    return json({ error: 'not found' }, 404)
  },

  async scheduled(event, env) {
    const subs = await load(env)
    const now = new Date(event.scheduledTime)
    let changed = false
    for (const [endpoint, s] of Object.entries(subs)) {
      const { hm, dow } = localTime(now, s.tz)
      const due = s.reminders.some(r => r.on && r.time === hm && r.days.includes(dow))
      if (!due) continue
      const status = await sendPush(s.sub, env)
      if (status === 404 || status === 410) { delete subs[endpoint]; changed = true } // subscription expired
    }
    if (changed) await save(env, subs)
  },
}

function localTime(date, tz) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' })
    .formatToParts(date).map(p => [p.type, p.value]))
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday)
  return { hm: `${parts.hour}:${parts.minute}`, dow }
}

// ---- Web Push with VAPID (RFC 8292), empty payload ----
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const enc = s => new TextEncoder().encode(s)

async function sendPush(sub, env) {
  const jwk = JSON.parse(env.VAPID_JWK)
  const key = await crypto.subtle.importKey('jwk', { ...jwk, key_ops: ['sign'] }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const aud = new URL(sub.endpoint).origin
  const header = b64u(enc(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const claims = b64u(enc(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'https://sipunsahoo.github.io/Cal-X/' })))
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc(`${header}.${claims}`))
  const jwt = `${header}.${claims}.${b64u(sig)}`
  const pub = b64u(new Uint8Array([4, ...base64uDecode(jwk.x), ...base64uDecode(jwk.y)]))
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: { Authorization: `vapid t=${jwt}, k=${pub}`, TTL: '600', Urgency: 'high', 'Content-Length': '0' },
  })
  return res.status
}

function base64uDecode(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))
  return Uint8Array.from(bin, c => c.charCodeAt(0))
}
