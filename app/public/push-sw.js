// Loaded into the app's service worker. Shows the reminder that is due now.
// Pushes arrive without a payload; the text comes from the reminder list the app caches.
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let list = []
    try {
      const res = await caches.match(new URL('reminders.json', self.registration.scope).href)
      if (res) list = await res.json()
    } catch { /* fall back to a generic reminder */ }
    const now = new Date(), mins = now.getHours() * 60 + now.getMinutes()
    const due = list.filter(r => r.on && r.days.includes(now.getDay()) && Math.abs(toMin(r.time) - mins) <= 5)
    const title = due.length ? due.map(r => r.title).join(' + ') : 'Cal-X'
    const body = due.length ? due.map(r => r.body).join(' ') : 'Time for your practice.'
    await self.registration.showNotification(title, {
      body, icon: 'icon-192.png', badge: 'icon-192.png', tag: due[0]?.id ?? 'calx', renotify: true,
    })
  })())
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs =>
    cs.length ? cs[0].focus() : self.clients.openWindow(self.registration.scope)))
})
