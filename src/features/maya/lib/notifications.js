/**
 * Web Notifications wrapper.
 * Maya nudges Vasco even when the tab is in the background.
 */

function isSupported() {
  return 'Notification' in window
}

function getPermission() {
  if (!isSupported()) return 'unsupported'
  return Notification.permission
}

async function requestPermission() {
  if (!isSupported()) return 'unsupported'
  return Notification.requestPermission()
}

/**
 * Show a notification. If service worker is registered, use that
 * (more reliable on iOS). Otherwise fall back to basic Notification.
 */
async function notify(title, body, opts = {}) {
  if (!isSupported() || Notification.permission !== 'granted') return false
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg && reg.showNotification) {
      await reg.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: opts.tag || 'maya',
        requireInteraction: opts.requireInteraction || false,
        data: opts.url || '/',
      })
      return true
    }
    new Notification(title, { body, icon: '/icon-192.png', tag: opts.tag })
    return true
  } catch (e) {
    console.warn('notify failed', e)
    return false
  }
}

export { isSupported, getPermission, requestPermission, notify }
