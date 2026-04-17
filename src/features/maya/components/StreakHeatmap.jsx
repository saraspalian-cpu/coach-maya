/**
 * GitHub-style 365-day activity heatmap.
 * Reads day records from maya_history (or counts task completions per day).
 */
import { useMemo } from 'react'
import { loadHistory } from '../agents/lessonAnalyst'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.12)', muted: '#6b6b8a',
  teal: '#2DD4BF', dim: 'rgba(255,255,255,0.12)',
}

export default function StreakHeatmap({ size = 12 }) {
  const cells = useMemo(() => buildCells(), [])
  const weeks = chunk(cells, 7)

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 3, padding: 2 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {week.map((cell, di) => (
              <div
                key={di}
                title={`${cell.date}: ${cell.count} activity`}
                style={{
                  width: size, height: size, borderRadius: 2,
                  background: colorForCount(cell.count),
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 9, color: C.muted }}>
        <span>Less</span>
        {[0, 1, 3, 6, 10].map(c => (
          <div key={c} style={{
            width: 10, height: 10, borderRadius: 2,
            background: colorForCount(c),
          }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

function buildCells() {
  const lessons = loadHistory()
  const byDay = {}
  lessons.forEach(l => {
    const day = (l.startedAt || '').slice(0, 10)
    if (day) byDay[day] = (byDay[day] || 0) + 1
  })

  // Also count tasks from maya_state if present
  try {
    const state = JSON.parse(localStorage.getItem('maya_state') || '{}')
    const log = state.dayLog || []
    log.forEach(e => {
      if (e.type === 'task_complete') {
        const day = (e.time || '').slice(0, 10)
        if (day) byDay[day] = (byDay[day] || 0) + 1
      }
    })
  } catch {}

  // Generate last 365 days
  const today = new Date()
  // Start on Sunday at start
  const start = new Date(today)
  start.setDate(today.getDate() - 364)
  start.setDate(start.getDate() - start.getDay())

  const cells = []
  const cur = new Date(start)
  while (cur <= today) {
    const date = cur.toISOString().slice(0, 10)
    cells.push({ date, count: byDay[date] || 0 })
    cur.setDate(cur.getDate() + 1)
  }
  return cells
}

function chunk(arr, n) {
  const out = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

function colorForCount(c) {
  if (c === 0) return C.dim
  if (c <= 1) return '#1a4a44'
  if (c <= 3) return '#1d6e63'
  if (c <= 6) return '#22a58e'
  return C.teal
}
