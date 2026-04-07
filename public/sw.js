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

// Push notifications (when wired up later)
self.addEventListener('push', (event) => {
  const data = (() => { try { return event.data?.json() } catch { return {} } })() || {}
  const title = data.title || 'Coach Maya'
  const options = {
    body: data.body || 'Time to lock in.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'maya-nudge',
    data: data.url || '/',
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data || '/'))
})
