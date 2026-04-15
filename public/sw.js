/**
 * Coach Maya — Service Worker
 * Installable PWA + offline shell + future push notifications.
 */
const CACHE = 'coach-maya-v2'
const SHELL = ['/']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  // Only handle GETs from same origin
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return

  // Network-first for HTML / API
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(e.request).then((m) => m || caches.match('/')))
    )
    return
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached
      return fetch(e.request).then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {})
        return res
      }).catch(() => cached)
    })
  )
})

// ─── Push Notifications ───
self.addEventListener('push', (event) => {
  const data = (() => { try { return event.data?.json() } catch { return {} } })() || {}
  const title = data.title || 'Coach Maya'
  const options = {
    body: data.body || 'Time to lock in.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'maya-nudge',
    data: data.url || '/',
    vibrate: [100, 50, 100],
    actions: data.actions || [
      { action: 'open', title: 'Open Maya' },
      { action: 'dismiss', title: 'Later' },
    ],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data || '/'

  if (event.action === 'dismiss') return

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})

// ─── Scheduled local notifications (triggered by main thread) ───
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_NOTIFICATION') {
    const { delay, title, body, tag, url } = event.data
    setTimeout(() => {
      self.registration.showNotification(title || 'Coach Maya', {
        body: body || 'Time to check in.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: tag || 'maya-scheduled',
        data: url || '/',
        vibrate: [100, 50, 100],
      })
    }, delay || 0)
  }
})
