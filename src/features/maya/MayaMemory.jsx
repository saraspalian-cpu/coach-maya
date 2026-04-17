import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getDueConcepts, getAllConcepts, reviewConcept,
  searchConcepts, getMemoryStats, deleteConcept, INTERVALS,
} from './agents/memory'
import { useMaya } from './context/MayaContext'

function ConceptMap({ onDelete, bump }) {
  const concepts = getAllConcepts()
  // Group by subject
  const bySubject = {}
  concepts.forEach(c => {
    const s = c.subject || 'Other'
    if (!bySubject[s]) bySubject[s] = []
    bySubject[s].push(c)
  })
  const subjects = Object.keys(bySubject).sort()

  const C = {
    surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,255,255,0.12)', text: '#f0f0f5', muted: '#6b6b8a',
    teal: '#2DD4BF', gold: '#FFD700', dim: '#3a3a55',
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        Learning graph · by subject
      </div>
      {subjects.map(s => (
        <div key={s} style={{
          padding: 14, background: C.surface, borderRadius: 12,
          border: `1px solid ${C.border}`, marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: C.teal, fontWeight: 600 }}>{s}</div>
            <div style={{ fontSize: 10, color: C.muted }}>
              {bySubject[s].length} concepts · {bySubject[s].filter(c => c.box === 4).length} mastered
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {bySubject[s].map(c => {
              const size = 11 + c.box * 1.5
              const color = c.box === 4 ? C.gold : c.box >= 2 ? C.teal : C.muted
              return (
                <div key={c.id} title={`${c.phrase} · box ${c.box + 1}/5`} style={{
                  padding: `5px ${8 + c.box * 2}px`,
                  borderRadius: 999,
                  background: color + '18',
                  border: `1px solid ${color}55`,
                  fontSize: size,
                  color,
                  fontWeight: c.box >= 2 ? 700 : 400,
                }}>{c.phrase}</div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', text: '#f0f0f5', muted: '#6b6b8a',
  dim: '#3a3a55', teal: '#2DD4BF', red: '#F87171',
  green: '#34D399', gold: '#FFD700', amber: '#FBBF24',
  purple: '#A78BFA',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

export default function MayaMemory() {
  const navigate = useNavigate()
  const maya = useMaya()
  const [phase, setPhase] = useState('overview') // overview | review | done
  const [view, setView] = useState('list') // list | graph
  const [due, setDue] = useState(() => getDueConcepts(15))
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [query, setQuery] = useState('')
  const [tick, setTick] = useState(0)

  const stats = useMemo(() => getMemoryStats(), [tick])
  const searchResults = useMemo(() =>
    query ? searchConcepts(query).slice(0, 30) : [], [query, tick])

  const bump = () => setTick(t => t + 1)

  const startReview = () => {
    setDue(getDueConcepts(15))
    setIdx(0)
    setAnswer('')
    setPhase('review')
    setTimeout(() => {
      maya.speakText(`Quick memory check. I pulled ${Math.min(15, due.length)} concepts from your past lessons.`)
    }, 300)
  }

  const current = due[idx]

  const submitAnswer = (correct) => {
    if (!current) return
    reviewConcept(current.id, correct)
    if (correct) {
      maya.speakText(pickLine(CORRECT_LINES))
    } else {
      maya.speakText(pickLine(MISS_LINES))
    }
    setAnswer('')
    if (idx + 1 >= due.length) {
      setPhase('done')
      setTimeout(() => navigate('/'), 2000)
    } else {
      setIdx(idx + 1)
    }
    bump()
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} title="Memory Bank" />

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {phase === 'overview' && (
          <>
            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
              <Stat label="Concepts" value={stats.total} color={C.teal} />
              <Stat label="Mastered" value={stats.mastered} color={C.gold} />
              <Stat label="Due" value={stats.dueToday} color={stats.dueToday > 0 ? C.red : C.muted} />
            </div>

            {stats.dueToday > 0 ? (
              <button onClick={startReview} style={primary}>
                🧠 Review {stats.dueToday} due concept{stats.dueToday > 1 ? 's' : ''}
              </button>
            ) : (
              <div style={{
                padding: 20, textAlign: 'center', background: C.surface,
                borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16,
              }}>
                <div style={{ fontSize: 32 }}>✨</div>
                <div style={{ fontSize: 13, color: C.text, marginTop: 6 }}>All caught up</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  Nothing due. Come back after your next lesson.
                </div>
              </div>
            )}

            {/* Subject breakdown */}
            {Object.keys(stats.subjects).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  By subject
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(stats.subjects).map(([s, n]) => (
                    <div key={s} style={{
                      padding: '6px 10px', borderRadius: 999,
                      background: C.teal + '22', border: `1px solid ${C.teal}44`,
                      fontSize: 11, color: C.teal,
                    }}>{s} · {n}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Search memory
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. photosynthesis, quadratic..."
                style={{
                  width: '100%', padding: '10px 14px', background: C.surface,
                  border: `1px solid ${C.border}`, borderRadius: 10,
                  color: C.text, fontSize: 13, fontFamily: C.mono, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {searchResults.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {searchResults.map(c => (
                    <ConceptCard key={c.id} concept={c} onDelete={() => { deleteConcept(c.id); bump() }} />
                  ))}
                </div>
              )}
            </div>

            {/* View toggle */}
            {!query && stats.total > 0 && (
              <>
                <div style={{ display: 'flex', gap: 6, marginTop: 20, marginBottom: 8 }}>
                  <button onClick={() => setView('list')} style={{
                    flex: 1, padding: '8px', borderRadius: 8,
                    background: view === 'list' ? C.teal + '22' : 'transparent',
                    border: `1px solid ${view === 'list' ? C.teal : C.border}`,
                    color: view === 'list' ? C.teal : C.muted,
                    fontSize: 11, fontFamily: C.mono, cursor: 'pointer',
                  }}>List</button>
                  <button onClick={() => setView('graph')} style={{
                    flex: 1, padding: '8px', borderRadius: 8,
                    background: view === 'graph' ? C.teal + '22' : 'transparent',
                    border: `1px solid ${view === 'graph' ? C.teal : C.border}`,
                    color: view === 'graph' ? C.teal : C.muted,
                    fontSize: 11, fontFamily: C.mono, cursor: 'pointer',
                  }}>Graph</button>
                </div>

                {view === 'list' ? (
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                      Everything Maya remembers
                    </div>
                    {getAllConcepts().slice(0, 50).map(c => (
                      <ConceptCard key={c.id} concept={c} onDelete={() => { deleteConcept(c.id); bump() }} />
                    ))}
                  </div>
                ) : (
                  <ConceptMap onDelete={deleteConcept} bump={bump} />
                )}
              </>
            )}
          </>
        )}

        {phase === 'review' && current && (
          <>
            <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {idx + 1} of {due.length} · {current.subject}
            </div>
            <div style={{
              padding: 20, background: C.surface, borderRadius: 16,
              border: `2px solid ${C.teal}44`, marginBottom: 14,
            }}>
              <div style={{ fontSize: 9, color: C.teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Concept
              </div>
              <div style={{ fontFamily: C.display, fontSize: 28, color: C.text, letterSpacing: 1 }}>
                {current.phrase}
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>
                Box {current.box + 1}/{INTERVALS.length} · learned {new Date(current.learnedAt).toLocaleDateString()}
              </div>
              {current.sourceSnippet && (
                <div style={{
                  marginTop: 12, padding: 10, background: C.bg,
                  borderRadius: 8, fontSize: 11, color: C.muted,
                  lineHeight: 1.5, fontStyle: 'italic',
                }}>
                  "...{current.sourceSnippet.slice(0, 160)}..."
                </div>
              )}
            </div>

            <div style={{ fontSize: 12, color: C.text, marginBottom: 8 }}>
              Explain it in your own words:
            </div>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type or tap the buttons below..."
              style={{
                width: '100%', padding: '12px 14px', background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 10,
                color: C.text, fontSize: 13, fontFamily: C.mono, outline: 'none',
                minHeight: 70, resize: 'vertical', boxSizing: 'border-box',
                marginBottom: 12,
              }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => submitAnswer(false)}
                style={{
                  flex: 1, padding: '14px', background: 'transparent',
                  border: `1px solid ${C.red}`, borderRadius: 12,
                  color: C.red, fontSize: 13, fontFamily: C.mono,
                  fontWeight: 700, cursor: 'pointer',
                }}
              >Forgot it</button>
              <button
                onClick={() => submitAnswer(true)}
                style={{
                  flex: 1, padding: '14px', background: C.green,
                  border: 'none', borderRadius: 12,
                  color: C.bg, fontSize: 13, fontFamily: C.mono,
                  fontWeight: 700, cursor: 'pointer',
                }}
              >Got it</button>
            </div>
          </>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 56 }}>🧠</div>
            <div style={{ fontFamily: C.display, fontSize: 32, color: C.gold, marginTop: 12, letterSpacing: 1.5 }}>
              MEMORY DRILL DONE
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
              This stuff is yours now.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ConceptCard({ concept, onDelete }) {
  const boxColor = concept.box === 4 ? C.gold : concept.box >= 2 ? C.teal : C.muted
  return (
    <div style={{
      padding: 10, background: C.surface, borderRadius: 10,
      border: `1px solid ${C.border}`, marginBottom: 6,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{concept.phrase}</div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
          {concept.subject} · {concept.successCount}✓ {concept.missCount}✗
        </div>
      </div>
      <div style={{
        fontSize: 10, color: boxColor,
        padding: '3px 8px', borderRadius: 6,
        background: boxColor + '22', border: `1px solid ${boxColor}44`,
      }}>
        Box {concept.box + 1}
      </div>
      <button onClick={onDelete} style={{
        background: 'transparent', border: 'none',
        color: C.dim, fontSize: 14, cursor: 'pointer', padding: 4,
      }}>×</button>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{
      padding: 14, background: C.surface, borderRadius: 12,
      border: `1px solid ${C.border}`, textAlign: 'center',
    }}>
      <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function Header({ onBack, title }) {
  return (
    <div style={{
      padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
      background: C.surface, display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 'none', color: C.muted,
        fontSize: 18, cursor: 'pointer', padding: 0,
      }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>{title}</div>
    </div>
  )
}

const primary = {
  width: '100%', padding: '14px 20px', background: C.teal,
  color: C.bg, border: 'none', borderRadius: 12,
  fontSize: 14, fontFamily: C.mono, fontWeight: 700, cursor: 'pointer',
  marginBottom: 12,
}

const CORRECT_LINES = [
  "Locked in. Next.",
  "Clean. Moving on.",
  "That's what I like to see.",
  "Yep. Into the vault it goes.",
]
const MISS_LINES = [
  "No worries. Resetting that one.",
  "Rough. We'll loop back soon.",
  "Happens. Back to box one.",
  "Noted. We'll nail it next round.",
]
const pickLine = (arr) => arr[Math.floor(Math.random() * arr.length)]
