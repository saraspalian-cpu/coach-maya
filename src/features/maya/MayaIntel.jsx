/**
 * Intelligence Dashboard — Maya shows what she knows about Vasco.
 * Predictions, patterns, focus scores, weak subjects, accountability.
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMaya } from './context/MayaContext'
import {
  getIntelSummary, getSkipPatterns, getFocusStats,
  getSubjectDepth, getActiveContract, setContract,
  markContractMet, getContractHistory, EXCUSE_OPTIONS,
} from './agents/intelligence'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', text: '#f0f0f5', muted: '#6b6b8a',
  dim: '#3a3a55', teal: '#2DD4BF', red: '#F87171',
  green: '#34D399', gold: '#FFD700', amber: '#FBBF24',
  purple: '#A78BFA',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

export default function MayaIntel() {
  const navigate = useNavigate()
  const maya = useMaya()
  const intel = useMemo(() => getIntelSummary(maya.tasks), [maya.tasks])
  const focusStats = useMemo(() => getFocusStats(), [])
  const subjectDepth = useMemo(() => getSubjectDepth(), [])
  const skipPatterns = useMemo(() => getSkipPatterns(), [])
  const [contractText, setContractText] = useState('')
  const [contract, setContractState] = useState(getActiveContract())
  const contractHist = useMemo(() => getContractHistory(), [])

  const submitContract = () => {
    if (!contractText.trim()) return
    setContract(contractText.trim())
    setContractState(getActiveContract())
    setContractText('')
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} />

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: C.display, fontSize: 28, color: C.purple, letterSpacing: 1 }}>
            MAYA KNOWS
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            Everything Maya has learned about you. No hiding.
          </div>
        </div>

        {/* Live insights */}
        {intel.insights.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {intel.insights.map((ins, i) => (
              <div key={i} style={{
                padding: 14, background: C.surface, borderRadius: 12,
                border: `1px solid ${C.border}`, marginBottom: 8,
                borderLeft: `3px solid ${ins.type === 'prediction' ? C.purple : ins.type === 'focus' ? C.teal : ins.type === 'pattern' ? C.amber : C.red}`,
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20 }}>{ins.icon}</span>
                  <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5, flex: 1 }}>{ins.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Predictions */}
        {intel.predictions.length > 0 && (
          <Card title="Skip predictions" color={C.purple}>
            {intel.predictions.map((p, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i < intel.predictions.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: C.text }}>{p.taskName}</span>
                  <span style={{ fontSize: 11, color: p.skipRate >= 70 ? C.red : C.amber, fontWeight: 700 }}>{p.skipRate}% skip</span>
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Focus scores by subject */}
        {Object.keys(focusStats.byType).length > 0 && (
          <Card title="Focus quality by task" color={C.teal}>
            {Object.entries(focusStats.byType).sort((a, b) => b[1] - a[1]).map(([type, score]) => (
              <div key={type} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: C.text, textTransform: 'capitalize' }}>{type}</span>
                  <span style={{ color: score >= 85 ? C.green : score >= 60 ? C.amber : C.red }}>{score}%</span>
                </div>
                <div style={{ height: 5, background: C.dim, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${score}%`, background: score >= 85 ? C.green : score >= 60 ? C.amber : C.red }} />
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Subject comprehension depth */}
        {Object.keys(subjectDepth).length > 0 && (
          <Card title="Comprehension depth" color={C.gold}>
            {Object.entries(subjectDepth).sort((a, b) => b[1].avg - a[1].avg).map(([subject, data]) => (
              <div key={subject} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: C.text }}>{subject}</span>
                  <span style={{ color: data.avg >= 80 ? C.green : data.avg >= 60 ? C.amber : C.red }}>
                    {data.avg}/100 {data.trend > 0 ? '↑' : data.trend < 0 ? '↓' : '→'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {data.scores.map((s, i) => (
                    <div key={i} style={{
                      flex: 1, height: 20, borderRadius: 2,
                      background: s >= 80 ? C.green + '55' : s >= 60 ? C.amber + '55' : C.red + '55',
                    }} />
                  ))}
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Excuse patterns */}
        {skipPatterns.total > 0 && (
          <Card title={`Skip reasons (${skipPatterns.total} total)`} color={C.amber}>
            {skipPatterns.topReasons.map(([reason, count], i) => {
              const excuse = EXCUSE_OPTIONS.find(e => e.id === reason)
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
                }}>
                  <span style={{ fontSize: 16 }}>{excuse?.icon || '❓'}</span>
                  <span style={{ fontSize: 12, color: C.text, flex: 1, textTransform: 'capitalize' }}>{excuse?.label || reason}</span>
                  <span style={{ fontSize: 12, color: C.amber, fontWeight: 700 }}>{count}×</span>
                </div>
              )
            })}
          </Card>
        )}

        {/* Accountability contract */}
        <Card title="Weekly contract" color={C.green}>
          {contract ? (
            <div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, marginBottom: 8 }}>
                "{contract.text}"
              </div>
              <div style={{ fontSize: 10, color: contract.met ? C.green : C.muted }}>
                {contract.met ? '✓ Contract fulfilled' : '● Active this week'}
              </div>
              {!contract.met && (
                <button
                  onClick={() => { markContractMet(); setContractState(getActiveContract()) }}
                  style={{
                    marginTop: 8, padding: '8px 14px', background: C.green,
                    border: 'none', borderRadius: 8, color: C.bg,
                    fontSize: 11, fontWeight: 700, fontFamily: C.mono, cursor: 'pointer',
                  }}
                >I kept it ✓</button>
              )}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, lineHeight: 1.5 }}>
                Set one commitment for this week. Maya holds you to it.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={contractText}
                  onChange={e => setContractText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitContract() }}
                  placeholder="e.g. No skipping maths all week"
                  style={{
                    flex: 1, padding: '10px 12px', background: C.bg,
                    border: `1px solid ${C.border}`, borderRadius: 8,
                    color: C.text, fontSize: 12, fontFamily: C.mono, outline: 'none',
                  }}
                />
                <button onClick={submitContract} style={{
                  padding: '10px 14px', background: C.green, border: 'none',
                  borderRadius: 8, color: C.bg, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>Set</button>
              </div>
            </div>
          )}
        </Card>

        {/* Contract history */}
        {contractHist.length > 1 && (
          <Card title="Contract history">
            {contractHist.slice(-10).reverse().map((c, i) => (
              <div key={i} style={{
                fontSize: 11, color: C.muted, padding: '4px 0',
                borderBottom: `1px solid ${C.border}`,
              }}>
                <span style={{ color: c.met ? C.green : C.red }}>{c.met ? '✓' : '✗'}</span>
                {' '}{c.text} <span style={{ float: 'right', fontSize: 9 }}>{c.weekId}</span>
              </div>
            ))}
          </Card>
        )}

        {/* No data yet */}
        {intel.insights.length === 0 && Object.keys(focusStats.byType).length === 0 && skipPatterns.total === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: C.muted }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🧠</div>
            <div style={{ fontSize: 13 }}>Not enough data yet.</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Complete tasks, do lessons, skip a few things — Maya learns from everything.</div>
          </div>
        )}
      </div>
    </div>
  )
}

function Card({ title, color, children }) {
  return (
    <div style={{
      padding: 14, background: C.surface, borderRadius: 12,
      border: `1px solid ${C.border}`, marginBottom: 10,
      borderLeft: color ? `3px solid ${color}` : `1px solid ${C.border}`,
    }}>
      <div style={{ fontSize: 9, color: color || C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Header({ onBack }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
      <div style={{ fontFamily: C.display, fontSize: 22, color: C.purple, letterSpacing: 2 }}>MAYA KNOWS</div>
    </div>
  )
}
