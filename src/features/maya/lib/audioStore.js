/**
 * IndexedDB store for lesson audio recordings.
 * Keeps recordings outside localStorage (which is too small for audio).
 */

const DB_NAME = 'maya_audio'
const STORE = 'recordings'
const VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function putAudio(id, blob) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({ id, blob, savedAt: Date.now() })
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

async function getAudio(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => resolve(req.result?.blob || null)
    req.onerror = () => reject(req.error)
  })
}

async function deleteAudio(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

async function listAudioIds() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAllKeys()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

// ─── Recorder wrapper ───
class LessonRecorder {
  constructor() {
    this.recorder = null
    this.chunks = []
    this.stream = null
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      console.warn('mic permission denied', e)
      return false
    }
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'
    this.recorder = new MediaRecorder(this.stream, { mimeType: mime, audioBitsPerSecond: 64000 })
    this.chunks = []
    this.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data)
    }
    this.recorder.start(1000) // 1s chunks
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
      this.recorder.stop()
    })
  }

  isRecording() {
    return this.recorder?.state === 'recording'
  }
}

export {
  putAudio,
  getAudio,
  deleteAudio,
  listAudioIds,
  LessonRecorder,
}
