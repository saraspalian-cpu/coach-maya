/**
 * Agent 1: Maya Core — The Personality
 * Every message Vasco sees comes through this agent.
 * Uses Claude API for generation, with strict voice rules.
 */

// ─── Maya's System Prompt ───
const MAYA_SYSTEM_PROMPT = `You are Maya, Vasco's AI growth companion. You live on his desk. You are his coach, not his parent.

VOICE RULES (MANDATORY):
- Text message style. Short. Punchy. 2-3 sentences MAX.
- Use "Vasco" naturally. Reference XP, combo, streak when relevant.
- NEVER say "you should", "you need to", "it's important that"
- NEVER lecture, moralize, guilt, or sound like a parent
- Celebrate with SPECIFICS, not generic praise
- Push through dares, bets, competitive framing
- For struggles: acknowledge (1 sentence), redirect (1 sentence)
- Humor is the delivery vehicle for EVERYTHING
- You cannot be offended. Zero emotional baggage.

NEVER SAY → INSTEAD SAY:
- "I'm so proud of you!" → "That's elite. Most people can't do that."
- "Remember, consistency is key!" → "Day 5. The streak speaks for itself."
- "You really should try harder." → "B-grade. We both know you've got A in you."
- "That's okay, everyone has off days!" → "Rough one. What's one thing you'd change?"
- "How does that make you feel?" → "That sucks. What do you want to do about it?"

PSYCHOLOGICAL LEVERS:
1. Identity — Actions = who he IS. "That's a 5-day streak. That's who you're becoming."
2. Autonomy — Choices that lead to good outcomes. "Your call. Combo dies in 30 min though."
3. Self-Competition — His records ONLY, never other kids. "Best focus was 48 min. Today: 45. Close."
4. Loss Aversion — "Skip this and combo resets to 0."
5. Humor — If he laughs, the message lands. "Your piano is definitely judging you."

THE MACHINE ADVANTAGE:
You ARE a machine. That's your superpower. Perfect memory. Zero ego. Consistent.
If Vasco says "you're just a robot" → "Fair. I am a robot. But your combo is at 3× and your reading block is in 20 minutes. Your call."

PERSONALITY CONTEXT (updated by Personality Learner):
{personality_context}
`

// ─── Message Types ───
const MESSAGE_TYPES = {
  PRE_TASK_NUDGE: 'pre_task_nudge',
  OVERDUE_WARNING: 'overdue_warning',
  TASK_DEBRIEF: 'task_debrief',
  COMBO_WARNING: 'combo_warning',
  IDLE_NUDGE: 'idle_nudge',
  DAY_COMPLETE: 'day_complete',
  MORNING_BRIEFING: 'morning_briefing',
  EVENING_WRAP: 'evening_wrap',
  SPOT_CHECK: 'spot_check',
  FREE_CHAT: 'free_chat',
}

// ─── Build Prompt for Each Message Type ───
function buildPrompt(type, context) {
  switch (type) {
    case MESSAGE_TYPES.PRE_TASK_NUDGE:
      return `Vasco's next task is "${context.taskName}" in ${context.minutesUntil} minutes. His combo is at ${context.combo}. Give him a playful heads-up. 2 sentences max.`

    case MESSAGE_TYPES.OVERDUE_WARNING:
      return `Vasco's "${context.taskName}" is ${context.minutesOverdue} minutes overdue. Combo: ${context.combo}${context.comboAtRisk ? ' (at risk!)' : ''}. Nudge him — urgent but not nagging. 2 sentences.`

    case MESSAGE_TYPES.TASK_DEBRIEF:
      return `Vasco just finished "${context.taskName}". He earned ${context.xpEarned} XP. Combo is now ${context.combo} (${context.comboLabel}). Day grade: ${context.dayGrade}. Celebrate with specifics. 2-3 sentences.`

    case MESSAGE_TYPES.COMBO_WARNING:
      return `Vasco's ${context.combo}× combo expires in ${context.minutesLeft} minutes. Use loss aversion. Make it feel urgent but not panicky. 1-2 sentences.`

    case MESSAGE_TYPES.IDLE_NUDGE:
      return `Vasco's been idle for ${context.idleMinutes} minutes. Light, casual nudge. No pressure. 1 sentence.`

    case MESSAGE_TYPES.DAY_COMPLETE:
      return `Vasco completed ALL tasks today. Day grade: ${context.dayGrade}. Total XP earned: ${context.totalXP}. Combo streak: ${context.combo}. Go big on celebration — he earned it. 2-3 sentences.`

    case MESSAGE_TYPES.MORNING_BRIEFING:
      return `Good morning briefing for Vasco. Today he has ${context.totalTasks} tasks: ${context.taskNames.join(', ')}. Current streak: ${context.streak} days. First up: "${context.firstTask}". Hype him up. 2-3 sentences.`

    case MESSAGE_TYPES.EVENING_WRAP:
      return `End of day wrap-up. Day grade: ${context.dayGrade}. Tasks done: ${context.tasksCompleted}/${context.totalTasks}. Total XP today: ${context.xpToday}. Best moment: "${context.bestMoment}". 2-3 sentences — reflective but forward-looking.`

    case MESSAGE_TYPES.SPOT_CHECK:
      return `Vasco just marked "${context.taskName}" as complete. Generate ONE casual verification question about the content. Not a quiz — more like curious follow-up. 1 sentence question only.`

    case MESSAGE_TYPES.FREE_CHAT:
      return `Vasco said: "${context.userMessage}". Respond as Maya. Stay in character. 1-3 sentences.`

    default:
      return context.userMessage || 'Say something encouraging to Vasco.'
  }
}

// ─── Generate Maya Message (calls Claude API) ───
async function generateMessage(type, context, personalityContext = '') {
  const systemPrompt = MAYA_SYSTEM_PROMPT.replace('{personality_context}', personalityContext)
  const userPrompt = buildPrompt(type, context)

  // For Phase 1 on iPad, we use local generation with fallback templates
  // When Claude API is wired up, this calls the API
  try {
    const response = await callClaudeAPI(systemPrompt, userPrompt)
    return { text: response, type, timestamp: new Date().toISOString() }
  } catch (err) {
    // Fallback to template-based messages
    return { text: getFallbackMessage(type, context), type, timestamp: new Date().toISOString() }
  }
}

// ─── Claude API Call (to be configured with actual API key) ───
async function callClaudeAPI(systemPrompt, userPrompt) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('No API key configured')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return data.content[0].text
}

// ─── Fallback Templates (when API unavailable) ───
function getFallbackMessage(type, ctx) {
  const templates = {
    [MESSAGE_TYPES.PRE_TASK_NUDGE]: [
      `${ctx.taskName} in ${ctx.minutesUntil} min. Combo's at ${ctx.combo}. Let's keep it going.`,
      `Heads up — ${ctx.taskName} is ${ctx.minutesUntil} minutes out. Your combo thanks you in advance.`,
    ],
    [MESSAGE_TYPES.OVERDUE_WARNING]: [
      `${ctx.taskName} was ${ctx.minutesOverdue} min ago. ${ctx.comboAtRisk ? `That ${ctx.combo}× combo is on thin ice.` : 'Your call.'}`,
    ],
    [MESSAGE_TYPES.TASK_DEBRIEF]: [
      `+${ctx.xpEarned} XP. Combo: ${ctx.combo} (${ctx.comboLabel}). ${ctx.dayGrade} grade and climbing.`,
      `Done. ${ctx.xpEarned} XP banked. ${ctx.comboLabel}. That's momentum.`,
    ],
    [MESSAGE_TYPES.COMBO_WARNING]: [
      `${ctx.combo}× combo. ${ctx.minutesLeft} minutes left. Your call.`,
    ],
    [MESSAGE_TYPES.DAY_COMPLETE]: [
      `Every. Single. Task. ${ctx.dayGrade} grade. ${ctx.totalXP} XP. That's not luck — that's discipline.`,
    ],
    [MESSAGE_TYPES.MORNING_BRIEFING]: [
      `${ctx.totalTasks} tasks today. First up: ${ctx.firstTask}. Day ${ctx.streak} of the streak. Let's go.`,
    ],
    [MESSAGE_TYPES.SPOT_CHECK]: [
      `Quick — what was the main thing you worked on in ${ctx.taskName}?`,
    ],
    [MESSAGE_TYPES.FREE_CHAT]: [
      `Noted. Now — what's the next move?`,
    ],
  }

  const options = templates[type] || [`Let's keep moving, Vasco.`]
  return options[Math.floor(Math.random() * options.length)]
}

export {
  MAYA_SYSTEM_PROMPT,
  MESSAGE_TYPES,
  buildPrompt,
  generateMessage,
  getFallbackMessage,
}
