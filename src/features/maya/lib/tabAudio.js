/**
 * Tab Audio Capture via getDisplayMedia.
 * Lets Maya capture the audio of another browser tab (e.g. the YouTube/Zoom
 * lesson Vasco is watching) directly — no mic needed.
 *
 * How it works:
 *  1. Call getDisplayMedia({ audio: true, video: true })
 *  2. User gets a browser picker → they choose "Chrome Tab" → pick the lesson tab
 *  3. IMPORTANT: they must check "Share tab audio" in the dialog
 *  4. We get a MediaStream with the tab's audio track
 *  5. We immediately stop the video track (we don't need it)
 *  6. Feed the audio into MediaRecorder
 *  7. At end, transcribe via Whisper
 *
 * Works on: Chrome desktop, Edge desktop
 * Partial: Firefox (tab audio limited)
 * Doesn't work: Safari (no tab audio), iOS
 */

async function captureTabAudio() {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('Tab audio capture not supported in this browser. Use Chrome desktop.')
  }

  let stream
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: true, // required to show picker, we'll kill it after
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
  } catch (e) {
    if (e.name === 'NotAllowedError') {
      throw new Error('You cancelled the picker. Pick a Chrome tab and check "Share tab audio".')
    }
    throw new Error(`Tab capture failed: ${e.message || e.name}`)
  }

  const audioTracks = stream.getAudioTracks()
  if (!audioTracks.length) {
    stream.getTracks().forEach(t => t.stop())
    throw new Error('No audio track. You must check "Share tab audio" in the browser picker, and pick a Chrome Tab (not Entire Screen on macOS).')
  }

  // Kill video tracks — we only need audio
  stream.getVideoTracks().forEach(t => t.stop())

  // Return an audio-only stream
  const audioStream = new MediaStream(audioTracks)
  return audioStream
}

class TabAudioRecorder {
  constructor() {
    this.recorder = null
    this.chunks = []
    this.stream = null
  }

  async start() {
    this.stream = await captureTabAudio()
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'
    this.recorder = new MediaRecorder(this.stream, { mimeType: mime, audioBitsPerSecond: 96000 })
    this.chunks = []
    this.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data)
    }
    // Handle user ending screen share via browser UI
    this.stream.getAudioTracks()[0].addEventListener('ended', () => {
      if (this.recorder?.state === 'recording') {
        try { this.recorder.stop() } catch {}
      }
    })
    this.recorder.start(1000)
    return true
  }

  async stop() {
    return new Promise((resolve) => {
      if (!this.recorder) { resolve(null); return }
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.recorder.mimeType })
        this.stream?.getTracks().forEach(t => t.stop())
        this.recorder = null
        this.stream = null
        this.chunks = []
        resolve(blob)
      }
      if (this.recorder.state === 'recording') {
        this.recorder.stop()
      } else {
        // Already stopped
        const blob = new Blob(this.chunks, { type: this.recorder.mimeType })
        resolve(blob)
      }
    })
  }

  isActive() {
    return this.recorder?.state === 'recording'
  }
}

export { captureTabAudio, TabAudioRecorder }
