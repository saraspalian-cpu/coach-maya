import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react'
import { createInitialState } from '../agents/gamification'
import { getComboTimeLeft } from '../agents/scheduler'
import { evaluateResponse, createSpotCheckRecord } from '../agents/antiGaming'
import { recordEvent } from '../agents/personalityLearner'
import { generateDailyReport } from '../agents/parentIntelligence'
import { loadProfile, saveProfile, buildPersonalityContext } from '../lib/profile'
import { speak, cancelSpeech, listen, isSTTSupported } from '../lib/voice'
import { notify } from '../lib/notifications'
import { startWatchdog, stopWatchdog } from '../lib/scheduler'
import { WakeWordDetector } from '../lib/wakeWord'
import sfx from '../lib/sfx'
import {
  handleTaskComplete,
  handleTaskSkip,
  handleScheduleTick,
  handleUserChat,
  handleMorningStart,
  handleMoodCheck,
  handleReflection,
} from '../agents/orchestrator'

const MayaContext = createContext(null)

const STORAGE_KEY = 'maya_state'
const SCHEDULE_KEY = 'maya_schedule'
const HISTORY_KEY = 'maya_history'

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}
function saveToStorage(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

const DEFAULT_SCHEDULE = [
  { id: '1', name: 'Maths',      type: 'maths',     startTime: null, duration: 45, completed: false },
  { id: '2', name: 'Reading',    type: 'reading',   startTime: null, duration: 30, completed: false },
  { id: '3', name: 'Tennis',     type: 'tennis',    startTime: null, duration: 60, completed: false },
  { id: '4', name: 'Piano',      type: 'piano',     startTime: null, duration: 30, completed: false },
  { id: '5', name: 'Reflection', type: 'reflection', startTime: null, duration: 10, completed: false },
]

function mayaReducer(state, action) {
  switch (action.type) {
    case 'SET_STATE': return { ...state, ...action.payload }
    case 'ADD_MESSAGE': return { ...state, messages: [...state.messages, action.payload] }
    case 'ADD_MESSAGES': return { ...state, messages: [...state.messages, ...action.payload] }
    case 'COMPLETE_TASK': {
      const tasks = state.tasks.map(t =>
        t.id === action.payload.id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
      )
      return { ...state, tasks }
    }
    case 'SKIP_TASK': {
      const tasks = state.tasks.map(t =>
        t.id === action.payload.id ? { ...t, skipped: true } : t
      )
      return { ...state, tasks }
    }
    case 'SET_TASKS': return { ...state, tasks: action.payload }
    case 'SET_GAMIFICATION': return { ...state, gamification: action.payload }
    case 'SET_PENDING_SPOT_CHECK': return { ...state, pendingSpotCheck: action.payload }
    case 'CLEAR_SPOT_CHECK': return { ...state, pendingSpotCheck: null }
    case 'SET_MOOD': return { ...state, todayMood: action.payload }
    case 'ADD_SPOT_CHECK': return { ...state, spotChecks: [...(state.spotChecks || []), action.payload] }
    case 'SET_PROFILE': return { ...state, profile: action.payload, personalityContext: buildPersonalityContext(action.payload) }
    case 'SET_VOICE_STATE': return { ...state, voiceState: action.payload }
    case 'RESET_DAY': {
      const tasks = state.tasks.map(t => ({ ...t, completed: false, skipped: false, completedAt: null }))
      return {
        ...state, tasks, messages: [], dayLog: [], todayMood: null,
        pendingSpotCheck: null, spotChecks: [],
        gamification: createInitialState(tasks.length),
      }
    }
    default: return state
  }
}

function MayaProvider({ children }) {
  const savedState = loadFromStorage(STORAGE_KEY, null)
  const savedSchedule = loadFromStorage(SCHEDULE_KEY, DEFAULT_SCHEDULE)
  const initialProfile = loadProfile()

  const initialTasks = savedSchedule.map(t => ({ ...t, completed: false, skipped: false }))
  const initialState = {
    tasks: savedState?.tasks || initialTasks,
    gamification: savedState?.gamification || createInitialState(initialTasks.length),
    messages: savedState?.messages || [],
    dayLog: savedState?.dayLog || [],
    unlockedAchievements: savedState?.unlockedAchievements || [],
    lastActivityTime: savedState?.lastActivityTime || null,
    pendingSpotCheck: savedState?.pendingSpotCheck || null,
    spotChecks: savedState?.spotChecks || [],
    todayMood: savedState?.todayMood || null,
    streak: savedState?.streak || initialProfile.currentStreak || 0,
    profile: initialProfile,
    personalityContext: buildPersonalityContext(initialProfile),
    voiceState: 'idle', // idle | speaking | listening
  }

  const [state, dispatch] = useReducer(mayaReducer, initialState)
  const tickRef = useRef(null)
  const lastSpokenIdRef = useRef(null)
  const stopListenRef = useRef(null)
  const wakeRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [liveLesson, setLiveLesson] = useState(null) // { subject, startedAt }

  // Persist
  useEffect(() => {
    const { profile, personalityContext, voiceState, ...rest } = state
    saveToStorage(STORAGE_KEY, rest)
  }, [state])

  // Auto-speak Maya messages + send notification if backgrounded
  useEffect(() => {
    const last = state.messages[state.messages.length - 1]
    if (!last || last.type === 'user') return
    const id = last.timestamp + (last.text?.slice(0, 20) || '')
    if (lastSpokenIdRef.current === id) return
    lastSpokenIdRef.current = id

    if (state.profile?.voiceAutoSpeak) {
      dispatch({ type: 'SET_VOICE_STATE', payload: 'speaking' })
      speak(last.text, {
        onEnd: () => dispatch({ type: 'SET_VOICE_STATE', payload: 'idle' }),
        onError: () => dispatch({ type: 'SET_VOICE_STATE', payload: 'idle' }),
      })
    }

    // If page is hidden + notifications enabled, nudge
    if (state.profile?.notificationsEnabled && document.hidden) {
      const isUrgent = ['combo_warn', 'overdue', 'achievement'].includes(last.type)
      notify('Coach Maya', last.text, { tag: last.type, requireInteraction: isUrgent })
    }
  }, [state.messages, state.profile])

  // ─── Actions ───
  const completeTask = useCallback(async (taskId) => {
    const task = state.tasks.find(t => t.id === taskId)
    if (!task || task.completed) return
    sfx.taskComplete()
    dispatch({ type: 'COMPLETE_TASK', payload: { id: taskId } })

    const result = await handleTaskComplete(task, {
      gamification: state.gamification,
      unlockedAchievements: state.unlockedAchievements,
      lastActivityTime: state.lastActivityTime,
      dayLog: state.dayLog,
      tasks: state.tasks,
    }, state.personalityContext)

    dispatch({ type: 'SET_STATE', payload: {
      gamification: result.state.gamification,
      unlockedAchievements: result.state.unlockedAchievements,
      lastActivityTime: result.state.lastActivityTime,
      dayLog: result.state.dayLog,
      pendingSpotCheck: result.state.pendingSpotCheck || null,
    }})
    if (result.messages.length > 0) {
      dispatch({ type: 'ADD_MESSAGES', payload: result.messages })
      // Combo + achievement sounds
      if (result.messages.some(m => m.type === 'achievement')) sfx.achievement()
      else if (result.state.gamification?.combo >= 3) sfx.combo()
    }

    // Personality learner
    const updated = recordEvent({ type: 'task_complete', payload: { taskType: task.type } })
    dispatch({ type: 'SET_PROFILE', payload: updated })
  }, [state])

  const skipTask = useCallback(async (taskId) => {
    const task = state.tasks.find(t => t.id === taskId)
    if (!task) return
    dispatch({ type: 'SKIP_TASK', payload: { id: taskId } })

    const result = await handleTaskSkip(task, {
      gamification: state.gamification,
      dayLog: state.dayLog,
    }, state.personalityContext)

    dispatch({ type: 'SET_STATE', payload: { gamification: result.state.gamification, dayLog: result.state.dayLog } })
    if (result.messages.length > 0) {
      dispatch({ type: 'ADD_MESSAGES', payload: result.messages })
    }
    const updated = recordEvent({ type: 'task_skip', payload: { taskType: task.type } })
    dispatch({ type: 'SET_PROFILE', payload: updated })
  }, [state])

  const sendMessage = useCallback(async (text) => {
    dispatch({ type: 'ADD_MESSAGE', payload: { text, type: 'user', timestamp: new Date().toISOString() } })
    const result = await handleUserChat(text, state, state.personalityContext)
    if (result.messages.length > 0) {
      dispatch({ type: 'ADD_MESSAGES', payload: result.messages })
    }
    const updated = recordEvent({ type: 'chat_user', payload: { text } })
    dispatch({ type: 'SET_PROFILE', payload: updated })
  }, [state])

  const setMood = useCallback(async (mood) => {
    const result = await handleMoodCheck(mood, state)
    dispatch({ type: 'SET_STATE', payload: {
      gamification: result.state.gamification,
      todayMood: result.state.todayMood,
      dayLog: result.state.dayLog,
    }})
    dispatch({ type: 'SET_MOOD', payload: mood })
    const updated = recordEvent({ type: 'mood', payload: { mood } })
    dispatch({ type: 'SET_PROFILE', payload: updated })
  }, [state])

  const submitReflection = useCallback(async (text) => {
    const result = await handleReflection(text, state, state.personalityContext)
    dispatch({ type: 'SET_STATE', payload: {
      gamification: result.state.gamification,
      dayLog: result.state.dayLog,
    }})
    if (result.messages.length > 0) {
      dispatch({ type: 'ADD_MESSAGES', payload: result.messages })
    }
  }, [state])

  const updateSchedule = useCallback((newTasks) => {
    saveToStorage(SCHEDULE_KEY, newTasks)
    const tasks = newTasks.map(t => ({ ...t, completed: false, skipped: false }))
    dispatch({ type: 'SET_TASKS', payload: tasks })
    dispatch({ type: 'SET_STATE', payload: { gamification: createInitialState(tasks.length) } })
  }, [])

  const resetDay = useCallback(() => dispatch({ type: 'RESET_DAY' }), [])

  const updateProfile = useCallback((patch) => {
    const next = { ...state.profile, ...patch }
    saveProfile(next)
    dispatch({ type: 'SET_PROFILE', payload: next })
  }, [state.profile])

  const respondToSpotCheck = useCallback((response) => {
    if (!state.pendingSpotCheck) return
    const evaluation = evaluateResponse(response)
    const record = createSpotCheckRecord(
      { id: state.pendingSpotCheck.taskId, name: state.pendingSpotCheck.taskName, type: state.pendingSpotCheck.taskType },
      state.pendingSpotCheck.question, response, evaluation
    )
    dispatch({ type: 'ADD_SPOT_CHECK', payload: record })
    dispatch({ type: 'CLEAR_SPOT_CHECK' })
  }, [state.pendingSpotCheck])

  // ─── Voice: listen for user voice input ───
  const startListening = useCallback(() => {
    if (!isSTTSupported()) {
      alert('Voice input not supported in this browser. Try Chrome or Safari.')
      return
    }
    cancelSpeech()
    setIsListening(true)
    setInterimTranscript('')
    dispatch({ type: 'SET_VOICE_STATE', payload: 'listening' })
    stopListenRef.current = listen({
      onResult: (transcript, isFinal) => {
        setInterimTranscript(transcript)
        if (isFinal && transcript) {
          sendMessage(transcript)
          setInterimTranscript('')
        }
      },
      onEnd: () => {
        setIsListening(false)
        dispatch({ type: 'SET_VOICE_STATE', payload: 'idle' })
      },
      onError: () => {
        setIsListening(false)
        dispatch({ type: 'SET_VOICE_STATE', payload: 'idle' })
      },
    })
  }, [sendMessage])

  const stopListening = useCallback(() => {
    if (stopListenRef.current) stopListenRef.current()
    setIsListening(false)
    dispatch({ type: 'SET_VOICE_STATE', payload: 'idle' })
  }, [])

  const stopSpeaking = useCallback(() => {
    cancelSpeech()
    dispatch({ type: 'SET_VOICE_STATE', payload: 'idle' })
  }, [])

  const speakText = useCallback((text) => {
    dispatch({ type: 'SET_VOICE_STATE', payload: 'speaking' })
    speak(text, {
      onEnd: () => dispatch({ type: 'SET_VOICE_STATE', payload: 'idle' }),
      onError: () => dispatch({ type: 'SET_VOICE_STATE', payload: 'idle' }),
    })
  }, [])

  const getDailyReport = useCallback(() => {
    return generateDailyReport({
      dayLog: state.dayLog,
      gamification: state.gamification,
      tasks: state.tasks,
      mood: state.todayMood,
      reflection: state.dayLog.find(e => e.type === 'reflection')?.text,
      spotChecks: state.spotChecks,
    })
  }, [state])

  // Wake word — "hey maya"
  useEffect(() => {
    if (!state.profile?.wakeWordEnabled) {
      wakeRef.current?.stop()
      wakeRef.current = null
      return
    }
    if (wakeRef.current) return
    wakeRef.current = new WakeWordDetector({
      onWake: (rest) => {
        if (rest) {
          sendMessage(rest)
        } else {
          // Just the trigger — open active listening
          startListening()
        }
      },
      onError: (e) => console.warn('wake word error', e),
    })
    wakeRef.current.start()
    return () => { wakeRef.current?.stop() }
  }, [state.profile?.wakeWordEnabled])

  // Start notification watchdog (1-min cadence, fires desktop nudges)
  useEffect(() => {
    const getState = () => ({
      tasks: state.tasks,
      gamification: state.gamification,
      lastActivityTime: state.lastActivityTime,
      profile: state.profile,
    })
    if (state.profile?.notificationsEnabled) {
      startWatchdog(getState)
    } else {
      stopWatchdog()
    }
    return () => stopWatchdog()
  }, [state.profile?.notificationsEnabled, state.tasks, state.gamification, state.lastActivityTime, state.profile])

  // Schedule Tick (every 5 min)
  useEffect(() => {
    tickRef.current = setInterval(async () => {
      const result = await handleScheduleTick({
        tasks: state.tasks,
        gamification: state.gamification,
        lastActivityTime: state.lastActivityTime,
      }, state.personalityContext)
      if (result.messages.length > 0) {
        dispatch({ type: 'ADD_MESSAGES', payload: result.messages })
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(tickRef.current)
  }, [state.tasks, state.gamification, state.lastActivityTime, state.personalityContext])

  const comboTimeLeft = getComboTimeLeft(state.lastActivityTime)

  const value = {
    tasks: state.tasks,
    gamification: state.gamification,
    messages: state.messages,
    dayLog: state.dayLog,
    unlockedAchievements: state.unlockedAchievements,
    pendingSpotCheck: state.pendingSpotCheck,
    spotChecks: state.spotChecks,
    todayMood: state.todayMood,
    streak: state.streak,
    profile: state.profile,
    voiceState: state.voiceState,
    isListening,
    interimTranscript,
    liveLesson,
    setLiveLesson,
    comboTimeLeft,
    completeTask,
    skipTask,
    sendMessage,
    setMood,
    submitReflection,
    updateSchedule,
    resetDay,
    respondToSpotCheck,
    updateProfile,
    startListening,
    stopListening,
    stopSpeaking,
    speakText,
    getDailyReport,
  }

  return <MayaContext.Provider value={value}>{children}</MayaContext.Provider>
}

function useMaya() {
  const ctx = useContext(MayaContext)
  if (!ctx) throw new Error('useMaya must be used within MayaProvider')
  return ctx
}

export { MayaProvider, useMaya }
