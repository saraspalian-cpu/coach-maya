import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMaya } from './context/MayaContext'
import { LEVELS, ACHIEVEMENTS } from './agents/gamification'
import MayaAvatar from './components/Maya3D'

// ─── Color Palette (Dark theme matching Cluny) ───
const C = {
  bg: '#060c18',
  surface: '#0c1624',
  surfaceLight: '#121e30',
  border: '#1a2a3e',
  text: '#e8edf3',
  muted: '#6b7f99',
  dim: '#3a4f6a',
  gold: '#FFD700',
  amber: '#FFA500',
  green: '#22C55E',
  red: '#EF4444',
  blue: '#7db8e8',
  teal: '#2DD4BF',
  purple: '#A78BFA',
  mono: "'IBM Plex Mono', monospace",
  display: "'Bebas Neue', sans-serif",
}

// ─── Grade Colors ───
const gradeColors = { S: C.gold, A: C.green, B: C.blue, C: C.amber, F: C.red, '-': C.dim }

export default function MayaDashboard() {
  const maya = useMaya()
  const [chatInput, setChatInput] = useState('')
  const [spotCheckInput, setSpotCheckInput] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [activeTab, setActiveTab] = useState('tasks') // tasks | stats | chat
  const messagesEndRef = useRef(null)

  const navigate = useNavigate()
  const { gamification: gam, tasks, messages, comboTimeLeft, pendingSpotCheck, todayMood } = maya

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const completedCount = tasks.filter(t => t.completed).length
  const totalCount = tasks.length
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Avatar state logic
  const avatarState = useMemo(() => {
    const lastMsg = messages[messages.length - 1]
    const isSpeaking = lastMsg && (Date.now() - new Date(lastMsg.timestamp).getTime()) < 5000 && lastMsg.type !== 'user'
    if (isSpeaking && lastMsg.type === 'achievement') return 'celebrating'
    if (isSpeaking) return 'speaking'
    if (comboTimeLeft !== null && comboTimeLeft > 0 && comboTimeLeft <= 10) return 'urgent'
    if (completedCount === totalCount && totalCount > 0) return 'celebrating'
    const hour = new Date().getHours()
    if (hour < 6 || hour > 22) return 'sleeping'
    return 'idle'
  }, [messages, comboTimeLeft, completedCount, totalCount])

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      color: C.text,
      fontFamily: C.mono,
      paddingBottom: 80,
    }}>
      {/* ─── Maya Avatar Hero ─── */}
      <div style={{
        background: `radial-gradient(ellipse at center, ${C.surfaceLight} 0%, ${C.bg} 70%)`,
        padding: '8px 0 4px',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <MayaAvatar state={avatarState} size={320} />
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <div style={{
            fontFamily: C.display,
            fontSize: 22,
            letterSpacing: 3,
            color: C.teal,
          }}>
            COACH MAYA
          </div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
            {avatarState === 'sleeping' ? 'Resting...' : avatarState === 'celebrating' ? 'LET\'S GO!' : avatarState === 'urgent' ? 'Combo at risk!' : avatarState === 'speaking' ? 'Speaking...' : `Level ${gam.level?.level} ${gam.level?.title}`}
          </div>
        </div>
      </div>

      {/* ─── Stats Header ─── */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
              Vasco's HQ
            </div>
            <div style={{
              fontFamily: C.display,
              fontSize: 28,
              letterSpacing: 2,
              color: C.teal,
              lineHeight: 1,
              marginTop: 2,
            }}>
              VASCO'S HQ
            </div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontSize: 22 }}>{gam.level?.icon}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{gam.level?.title}</div>
            </div>
            <button
              onClick={() => navigate('/schedule')}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: `1px solid ${C.border}`, background: 'transparent',
                color: C.muted, fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ⚙
            </button>
          </div>
        </div>

        {/* XP Bar */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginBottom: 4 }}>
            <span>LVL {gam.level?.level} — {gam.totalXP} XP</span>
            <span>{gam.level?.xpToNext > 0 ? `${gam.level.xpToNext} to next` : 'MAX'}</span>
          </div>
          <div style={{
            height: 6,
            background: C.dim,
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(gam.level?.progress || 0) * 100}%`,
              background: `linear-gradient(90deg, ${C.teal}, ${C.blue})`,
              borderRadius: 3,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 14,
          gap: 8,
        }}>
          <StatBox label="Grade" value={gam.dayGrade?.grade || '-'} color={gradeColors[gam.dayGrade?.grade] || C.dim} />
          <StatBox label="Combo" value={`${gam.combo}×`} sub={gam.comboLabel} color={gam.combo >= 5 ? C.gold : gam.combo >= 3 ? C.amber : C.muted} />
          <StatBox label="Done" value={`${completedCount}/${totalCount}`} color={completedCount === totalCount && totalCount > 0 ? C.green : C.blue} />
          {comboTimeLeft !== null && comboTimeLeft > 0 && (
            <StatBox label="Combo Timer" value={`${comboTimeLeft}m`} color={comboTimeLeft <= 10 ? C.red : C.amber} />
          )}
        </div>
      </div>

      {/* ─── Tab Bar ─── */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
      }}>
        {['tasks', 'stats', 'chat'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${C.teal}` : '2px solid transparent',
              color: activeTab === tab ? C.teal : C.muted,
              fontSize: 11,
              fontFamily: C.mono,
              textTransform: 'uppercase',
              letterSpacing: 1,
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ─── Content ─── */}
      <div style={{ padding: '12px 16px' }}>
        {activeTab === 'tasks' && (
          <TasksTab maya={maya} C={C} />
        )}
        {activeTab === 'stats' && (
          <StatsTab maya={maya} C={C} gradeColors={gradeColors} />
        )}
        {activeTab === 'chat' && (
          <ChatTab
            maya={maya}
            C={C}
            chatInput={chatInput}
            setChatInput={setChatInput}
            messagesEndRef={messagesEndRef}
          />
        )}
      </div>

      {/* ─── Spot Check Overlay ─── */}
      {pendingSpotCheck && (
        <div style={{
          position: 'fixed',
          bottom: 70,
          left: 0,
          right: 0,
          maxWidth: 430,
          margin: '0 auto',
          padding: 16,
          background: C.surfaceLight,
          borderTop: `2px solid ${C.amber}`,
          zIndex: 100,
        }}>
          <div style={{ fontSize: 10, color: C.amber, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Quick Check
          </div>
          <div style={{ fontSize: 13, marginBottom: 10 }}>{pendingSpotCheck.question}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={spotCheckInput}
              onChange={e => setSpotCheckInput(e.target.value)}
              placeholder="Your answer..."
              style={{
                flex: 1,
                padding: '8px 12px',
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.text,
                fontSize: 13,
                fontFamily: C.mono,
                outline: 'none',
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && spotCheckInput.trim()) {
                  maya.respondToSpotCheck(spotCheckInput)
                  setSpotCheckInput('')
                }
              }}
            />
            <button
              onClick={() => {
                if (spotCheckInput.trim()) {
                  maya.respondToSpotCheck(spotCheckInput)
                  setSpotCheckInput('')
                }
              }}
              style={{
                padding: '8px 16px',
                background: C.amber,
                color: C.bg,
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: C.mono,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* ─── Mood Check (if not set) ─── */}
      {!todayMood && completedCount >= 1 && activeTab === 'tasks' && (
        <MoodPicker maya={maya} C={C} />
      )}
    </div>
  )
}

// ─── Tasks Tab ───
function TasksTab({ maya, C }) {
  const { tasks, completeTask, skipTask, gamification } = maya

  return (
    <div>
      <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        Today's Tasks
      </div>
      {tasks.map((task, i) => (
        <div
          key={task.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 12px',
            background: task.completed ? C.surfaceLight : C.surface,
            borderRadius: 10,
            marginBottom: 8,
            border: `1px solid ${task.completed ? C.green + '33' : C.border}`,
            opacity: task.skipped ? 0.4 : 1,
          }}
        >
          {/* Completion Button */}
          <button
            onClick={() => !task.completed && !task.skipped && completeTask(task.id)}
            disabled={task.completed || task.skipped}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: `2px solid ${task.completed ? C.green : C.dim}`,
              background: task.completed ? C.green : 'transparent',
              color: task.completed ? C.bg : C.dim,
              fontSize: 14,
              cursor: task.completed || task.skipped ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            {task.completed ? '✓' : i + 1}
          </button>

          {/* Task Info */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: task.completed ? C.green : C.text,
              textDecoration: task.skipped ? 'line-through' : 'none',
            }}>
              {task.name}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              {task.duration}min · {task.type}
              {task.completedAt && ` · done ${new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </div>
          </div>

          {/* Skip Button */}
          {!task.completed && !task.skipped && (
            <button
              onClick={() => skipTask(task.id)}
              style={{
                padding: '4px 10px',
                background: 'transparent',
                border: `1px solid ${C.dim}`,
                borderRadius: 6,
                color: C.muted,
                fontSize: 10,
                fontFamily: C.mono,
                cursor: 'pointer',
              }}
            >
              Skip
            </button>
          )}
        </div>
      ))}

      {/* Last Maya Message */}
      {maya.messages.length > 0 && (
        <MayaMessageBubble message={maya.messages[maya.messages.length - 1]} C={C} />
      )}
    </div>
  )
}

// ─── Stats Tab ───
function StatsTab({ maya, C, gradeColors }) {
  const { gamification: gam, unlockedAchievements, spotChecks, dayLog } = maya

  return (
    <div>
      {/* Level Progress */}
      <div style={{
        padding: 16,
        background: C.surface,
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Level Progress
        </div>
        {LEVELS.map(lvl => {
          const isActive = gam.level?.level === lvl.level
          const isUnlocked = gam.totalXP >= lvl.xpRequired
          return (
            <div key={lvl.level} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 0',
              opacity: isUnlocked ? 1 : 0.35,
            }}>
              <span style={{ fontSize: 18 }}>{lvl.icon}</span>
              <span style={{ fontSize: 12, flex: 1, color: isActive ? C.teal : C.text }}>
                {lvl.title}
                {isActive && ' ←'}
              </span>
              <span style={{ fontSize: 10, color: C.muted }}>{lvl.xpRequired} XP</span>
            </div>
          )
        })}
      </div>

      {/* Achievements */}
      <div style={{
        padding: 16,
        background: C.surface,
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Achievements
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ACHIEVEMENTS.map(a => {
            const unlocked = unlockedAchievements?.includes(a.id)
            return (
              <div key={a.id} style={{
                padding: '8px 10px',
                background: unlocked ? C.surfaceLight : 'transparent',
                border: `1px solid ${unlocked ? C.gold + '44' : C.dim}`,
                borderRadius: 8,
                opacity: unlocked ? 1 : 0.3,
                textAlign: 'center',
                minWidth: 80,
              }}>
                <div style={{ fontSize: 20 }}>{a.icon}</div>
                <div style={{ fontSize: 9, color: unlocked ? C.gold : C.muted, marginTop: 2 }}>{a.title}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Today's Log */}
      {dayLog && dayLog.length > 0 && (
        <div style={{
          padding: 16,
          background: C.surface,
          borderRadius: 10,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Today's Activity
          </div>
          {dayLog.map((entry, i) => (
            <div key={i} style={{
              fontSize: 11,
              color: C.muted,
              padding: '4px 0',
              borderBottom: i < dayLog.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              <span style={{ color: entry.type === 'task_complete' ? C.green : entry.type === 'task_skip' ? C.red : C.blue }}>
                {entry.type === 'task_complete' ? '✓' : entry.type === 'task_skip' ? '✗' : '●'}
              </span>
              {' '}{entry.task || entry.type}{' '}
              {entry.xp ? `+${entry.xp} XP` : ''}
              <span style={{ float: 'right', fontSize: 10 }}>
                {new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Chat Tab ───
function ChatTab({ maya, C, chatInput, setChatInput, messagesEndRef }) {
  const handleSend = () => {
    if (!chatInput.trim()) return
    maya.sendMessage(chatInput.trim())
    setChatInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 240px)' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
        {maya.messages.length === 0 && (
          <div style={{ textAlign: 'center', color: C.dim, fontSize: 12, marginTop: 40 }}>
            Talk to Maya. She's listening.
          </div>
        )}
        {maya.messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: 10,
            display: 'flex',
            justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: msg.type === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: msg.type === 'user' ? C.blue + '22' : msg.type === 'achievement' ? C.gold + '22' : C.surfaceLight,
              border: `1px solid ${msg.type === 'user' ? C.blue + '33' : msg.type === 'achievement' ? C.gold + '33' : C.border}`,
              color: msg.type === 'achievement' ? C.gold : C.text,
              fontSize: 13,
              lineHeight: 1.5,
            }}>
              {msg.type !== 'user' && msg.type !== 'achievement' && (
                <div style={{ fontSize: 9, color: C.teal, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Maya
                </div>
              )}
              {msg.text}
              <div style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '12px 0',
        borderTop: `1px solid ${C.border}`,
      }}>
        <input
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Talk to Maya..."
          style={{
            flex: 1,
            padding: '10px 14px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            color: C.text,
            fontSize: 13,
            fontFamily: C.mono,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: '10px 18px',
            background: C.teal,
            color: C.bg,
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontFamily: C.mono,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

// ─── Maya Message Bubble ───
function MayaMessageBubble({ message, C }) {
  if (!message || message.type === 'user') return null
  return (
    <div style={{
      marginTop: 16,
      padding: '14px 16px',
      background: C.surfaceLight,
      borderRadius: 12,
      borderLeft: `3px solid ${C.teal}`,
    }}>
      <div style={{ fontSize: 9, color: C.teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        Maya says
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>{message.text}</div>
    </div>
  )
}

// ─── Stat Box ───
function StatBox({ label, value, sub, color }) {
  return (
    <div style={{
      flex: 1,
      textAlign: 'center',
      padding: '8px 4px',
      background: '#0c1624',
      borderRadius: 8,
      border: '1px solid #1a2a3e',
    }}>
      <div style={{ fontSize: 9, color: '#6b7f99', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || '#e8edf3', lineHeight: 1.2, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: '#6b7f99', marginTop: 1 }}>{sub}</div>}
    </div>
  )
}

// ─── Mood Picker ───
function MoodPicker({ maya, C }) {
  const moods = [
    { emoji: '🔥', label: 'Fired up' },
    { emoji: '😊', label: 'Good' },
    { emoji: '😐', label: 'Meh' },
    { emoji: '😤', label: 'Frustrated' },
    { emoji: '😴', label: 'Tired' },
  ]

  return (
    <div style={{
      position: 'fixed',
      bottom: 70,
      left: 0,
      right: 0,
      maxWidth: 430,
      margin: '0 auto',
      padding: '12px 16px',
      background: C.surfaceLight,
      borderTop: `1px solid ${C.border}`,
      zIndex: 90,
    }}>
      <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        How are you feeling?
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {moods.map(m => (
          <button
            key={m.label}
            onClick={() => maya.setMood(m.label)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
              padding: '4px 8px',
            }}
          >
            <div style={{ fontSize: 24 }}>{m.emoji}</div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{m.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
