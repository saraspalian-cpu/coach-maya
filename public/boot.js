// Boot screen handler — hides the splash once React mounts.
// Externalized from index.html so CSP doesn't need 'unsafe-inline' for scripts.
(function () {
  var root = document.getElementById('root')
  if (!root) return
  var obs = new MutationObserver(function () {
    if (root.children.length > 0) {
      var boot = document.getElementById('boot')
      if (boot) {
        boot.classList.add('gone')
        setTimeout(function () { boot.remove() }, 500)
      }
      obs.disconnect()
    }
  })
  obs.observe(root, { childList: true })
})()
