import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadProfile, saveProfile } from './lib/profile'
import StreakHeatmap from './components/StreakHeatmap'
import { useMaya } from './context/MayaContext'

const C = {
  bg: '#0a0a14', surface: 'rgba(255,255,255,0.04)', surfaceLight: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)', text: '#f0f0f5', muted: '#6b6b8a',
  dim: '#3a3a55', teal: '#2DD4BF', red: '#F87171',
  green: '#34D399', gold: '#FFD700', amber: '#FBBF24',
  mono: "'IBM Plex Mono', monospace", display: "'Bebas Neue', sans-serif",
}

export default function MayaGoals() {
  const navigate = useNavigate()
  const maya = useMaya()
  const [profile, setProfile] = useState(loadProfile())
  const [newGoal, setNewGoal] = useState('')
  const [editingId, setEditingId] = useState(null)

  const goals = profile.structuredGoals || migrateGoals(profile.bigGoals)

  const persist = (nextGoals) => {
    const next = { ...profile, structuredGoals: nextGoals }
    saveProfile(next)
    setProfile(next)
  }

  const addGoal = () => {
    if (!newGoal.trim()) return
    const g = {
      id: `g_${Date.now()}`,
      title: newGoal.trim(),
      milestones: [],
      createdAt: new Date().toISOString(),
      progress: 0,
    }
    persist([...goals, g])
    setNewGoal('')
  }

  const toggleMilestone = (goalId, mi) => {
    const next = goals.map(g => {
      if (g.id !== goalId) return g
      const milestones = g.milestones.map((m, i) => i === mi ? { ...m, done: !m.done } : m)
      const progress = milestones.length ? milestones.filter(m => m.done).length / milestones.length : 0
      return { ...g, milestones, progress }
    })
    persist(next)
  }

  const addMilestone = (goalId, text) => {
    if (!text.trim()) return
    const next = goals.map(g => {
      if (g.id !== goalId) return g
      return { ...g, milestones: [...g.milestones, { text: text.trim(), done: false }] }
    })
    persist(next)
  }

  const removeGoal = (goalId) => {
    if (!confirm('Delete this goal?')) return
    persist(goals.filter(g => g.id !== goalId))
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.mono, paddingBottom: 80 }}>
      <Header onBack={() => navigate('/')} title="Big Picture" />

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* Streak heatmap */}
        <div style={{
          padding: 14, background: C.surface,
          borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
              Last 365 days
            </div>
            <div style={{ fontSize: 11, color: C.teal }}>
              Current streak: {profile.currentStreak || 0}d · Best: {profile.longestStreak || 0}d
            </div>
          </div>
          <StreakHeatmap />
        </div>

        {/* Goals */}
        <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Big goals
        </div>

        {goals.length === 0 && (
          <div style={{
            padding: 24, textAlign: 'center', color: C.muted,
            border: `1px dashed ${C.border}`, borderRadius: 12, marginBottom: 12,
          }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>🎯</div>
            <div style={{ fontSize: 12 }}>No goals yet. Add one below.</div>
          </div>
        )}

        {goals.map(g => (
          <GoalCard
            key={g.id}
            goal={g}
            isOpen={editingId === g.id}
            onOpen={() => setEditingId(editingId === g.id ? null : g.id)}
            onToggle={(mi) => toggleMilestone(g.id, mi)}
            onAddMilestone={(t) => addMilestone(g.id, t)}
            onRemove={() => removeGoal(g.id)}
          />
        ))}

        {/* New goal */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <input
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGoal()}
            placeholder="New big goal..."
            style={{
              flex: 1, padding: '12px 14px', background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 10,
              color: C.text, fontSize: 13, fontFamily: C.mono, outline: 'none',
            }}
          />
          <button onClick={addGoal} style={{
            padding: '12px 18px', background: C.teal, border: 'none',
            borderRadius: 10, color: C.bg, fontSize: 13,
            fontWeight: 700, cursor: 'pointer',
          }}>Add</button>
        </div>
      </div>
    </div>
  )
}

function GoalCard({ goal, isOpen, onOpen, onToggle, onAddMilestone, onRemove }) {
  const [m, setM] = useState('')
  const pct = Math.round(goal.progress * 100)
  return (
    <div style={{
      padding: 14, background: C.surface, borderRadius: 12,
      border: `1px solid ${C.border}`, marginBottom: 8,
    }}>
      <div onClick={onOpen} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, color: C.text, fontWeight: 600, flex: 1 }}>{goal.title}</div>
          <div style={{ fontSize: 11, color: C.teal, marginLeft: 8 }}>{pct}%</div>
        </div>
        <div style={{
          marginTop: 8, height: 6, background: C.dim, borderRadius: 3, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: pct === 100 ? C.gold : `linear-gradient(90deg, ${C.teal}, #7db8e8)`,
            transition: 'width 400ms ease',
          }} />
        </div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>
          {goal.milestones.filter(m => m.done).length}/{goal.milestones.length} milestones · tap to expand
        </div>
      </div>

      {isOpen && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          {goal.milestones.map((ms, i) => (
            <div
              key={i}
              onClick={() => onToggle(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0', cursor: 'pointer',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 4,
                border: `1.5px solid ${ms.done ? C.green : C.dim}`,
                background: ms.done ? C.green : 'transparent',
                color: C.bg, fontSize: 11, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>{ms.done ? '✓' : ''}</div>
              <div style={{
                fontSize: 12, color: ms.done ? C.muted : C.text,
                textDecoration: ms.done ? 'line-through' : 'none',
              }}>{ms.text}</div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input
              value={m}
              onChange={(e) => setM(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { onAddMilestone(m); setM('') } }}
              placeholder="Add milestone..."
              style={{
                flex: 1, padding: '8px 10px', background: C.bg,
                border: `1px solid ${C.border}`, borderRadius: 8,
                color: C.text, fontSize: 11, fontFamily: C.mono, outline: 'none',
              }}
            />
            <button
              onClick={() => { onAddMilestone(m); setM('') }}
              style={{
                padding: '8px 12px', background: C.surfaceLight,
                border: `1px solid ${C.border}`, borderRadius: 8,
                color: C.teal, fontSize: 11, cursor: 'pointer', fontFamily: C.mono,
              }}
            >Add</button>
          </div>
          <button
            onClick={onRemove}
            style={{
              marginTop: 10, padding: '6px 12px', background: 'transparent',
              border: `1px solid ${C.red}44`, borderRadius: 6,
              color: C.red, fontSize: 10, fontFamily: C.mono, cursor: 'pointer',
            }}
          >Delete goal</button>
        </div>
      )}
    </div>
  )
}

function migrateGoals(legacy) {
  if (!legacy?.length) return []
  return legacy.filter(Boolean).map((title, i) => ({
    id: `g_legacy_${i}`,
    title,
    milestones: [],
    createdAt: new Date().toISOString(),
    progress: 0,
  }))
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
