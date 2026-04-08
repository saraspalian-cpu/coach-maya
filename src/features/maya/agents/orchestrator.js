/**
 * The Orchestrator
 * Routes events to the right agent(s) and assembles the final output.
 * Every user action triggers a specific flow.
 */

import { processTaskComplete, processTaskSkip, checkAchievements, getDayGrade } from './gamification'
import { evaluateSchedule, getDebrief, getMorningBriefing } from './scheduler'
import { generateMessage, MESSAGE_TYPES } from './mayaCore'
import { shouldSpotCheck, generateSpotCheckQuestion, createSpotCheckRecord } from './antiGaming'

// ─── Event Types ───
const EVENTS = {
  TASK_COMPLETE: 'task_complete',
  TASK_SKIP: 'task_skip',
  SCHEDULE_TICK: 'schedule_tick',
  MORNING_START: 'morning_start',
  EVENING_END: 'evening_end',
  USER_CHAT: 'user_chat',
  MOOD_CHECK: 'mood_check',
  REFLECTION: 'reflection',
  SPOT_CHECK_RESPONSE: 'spot_check_response',
}

/**
 * Process a task completion event
 * Flow: Gamification → Anti-Gaming (30%) → Schedule → Maya Core → Log
 */
async function handleTaskComplete(task, state, personalityContext) {
  const result = { events: [], messages: [], state: { ...state } }

  // 1. Gamification Engine
  result.state.gamification = processTaskComplete(state.gamification, task.type)
  result.events.push({ agent: 'gamification', action: 'task_complete', data: result.state.gamification })

  // 2. Check for new achievements
  const newAchievements = checkAchievements(result.state.gamification, state.unlockedAchievements || [])
  if (newAchievements.length > 0) {
    result.state.unlockedAchievements = [
      ...(state.unlockedAchievements || []),
      ...newAchievements.map(a => a.id),
    ]
    result.events.push({ agent: 'gamification', action: 'achievements_unlocked', data: newAchievements })
  }

  // 3. Anti-Gaming Sentinel (30% chance)
  let spotCheck = null
  if (shouldSpotCheck()) {
    const question = generateSpotCheckQuestion(task)
    spotCheck = { taskId: task.id, question, pending: true }
    result.state.pendingSpotCheck = spotCheck
    result.events.push({ agent: 'anti_gaming', action: 'spot_check', data: spotCheck })
  }

  // 4. Schedule Conductor — get debrief
  const debrief = getDebrief(task, result.state.gamification)
  result.events.push({ agent: 'scheduler', action: 'debrief', data: debrief })

  // 5. Maya Core — generate celebration message
  const mayaMsg = await generateMessage(MESSAGE_TYPES.TASK_DEBRIEF, {
    taskName: task.name,
    xpEarned: result.state.gamification.lastTaskXP,
    combo: result.state.gamification.combo,
    comboLabel: result.state.gamification.comboLabel,
    dayGrade: result.state.gamification.dayGrade.grade,
    mood: state.todayMood,
    streak: state.profile?.currentStreak,
  }, personalityContext)
  result.messages.push(mayaMsg)

  // 5b. If spot check, add the question as a follow-up message
  if (spotCheck) {
    result.messages.push({
      text: spotCheck.question,
      type: 'spot_check',
      timestamp: new Date().toISOString(),
      taskId: task.id,
    })
  }

  // 5c. If new achievements, announce them
  for (const achievement of newAchievements) {
    result.messages.push({
      text: `${achievement.icon} Achievement Unlocked: ${achievement.title} — ${achievement.desc}`,
      type: 'achievement',
      timestamp: new Date().toISOString(),
    })
  }

  // 6. Update last activity time
  result.state.lastActivityTime = new Date().toISOString()

  // 7. Log for parent intelligence
  result.state.dayLog = [
    ...(state.dayLog || []),
    {
      type: 'task_complete',
      task: task.name,
      taskType: task.type,
      xp: result.state.gamification.lastTaskXP,
      combo: result.state.gamification.combo,
      time: new Date().toISOString(),
    },
  ]

  return result
}

/**
 * Process a task skip
 * Flow: Gamification (reset combo) → Maya Core (message)
 */
async function handleTaskSkip(task, state, personalityContext) {
  const result = { events: [], messages: [], state: { ...state } }

  result.state.gamification = processTaskSkip(state.gamification)
  result.events.push({ agent: 'gamification', action: 'task_skip', data: result.state.gamification })

  // Maya doesn't nag about skips — just states facts
  const mayaMsg = await generateMessage(MESSAGE_TYPES.OVERDUE_WARNING, {
    taskName: task.name,
    minutesOverdue: 0,
    combo: 0,
    comboAtRisk: false,
  }, personalityContext)
  result.messages.push(mayaMsg)

  result.state.dayLog = [
    ...(state.dayLog || []),
    { type: 'task_skip', task: task.name, time: new Date().toISOString() },
  ]

  return result
}

/**
 * Schedule tick — check for nudges
 * Flow: Schedule Conductor → Maya Core for any triggered nudges
 */
async function handleScheduleTick(state, personalityContext) {
  const result = { events: [], messages: [], state: { ...state } }

  const nudges = evaluateSchedule({
    tasks: state.tasks || [],
    currentTime: new Date(),
    combo: state.gamification?.combo || 0,
    lastActivityTime: state.lastActivityTime,
  })

  for (const nudge of nudges) {
    let msgType
    let ctx = {}

    switch (nudge.type) {
      case 'pre_task':
        msgType = MESSAGE_TYPES.PRE_TASK_NUDGE
        ctx = { taskName: nudge.task.name, minutesUntil: nudge.minutesUntil, combo: state.gamification?.combo || 0 }
        break
      case 'overdue':
        msgType = MESSAGE_TYPES.OVERDUE_WARNING
        ctx = { taskName: nudge.task.name, minutesOverdue: nudge.minutesOverdue, combo: state.gamification?.combo || 0, comboAtRisk: nudge.comboAtRisk }
        break
      case 'combo_warn':
        msgType = MESSAGE_TYPES.COMBO_WARNING
        ctx = { combo: nudge.combo, minutesLeft: nudge.minutesLeft }
        break
      case 'idle_nudge':
        msgType = MESSAGE_TYPES.IDLE_NUDGE
        ctx = { idleMinutes: nudge.idleMinutes }
        break
      case 'day_complete':
        msgType = MESSAGE_TYPES.DAY_COMPLETE
        ctx = {
          dayGrade: state.gamification?.dayGrade?.grade || '-',
          totalXP: state.gamification?.totalXP || 0,
          combo: state.gamification?.combo || 0,
        }
        break
      default:
        continue
    }

    const msg = await generateMessage(msgType, ctx, personalityContext)
    result.messages.push(msg)
    result.events.push({ agent: 'scheduler', action: nudge.type, data: nudge })
  }

  return result
}

/**
 * Handle free chat from Vasco — with last 10 turns of history for context
 */
async function handleUserChat(message, state, personalityContext) {
  // Build Claude-compatible history from recent messages (excluding the one just sent)
  const recent = (state.messages || []).slice(-20)
  const history = recent
    .filter(m => m.text && ['user', 'free_chat'].includes(m.type) || (!m.type || m.type === 'task_debrief' || m.type === 'pre_task_nudge'))
    .map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.text,
    }))
    // Collapse consecutive same-role messages (Claude API requirement)
    .reduce((acc, m) => {
      const last = acc[acc.length - 1]
      if (last && last.role === m.role) {
        last.content += '\n' + m.content
      } else {
        acc.push({ ...m })
      }
      return acc
    }, [])
    .slice(-10)

  const mayaMsg = await generateMessage(MESSAGE_TYPES.FREE_CHAT, {
    userMessage: message,
  }, personalityContext, history)

  return {
    events: [{ agent: 'maya_core', action: 'free_chat' }],
    messages: [mayaMsg],
    state,
  }
}

/**
 * Morning briefing
 */
async function handleMorningStart(state, personalityContext) {
  const briefing = getMorningBriefing(state.tasks || [], state.streak || 0)
  const mayaMsg = await generateMessage(MESSAGE_TYPES.MORNING_BRIEFING, {
    totalTasks: briefing.totalTasks,
    taskNames: briefing.taskNames,
    streak: briefing.streak,
    firstTask: briefing.firstTask?.name || 'your first task',
  }, personalityContext)

  return {
    events: [{ agent: 'scheduler', action: 'morning_briefing', data: briefing }],
    messages: [mayaMsg],
    state,
  }
}

/**
 * Handle mood check-in
 */
async function handleMoodCheck(mood, state) {
  const result = { events: [], messages: [], state: { ...state } }
  result.state.gamification = { ...state.gamification, hasMood: true }
  result.state.gamification.dayGrade = getDayGrade(
    result.state.gamification.tasksCompleted,
    result.state.gamification.totalTasks,
    true,
    result.state.gamification.hasReflection
  )
  result.state.todayMood = mood
  result.state.dayLog = [
    ...(state.dayLog || []),
    { type: 'mood', mood, time: new Date().toISOString() },
  ]
  return result
}

/**
 * Handle reflection
 */
async function handleReflection(text, state, personalityContext) {
  const result = { events: [], messages: [], state: { ...state } }
  result.state.gamification = { ...state.gamification, hasReflection: true }
  result.state.gamification.dayGrade = getDayGrade(
    result.state.gamification.tasksCompleted,
    result.state.gamification.totalTasks,
    result.state.gamification.hasMood,
    true
  )
  result.state.dayLog = [
    ...(state.dayLog || []),
    { type: 'reflection', text, time: new Date().toISOString() },
  ]

  const mayaMsg = await generateMessage(MESSAGE_TYPES.FREE_CHAT, {
    userMessage: `Vasco's end-of-day reflection: "${text}". Respond briefly — acknowledge what he said, point out one specific thing he should be proud of today.`,
  }, personalityContext)
  result.messages.push(mayaMsg)

  return result
}

export {
  EVENTS,
  handleTaskComplete,
  handleTaskSkip,
  handleScheduleTick,
  handleUserChat,
  handleMorningStart,
  handleMoodCheck,
  handleReflection,
}
