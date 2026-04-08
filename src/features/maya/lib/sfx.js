/**
 * Synthesized sound effects via Web Audio.
 * No audio files — all sounds are programmatically generated.
 */

let ctx = null
function getCtx() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)() }
    catch { return null }
  }
  return ctx
}

function tone(freq, dur = 0.15, type = 'sine', vol = 0.15) {
  const ac = getCtx()
  if (!ac) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.frequency.value = freq
  osc.type = type
  const now = ac.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(vol, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur)
  osc.start(now)
  osc.stop(now + dur)
}

function sequence(notes, gap = 0.08) {
  const ac = getCtx()
  if (!ac) return
  notes.forEach(([freq, dur, type, vol], i) => {
    setTimeout(() => tone(freq, dur || 0.15, type || 'sine', vol || 0.15), i * gap * 1000)
  })
}

function vibrate(pattern) {
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern) } catch {}
  }
}

// ─── Sound presets ───
const sfx = {
  taskComplete: () => {
    sequence([[523, 0.1], [659, 0.1], [784, 0.18]], 0.07)
    vibrate([20, 30, 40])
  },
  combo: () => {
    sequence([[659, 0.08], [784, 0.08], [988, 0.18, 'triangle']], 0.06)
    vibrate(40)
  },
  achievement: () => {
    sequence([[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.25, 'triangle', 0.18]], 0.08)
    vibrate([30, 40, 60])
  },
  spotCheck: () => {
    tone(440, 0.1, 'square', 0.1)
    vibrate(15)
  },
  miss: () => {
    sequence([[330, 0.1], [220, 0.2, 'sine', 0.12]], 0.08)
    vibrate([60, 30, 60])
  },
  ding: () => {
    sequence([[880, 0.1], [1175, 0.18, 'triangle']], 0.06)
    vibrate(15)
  },
}

export default sfx
