/**
 * Adaptive Scheduler Agent
 * Reviews the last 14 days of dayLog and proposes concrete schedule tweaks.
 *
 * Pattern detection:
 *   - High-skip task types (≥3 skips, <40% completion) → suggest moving earlier or shortening
 *   - High-finish task types (≥80% completion, 5+ runs) → consider boosting duration
 *   - Time-of-day skip clusters (mostly afternoon skips) → flag energy dip
 *
 * Returns an array of proposals, each:
 *   { id, kind: 'reduce'|'reorder'|'protect'|'energy', title, body, applyHint? }
 *
 * The UI surfaces these as a list — applying is left to the user since the
 * schedule editor is the single source of truth.
 */

const MS_DAY = 86400000

function loadLS(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}

function todayStr() { return new Date().toISOString().slice(0, 10) }
function daysAgo(n) { return new Date(Date.now() - n * MS_DAY).toISOString().slice(0, 10) }

function hourOf(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return isNaN(d) ? null : d.getHours()
}

/**
 * @returns {Array<{id, kind, title, body, applyHint?}>}
 */
function getScheduleProposals() {
  const state = loadLS('maya_state') || {}
  const dayLog = Array.isArray(state.dayLog) ? state.dayLog : []
  const cutoff = daysAgo(14)

  const recent = dayLog.filter(e => (e.time || '').slice(0, 10) >= cutoff)
  if (recent.length < 6) return []  // not enough signal

  // Aggregate per task type
  const stats = {} // type → { complete, skip, hours: [] }
  for (const e of recent) {
    const type = e.taskType || e.task
    if (!type) continue
    if (!stats[type]) stats[type] = { complete: 0, skip: 0, hours: [] }
    if (e.type === 'task_complete') {
      stats[type].complete++
      const h = hourOf(e.time)
      if (h != null) stats[type].hours.push(h)
    } else if (e.type === 'task_skip') {
      stats[type].skip++
    }
  }

  const proposals = []

  // ── Reduce / reorder skipped types ──
  for (const [type, s] of Object.entries(stats)) {
    const total = s.complete + s.skip
    if (s.skip >= 3 && total >= 4) {
      const finishPct = Math.round((s.complete / total) * 100)
      if (finishPct < 40) {
        proposals.push({
          id: `skip:${type}`,
          kind: 'reduce',
          title: `${capitalize(type)} is being skipped`,
          body: `${s.skip} skips in 14 days (${finishPct}% finish). Try shortening the slot or moving it to morning energy.`,
          applyHint: { route: '/schedule', type },
        })
      } else if (finishPct < 60) {
        proposals.push({
          id: `reorder:${type}`,
          kind: 'reorder',
          title: `${capitalize(type)} struggles in current slot`,
          body: `Only ${finishPct}% finish rate. Front-load it before the easy stuff.`,
          applyHint: { route: '/schedule', type },
        })
      }
    }
  }

  // ── Protect high-performers ──
  for (const [type, s] of Object.entries(stats)) {
    const total = s.complete + s.skip
    if (s.complete >= 5 && total >= 5) {
      const finishPct = Math.round((s.complete / total) * 100)
      if (finishPct >= 90) {
        proposals.push({
          id: `protect:${type}`,
          kind: 'protect',
          title: `${capitalize(type)} is rock solid`,
          body: `${s.complete}/${total} complete. Don't change this slot — it's working.`,
        })
      }
    }
  }

  // ── Energy dip detection ──
  const skipHours = []
  for (const e of recent) {
    if (e.type === 'task_skip') {
      const h = hourOf(e.time)
      if (h != null) skipHours.push(h)
    }
  }
  if (skipHours.length >= 4) {
    const afternoon = skipHours.filter(h => h >= 14 && h < 18).length
    const ratio = afternoon / skipHours.length
    if (ratio >= 0.5) {
      proposals.push({
        id: 'energy:afternoon',
        kind: 'energy',
        title: 'Afternoon energy dip',
        body: `${afternoon}/${skipHours.length} skips happen 2–6pm. Save lighter tasks for that window.`,
      })
    }
  }

  // Cap proposals at 4 — too many = noise
  return proposals.slice(0, 4)
}

function capitalize(s) {
  if (!s) return ''
  return String(s).charAt(0).toUpperCase() + String(s).slice(1)
}

export { getScheduleProposals }
