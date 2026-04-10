/**
 * Flashcard Study Mode — auto-generated from lesson concepts.
 * Swipe-through cards: front = concept, back = context from lesson.
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllConcepts, reviewConcept } from './agents/memory'

const C = {
  bg: '#060c18', surface: '#0c1624', surfaceLight: '#121e30',
  border: '#1a2a3e', text: '#e8edf3', muted: '#6b7f99',
  dim: '#3a4f6a', teal: '#2DD4BF', red: '#EF4444',
  green: '#22C55E', gold: '#FFD700',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

export default function MayaFlashcards() {
  const navigate = useNavigate()
  const concepts = useMemo(() => getAllConcepts(), [])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [score, setScore] = useState({ got: 0, missed: 0 })
  const [done, setDone] = useState(false)

  const total = concepts.length
  const current = concepts[idx]

  const answer = (correct) => {
    if (!current) return
    reviewConcept(current.id, correct)
    setScore(s => correct ? { ...s, got: s.got + 1 } : { ...s, missed: s.missed + 1 })
    setFlipped(false)
    if (idx + 1 >= total) {
      setDone(true)
    } else {
      setIdx(idx + 1)
    }
  }

  if (total === 0) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
        <Header onBack={() => navigate('/')} />
        <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🃏</div>
          <div style={{ fontSize: 13 }}>No flashcards yet.</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Complete a lesson first — concepts auto-become flashcards.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} />

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {!done && current && (
          <>
            {/* Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginBottom: 12 }}>
              <span>{idx + 1} of {total}</span>
              <span style={{ color: C.green }}>{score.got} ✓</span>
              <span style={{ color: C.red }}>{score.missed} ✗</span>
            </div>
            <div style={{ height: 4, background: C.dim, borderRadius: 2, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ height: '100%', width: `${((idx + 1) / total) * 100}%`, background: C.teal, transition: 'width 300ms' }} />
            </div>

            {/* Card */}
            <div
              onClick={() => setFlipped(!flipped)}
              style={{
                padding: 32,
                background: flipped ? C.surfaceLight : C.surface,
                borderRadius: 20,
                border: `2px solid ${flipped ? C.teal + '55' : C.border}`,
                minHeight: 200,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 300ms ease',
                boxShadow: flipped ? `0 8px 32px ${C.teal}22` : 'none',
              }}
            >
              {!flipped ? (
                <>
                  <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
                    {current.subject}
                  </div>
                  <div style={{
                    fontFamily: C.display, fontSize: 36,
                    color: C.teal, letterSpacing: 1, lineHeight: 1.2,
                  }}>{current.phrase}</div>
                  <div style={{ fontSize: 10, color: C.dim, marginTop: 16 }}>tap to reveal</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 9, color: C.teal, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
                    Context
                  </div>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>
                    {current.sourceSnippet
                      ? `"...${current.sourceSnippet.slice(0, 250)}..."`
                      : `Concept from your ${current.subject} lesson. Box ${current.box + 1}/5.`}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 12 }}>
                    Learned {new Date(current.learnedAt).toLocaleDateString()} · {current.successCount}✓ {current.missCount}✗
                  </div>
                </>
              )}
            </div>

            {/* Action buttons */}
            {flipped && (
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button onClick={() => answer(false)} style={{
                  flex: 1, padding: 16, background: 'transparent',
                  border: `2px solid ${C.red}`, borderRadius: 14,
                  color: C.red, fontSize: 14, fontWeight: 700,
                  fontFamily: C.mono, cursor: 'pointer',
                }}>✗ Forgot</button>
                <button onClick={() => answer(true)} style={{
                  flex: 1, padding: 16, background: C.green,
                  border: 'none', borderRadius: 14,
                  color: C.bg, fontSize: 14, fontWeight: 700,
                  fontFamily: C.mono, cursor: 'pointer',
                }}>✓ Got it</button>
              </div>
            )}
          </>
        )}

        {done && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 56 }}>🃏</div>
            <div style={{ fontFamily: C.display, fontSize: 32, color: C.gold, marginTop: 12, letterSpacing: 1.5 }}>
              DECK COMPLETE
            </div>
            <div style={{ fontSize: 13, color: C.text, marginTop: 8 }}>
              {score.got} correct · {score.missed} missed
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              {score.got >= total * 0.8 ? 'Nailed it.' : score.got >= total * 0.5 ? 'Decent. Review the misses.' : 'Rough deck. Come back tomorrow.'}
            </div>
            <button onClick={() => navigate('/')} style={{
              marginTop: 20, padding: '14px 24px', background: C.teal,
              border: 'none', borderRadius: 12, color: C.bg, fontSize: 14,
              fontWeight: 700, fontFamily: C.mono, cursor: 'pointer',
            }}>Back to dashboard</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Header({ onBack }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.teal, letterSpacing: 2 }}>FLASHCARDS</div>
    </div>
  )
}
