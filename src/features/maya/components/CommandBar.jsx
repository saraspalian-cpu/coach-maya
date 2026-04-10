/**
 * Universal command palette — Cmd+K (or tap the search icon).
 * Searches: lessons, memory concepts, tasks, navigation actions.
 */
import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadHistory } from '../agents/lessonAnalyst'
import { searchConcepts, getAllConcepts } from '../agents/memory'
import { useMaya } from '../context/MayaContext'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF',
  mono: "'IBM Plex Mono', monospace",
}

const NAV_ACTIONS = [
  { id: 'go-home',     label: 'Go to dashboard',   sub: 'Home',          icon: '🏠', go: '/' },
  { id: 'start-lesson',label: 'Start a lesson',    sub: 'Mic + transcript', icon: '🎙', go: '/lesson' },
  { id: 'lesson-vault',label: 'Lesson vault',      sub: 'All past lessons', icon: '📚', go: '/lessons' },
  { id: 'memory',      label: 'Memory bank',       sub: 'Spaced repetition',icon: '🧠', go: '/memory' },
  { id: 'goals',       label: 'Big picture',       sub: 'Goals + streak',   icon: '🎯', go: '/goals' },
  { id: 'profile',     label: 'Profile + voice',   sub: 'Settings',         icon: '👤', go: '/profile' },
  { id: 'parent',      label: 'Parent report',     sub: 'Daily intelligence',icon: '📊', go: '/parent' },
  { id: 'schedule',    label: 'Edit schedule',     sub: 'Tasks',            icon: '⚙', go: '/schedule' },
  { id: 'homework',    label: 'Homework help',     sub: 'Maya walks you through it', icon: '📝', go: '/homework' },
  { id: 'flashcards',  label: 'Flashcards',        sub: 'Swipe through concepts', icon: '🃏', go: '/flashcards' },
  { id: 'tennis',      label: 'Tennis log',        sub: 'Sessions + matches', icon: '🎾', go: '/tennis' },
  { id: 'reading',     label: 'Reading tracker',   sub: 'Books + pages',    icon: '📖', go: '/reading' },
  { id: 'piano',       label: 'Piano practice',    sub: 'Metronome + log',  icon: '🎹', go: '/piano' },
  { id: 'screentime',  label: 'Screen time',       sub: 'Grade → earned time', icon: '📱', go: '/screentime' },
  { id: 'records',     label: 'Personal records',  sub: 'All-time bests',   icon: '🏅', go: '/records' },
  { id: 'news',        label: 'News feed',         sub: 'Tech + Tennis',    icon: '📰', go: '/news' },
  { id: 'focus',       label: 'Focus mode',        sub: 'Pomodoro timer',   icon: '⏱', go: '/focus' },
  { id: 'morning',     label: 'Morning ritual',    sub: 'Set the day',      icon: '☀️', go: '/ritual?mode=morning' },
  { id: 'evening',     label: 'Evening wrap',      sub: 'Reflect',          icon: '🌙', go: '/ritual?mode=evening' },
  { id: 'insights',    label: 'Weekly insights',   sub: 'Trends + analytics',icon: '📈', go: '/insights' },
  { id: 'story',       label: 'Your story',        sub: 'Growth narrative',  icon: '📖', go: '/story' },
  { id: 'journal',     label: 'Journal',           sub: 'Voice or text',    icon: '📓', go: '/journal' },
  { id: 'shop',        label: 'XP rewards shop',   sub: 'Spend XP',         icon: '🛒', go: '/shop' },
  { id: 'help',        label: 'Tips + iOS install',sub: 'Help',             icon: '?',  go: '/help' },
]

export default function CommandBar({ open, onClose }) {
  const navigate = useNavigate()
  const maya = useMaya()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setActive(0)
    }
  }, [open])

  const results = useMemo(() => {
    if (!query) return NAV_ACTIONS
    const q = query.toLowerCase()
    const out = []

    // Nav matches
    NAV_ACTIONS.forEach(a => {
      if (a.label.toLowerCase().includes(q) || a.sub.toLowerCase().includes(q)) out.push(a)
    })

    // Lesson matches
    loadHistory().forEach(l => {
      if (l.subject.toLowerCase().includes(q) || (l.fullTranscript || '').toLowerCase().includes(q)) {
        out.push({
          id: `lesson-${l.id}`,
          label: l.subject,
          sub: `Lesson · ${new Date(l.startedAt).toLocaleDateString()} · ${l.durationMin}m`,
          icon: '📖',
          go: '/lessons',
        })
      }
    })

    // Memory concepts
    searchConcepts(query).slice(0, 8).forEach(c => {
      out.push({
        id: `concept-${c.id}`,
        label: c.phrase,
        sub: `Concept · ${c.subject} · box ${c.box + 1}`,
        icon: '💡',
        go: '/memory',
      })
    })

    // Maya as fallback — ask her anything
    if (q.length > 3) {
      out.push({
        id: 'ask-maya',
        label: `Ask Maya: "${query}"`,
        sub: 'Open chat with this question',
        icon: '💬',
        action: () => { maya.sendMessage(query); navigate('/'); onClose() },
      })
    }

    return out.slice(0, 30)
  }, [query, maya, navigate, onClose])

  const pick = (idx) => {
    const r = results[idx]
    if (!r) return
    if (r.action) r.action()
    else if (r.go) { navigate(r.go); onClose() }
  }

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 80,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '92%', maxWidth: 520,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${C.teal}22`,
          overflow: 'hidden',
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0) }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(results.length - 1, i + 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(0, i - 1)) }
            if (e.key === 'Enter') { e.preventDefault(); pick(active) }
            if (e.key === 'Escape') onClose()
          }}
          placeholder="Search lessons, concepts, anywhere... or ask Maya"
          style={{
            width: '100%', padding: '18px 22px',
            background: 'transparent', border: 'none',
            color: C.text, fontSize: 15, fontFamily: C.mono, outline: 'none',
            borderBottom: `1px solid ${C.border}`,
            boxSizing: 'border-box',
          }}
        />
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: 6 }}>
          {results.length === 0 && (
            <div style={{ padding: 30, textAlign: 'center', color: C.muted, fontSize: 12 }}>
              Nothing matches. Try fewer characters.
            </div>
          )}
          {results.map((r, i) => (
            <div
              key={r.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(i)}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: i === active ? C.teal + '15' : 'transparent',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 2,
              }}
            >
              <div style={{ fontSize: 18 }}>{r.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, color: i === active ? C.teal : C.text,
                  fontWeight: 600, whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{r.label}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{r.sub}</div>
              </div>
              {i === active && <div style={{ fontSize: 10, color: C.dim }}>↵</div>}
            </div>
          ))}
        </div>
        <div style={{
          padding: '8px 14px',
          borderTop: `1px solid ${C.border}`,
          fontSize: 9, color: C.dim,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>↑↓ navigate · ↵ select · esc close</span>
          <span>⌘K to open</span>
        </div>
      </div>
    </div>
  )
}
