/**
 * Agent 3: Schedule Conductor
 * Decides WHEN Maya should speak and what type of message to trigger.
 * Does not generate the message itself — that's Maya Core.
 */

// ─── Nudge Types ───
const NUDGE_TYPES = {
  PRE_TASK: 'pre_task',       // 15 min before block
  OVERDUE: 'overdue',          // Block overdue + combo alive
  DEBRIEF: 'debrief',          // Immediately after completion
  COMBO_WARNING: 'combo_warn', // Combo about to expire
  IDLE_NUDGE: 'idle_nudge',    // Free time > 2 hours
  DAY_COMPLETE: 'day_complete', // All tasks done
  MORNING: 'morning',          // Start of day
  EVENING: 'evening',          // End of day
}

const URGENCY = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high' }

const TONE = {
  PLAYFUL: 'playful',
  URGENT: 'urgent',
  CELEBRATORY: 'celebratory',
  CASUAL: 'casual',
}

// ─── Evaluate Schedule State ───
// Returns the appropriate nudge(s) based on current time and task state
function evaluateSchedule({ tasks, currentTime, combo, lastActivityTime }) {
  const now = currentTime || new Date()
  const nudges = []

  // Find next upcoming task
  const upcoming = tasks
    .filter(t => !t.completed && t.startTime)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

  const nextTask = upcoming[0]

  if (nextTask) {
    const startTime = new Date(nextTask.startTime)
    const minutesUntil = isNaN(startTime.getTime()) ? null : (startTime - now) / 60000

    // 15 min before block
    if (minutesUntil != null && minutesUntil > 0 && minutesUntil <= 15) {
      nudges.push({
        type: NUDGE_TYPES.PRE_TASK,
        urgency: URGENCY.LOW,
        tone: TONE.PLAYFUL,
        task: nextTask,
        minutesUntil: Math.round(minutesUntil),
      })
    }

    // Task overdue
    if (minutesUntil != null && minutesUntil < 0) {
      const minutesOverdue = Math.abs(Math.round(minutesUntil))
      nudges.push({
        type: NUDGE_TYPES.OVERDUE,
        urgency: combo > 0 ? URGENCY.HIGH : URGENCY.MEDIUM,
        tone: combo > 0 ? TONE.URGENT : TONE.PLAYFUL,
        task: nextTask,
        minutesOverdue,
        comboAtRisk: combo > 0,
      })
    }
  }

  // Combo warning: if combo > 2 and no task completed in last 45 min
  if (combo >= 3 && lastActivityTime) {
    const minsSinceActivity = (now - new Date(lastActivityTime)) / 60000
    if (minsSinceActivity > 30 && minsSinceActivity <= 45) {
      nudges.push({
        type: NUDGE_TYPES.COMBO_WARNING,
        urgency: URGENCY.HIGH,
        tone: TONE.URGENT,
        combo,
        minutesLeft: Math.round(45 - minsSinceActivity),
      })
    }
  }

  // Idle nudge: no activity for 2+ hours during active hours (8am-8pm)
  const hour = now.getHours()
  if (hour >= 8 && hour <= 20 && lastActivityTime) {
    const minsSinceActivity = (now - new Date(lastActivityTime)) / 60000
    if (minsSinceActivity > 120) {
      nudges.push({
        type: NUDGE_TYPES.IDLE_NUDGE,
        urgency: URGENCY.LOW,
        tone: TONE.CASUAL,
        idleMinutes: Math.round(minsSinceActivity),
      })
    }
  }

  // All tasks done
  const allDone = tasks.length > 0 && tasks.every(t => t.completed)
  if (allDone) {
    nudges.push({
      type: NUDGE_TYPES.DAY_COMPLETE,
      urgency: URGENCY.HIGH,
      tone: TONE.CELEBRATORY,
    })
  }

  return nudges
}

// ─── Get Morning Briefing Data ───
function getMorningBriefing(tasks, streak) {
  const totalTasks = tasks.length
  const taskNames = tasks.map(t => t.name)
  return {
    type: NUDGE_TYPES.MORNING,
    urgency: URGENCY.MEDIUM,
    tone: TONE.PLAYFUL,
    totalTasks,
    taskNames,
    streak,
    firstTask: tasks[0] || null,
  }
}

// ─── Get Debrief After Task ───
function getDebrief(task, gamificationResult) {
  return {
    type: NUDGE_TYPES.DEBRIEF,
    urgency: URGENCY.MEDIUM,
    tone: TONE.CELEBRATORY,
    task,
    xpEarned: gamificationResult.lastTaskXP,
    combo: gamificationResult.combo,
    comboLabel: gamificationResult.comboLabel,
    dayGrade: gamificationResult.dayGrade,
  }
}

// ─── Combo Expiry Timer (in minutes) ───
const COMBO_EXPIRY_MINUTES = 45

function getComboTimeLeft(lastActivityTime) {
  if (!lastActivityTime) return null
  const elapsed = (Date.now() - new Date(lastActivityTime).getTime()) / 60000
  const remaining = COMBO_EXPIRY_MINUTES - elapsed
  return remaining > 0 ? Math.round(remaining) : 0
}

export {
  NUDGE_TYPES,
  URGENCY,
  TONE,
  COMBO_EXPIRY_MINUTES,
  evaluateSchedule,
  getMorningBriefing,
  getDebrief,
  getComboTimeLeft,
}
