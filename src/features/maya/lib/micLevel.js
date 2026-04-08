/**
 * Mic level meter using Web Audio API.
 * Real-time RMS volume so the user can SEE if their mic is picking up sound.
 */

class MicLevel {
  constructor() {
    this.ctx = null
    this.analyser = null
    this.stream = null
    this.rafId = null
    this.onLevel = null
  }

  async start(onLevel) {
    this.onLevel = onLevel
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
    } catch (e) {
      throw new Error('Microphone permission denied: ' + (e.message || e.name))
    }

    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    const source = this.ctx.createMediaStreamSource(this.stream)
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 512
    source.connect(this.analyser)

    const data = new Uint8Array(this.analyser.fftSize)
    const tick = () => {
      if (!this.analyser) return
      this.analyser.getByteTimeDomainData(data)
      // RMS
      let sum = 0
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.sqrt(sum / data.length)
      // 0..1 → 0..100, soft-curve so quiet sounds register
      const level = Math.min(100, Math.round(Math.pow(rms, 0.5) * 240))
      this.onLevel?.(level)
      this.rafId = requestAnimationFrame(tick)
    }
    tick()
  }

  stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this.rafId = null
    try { this.stream?.getTracks().forEach(t => t.stop()) } catch {}
    try { this.ctx?.close() } catch {}
    this.stream = null
    this.ctx = null
    this.analyser = null
    this.onLevel = null
  }
}

export { MicLevel }
