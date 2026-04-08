/**
 * "Hey Maya" wake word detector.
 * Uses Web Speech API in continuous mode. When the trigger phrase is heard,
 * calls onWake() and the rest of the phrase is treated as the initial command.
 *
 * Browser limitation: Web Speech Recognition is not truly continuous forever —
 * it stops on silence. We auto-restart to simulate continuous listening.
 */

const TRIGGERS = ['hey maya', 'hi maya', 'ok maya', 'yo maya', 'hey may', 'maya']

class WakeWordDetector {
  constructor({ onWake, onError } = {}) {
    this.onWake = onWake
    this.onError = onError
    this.recognition = null
    this.enabled = false
    this.stoppedByUser = false
    this.lastTriggerAt = 0
  }

  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  start() {
    if (!this.isSupported()) {
      this.onError?.(new Error('Wake word not supported'))
      return false
    }
    this.stoppedByUser = false
    this.enabled = true
    this._attach()
    return true
  }

  _attach() {
    if (!this.enabled) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.continuous = true
    r.interimResults = true
    r.lang = 'en-US'

    r.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const transcript = ev.results[i][0].transcript.toLowerCase().trim()
        // Debounce re-triggers
        if (Date.now() - this.lastTriggerAt < 2000) continue
        for (const trigger of TRIGGERS) {
          if (transcript.includes(trigger)) {
            this.lastTriggerAt = Date.now()
            // Strip the trigger phrase from the rest
            const rest = transcript.replace(new RegExp(`.*?${trigger}\\s*`, 'i'), '').trim()
            this.onWake?.(rest)
            return
          }
        }
      }
    }

    r.onerror = (e) => {
      // Ignore no-speech errors
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        this.onError?.(e)
      }
    }

    r.onend = () => {
      // Auto-restart if still enabled
      if (this.enabled && !this.stoppedByUser) {
        setTimeout(() => { try { this._attach() } catch {} }, 300)
      }
    }

    try { r.start() } catch {}
    this.recognition = r
  }

  stop() {
    this.stoppedByUser = true
    this.enabled = false
    try { this.recognition?.stop() } catch {}
    this.recognition = null
  }
}

export { WakeWordDetector }
