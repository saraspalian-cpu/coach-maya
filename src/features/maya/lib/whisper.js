/**
 * Whisper transcription via OpenAI API.
 * Takes an audio Blob (from MediaRecorder) and returns a transcript string.
 *
 * Why: Web Speech API is broken on Safari, flaky on iOS, and silently fails.
 * Whisper is rock-solid and works in any browser since we just POST audio.
 *
 * Cost: ~$0.006/minute. A 30min lesson = $0.18. Cheap.
 */

async function transcribeWithWhisper(blob, apiKey, opts = {}) {
  if (!blob) throw new Error('No audio blob to transcribe')
  if (!apiKey) throw new Error('No OpenAI API key')

  const form = new FormData()
  // Whisper accepts webm/opus directly
  form.append('file', blob, 'lesson.webm')
  form.append('model', 'whisper-1')
  if (opts.prompt) form.append('prompt', opts.prompt)
  if (opts.language) form.append('language', opts.language)
  form.append('response_format', 'json')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: form,
  })

  if (!res.ok) {
    let detail = ''
    try {
      const j = await res.json()
      detail = j?.error?.message || ''
    } catch {
      try { detail = await res.text() } catch {}
    }
    throw new Error(`Whisper ${res.status}: ${detail.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.text || ''
}

export { transcribeWithWhisper }
