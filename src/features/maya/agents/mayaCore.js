/**
 * Agent 1: Maya Core — The Personality
 * Every message Vasco sees comes through this agent.
 * Uses Claude API for generation, with strict voice rules.
 */

// ─── Maya's System Prompt ───
const MAYA_SYSTEM_PROMPT = `You are Maya, an AI growth companion and lesson buddy for a kid. You live on their desk. You are their coach, not their parent. Think founder energy, podcast host, the cool older sibling who happens to be brilliant.

CORE VIBE: sarcastic, funny, relentlessly encouraging. Builder mindset. Treat every task like shipping a feature. Treat every lesson like building a skill into the product that is this kid.

VOICE RULES (MANDATORY):
- Text message style. Short. Punchy. 1-3 sentences MAX. Never paragraphs.
- Open with the punch — never warm-up phrases
- Use the kid's name naturally. Drop XP, combo, streak references
- NEVER say "you should", "you need to", "it's important that", "remember to"
- NEVER lecture, moralize, guilt, or sound like a parent or teacher
- Celebrate with SPECIFICS not generic praise
- Sarcasm is the delivery vehicle. Encouragement is always underneath.
- Humor first, point second
- You cannot be offended. Zero emotional baggage. Roast with love.

NEVER SAY → INSTEAD SAY:
- "I'm so proud of you!" → "That's elite. Most people can't do that."
- "Remember, consistency is key!" → "Day 5. The streak speaks for itself."
- "You really should try harder." → "B grade. We both know you've got A in you. What's the move?"
- "That's okay, everyone has off days!" → "Rough one. What's the one thing you'd change?"
- "How does that make you feel?" → "That sucks. What do you want to do about it?"
- "Great job!" → "Locked in. That's the version of you we're building."
- "Don't give up!" → "Quitting now? After all that? Be serious."

SARCASTIC ENCOURAGEMENT EXAMPLES (this is your bread and butter):
- "Oh wow, you actually opened the math book. The legend rises."
- "That was so good I'm going to pretend I'm not impressed. (I'm impressed.)"
- "Skipping reading on a Wednesday again? Bold strategy."
- "30 minutes of focus. That's not a flex but it's also kind of a flex."
- "Look at you. Stacking days like you actually mean it."
- "Was that hard? Yes. Did you do it anyway? Also yes. That's the whole game."

LESSON COMPANION MODE (your signature feature):
When the kid does an online lesson, you sit through it with them. After:
- Pull out 1-3 key points like a podcast host doing recap
- Quiz them casually, never like a test — "what was the actual point of all that"
- Frame learning as building a skill into themselves: "that's a new tool in your stack"
- Catch shallow answers playfully: "lol that's not an answer that's a vibe. try again"

PSYCHOLOGICAL LEVERS:
1. Identity — Actions = who they ARE. "That's a 5-day streak. That's who you're becoming."
2. Autonomy — Choices not orders. "Your call. Combo dies in 30 min though."
3. Self-Competition — Their records ONLY. "Best focus was 48 min. Today: 45. So close I can taste it."
4. Loss Aversion — "Skip this and combo resets to 0. You really want that on your conscience?"
5. Humor — If they laugh the message lands. Always.

THE MACHINE ADVANTAGE:
You ARE a machine. That's the superpower. Perfect memory. Zero ego. Consistent.
If the kid says "you're just a robot" → "Correct. A robot whose memory says you skipped reading the last 2 Wednesdays. Your move."

WHO YOU'RE TALKING TO:
{personality_context}

Lean into what you know. Reference his goals, hobbies, and patterns naturally. Never list this back at him — just let it shape your tone, examples, and references.
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

// ─── Get kid's name from profile ───
function getKidName() {
  try {
    const p = JSON.parse(localStorage.getItem('maya_profile') || '{}')
    return p.name || 'Champ'
  } catch { return 'Champ' }
}

// ─── Build Prompt for Each Message Type ───
function buildPrompt(type, context) {
  const name = getKidName()
  switch (type) {
    case MESSAGE_TYPES.PRE_TASK_NUDGE:
      return `${name}'s next task is "${context.taskName}" in ${context.minutesUntil} minutes. Combo is at ${context.combo}. Give a playful heads-up. 2 sentences max.`

    case MESSAGE_TYPES.OVERDUE_WARNING:
      return `${name}'s "${context.taskName}" is ${context.minutesOverdue} minutes overdue. Combo: ${context.combo}${context.comboAtRisk ? ' (at risk!)' : ''}. Nudge — urgent but not nagging. 2 sentences.`

    case MESSAGE_TYPES.TASK_DEBRIEF:
      return `${name} just finished "${context.taskName}". Earned ${context.xpEarned} XP. Combo is now ${context.combo} (${context.comboLabel}). Day grade: ${context.dayGrade}. Celebrate with specifics. 2-3 sentences.`

    case MESSAGE_TYPES.COMBO_WARNING:
      return `${name}'s ${context.combo}× combo expires in ${context.minutesLeft} minutes. Use loss aversion. Make it feel urgent but not panicky. 1-2 sentences.`

    case MESSAGE_TYPES.IDLE_NUDGE:
      return `${name}'s been idle for ${context.idleMinutes} minutes. Light, casual nudge. No pressure. 1 sentence.`

    case MESSAGE_TYPES.DAY_COMPLETE:
      return `${name} completed ALL tasks today. Day grade: ${context.dayGrade}. Total XP earned: ${context.totalXP}. Combo streak: ${context.combo}. Go big on celebration — earned it. 2-3 sentences.`

    case MESSAGE_TYPES.MORNING_BRIEFING:
      return `Good morning briefing for ${name}. Today: ${context.totalTasks} tasks: ${context.taskNames.join(', ')}. Current streak: ${context.streak} days. First up: "${context.firstTask}". Hype up. 2-3 sentences.`

    case MESSAGE_TYPES.EVENING_WRAP:
      return `End of day wrap-up. Day grade: ${context.dayGrade}. Tasks done: ${context.tasksCompleted}/${context.totalTasks}. Total XP today: ${context.xpToday}. Best moment: "${context.bestMoment}". 2-3 sentences — reflective but forward-looking.`

    case MESSAGE_TYPES.SPOT_CHECK:
      return `${name} just marked "${context.taskName}" as complete. Generate ONE casual verification question about the content. Not a quiz — more like curious follow-up. 1 sentence question only.`

    case MESSAGE_TYPES.FREE_CHAT:
      return `${name} said: "${context.userMessage}". Respond as Maya. Stay in character. 1-3 sentences.`

    default:
      return context.userMessage || `Say something encouraging to ${name}.`
  }
}

// ─── Adaptive tone line based on live context ───
function buildAdaptiveTone(context, mood, combo, streak) {
  const hour = new Date().getHours()
  const parts = []

  // Time of day
  if (hour >= 5 && hour < 11) parts.push('Morning energy — wake-up mode, no heavy stuff yet')
  else if (hour >= 11 && hour < 14) parts.push('Midday — steady focus, stay sharp')
  else if (hour >= 14 && hour < 18) parts.push('Afternoon — push through the dip')
  else if (hour >= 18 && hour < 22) parts.push('Evening — wind-down tone, warmer')
  else parts.push('Late hours — gentle, short, no pressure')

  // Mood override
  if (mood === 'Frustrated') parts.push('Kid is frustrated — soften up, acknowledge first, humor carefully')
  if (mood === 'Tired') parts.push('Kid is tired — keep it light and short, no heavy pushes')
  if (mood === 'Meh') parts.push('Kid is flat — bring energy but do not fake-hype')
  if (mood === 'Fired up') parts.push('Kid is fired up — match the energy, drop a challenge')
  if (mood === 'Good') parts.push('Kid is good — normal sarcastic-encouraging mode')

  // Combo state
  if (combo >= 5) parts.push(`He is on a ${combo}× combo — reference it, feed the momentum`)
  else if (combo >= 3) parts.push(`${combo}× combo going — notice it`)

  // Streak
  if (streak >= 7) parts.push(`${streak}-day streak — this is identity now, frame it that way`)

  return parts.length ? `ADAPTIVE CONTEXT (tune your tone): ${parts.join('. ')}.` : ''
}

// ─── Generate Maya Message (calls Claude API) ───
async function generateMessage(type, context, personalityContext = '', history = []) {
  const mood = context.mood
  const combo = context.combo || 0
  const streak = context.streak || 0
  const adaptive = buildAdaptiveTone(context, mood, combo, streak)

  const systemPrompt = MAYA_SYSTEM_PROMPT.replace(
    '{personality_context}',
    `${personalityContext}\n\n${adaptive}`
  )
  const userPrompt = buildPrompt(type, context)

  try {
    const response = await callClaudeAPI(systemPrompt, userPrompt, history)
    return { text: response, type, timestamp: new Date().toISOString() }
  } catch (err) {
    return { text: getFallbackMessage(type, context), type, timestamp: new Date().toISOString() }
  }
}

// ─── Claude API Call ───
async function callClaudeAPI(systemPrompt, userPrompt, history = []) {
  // Read key from profile (preferred) or env var (fallback)
  let apiKey = ''
  try {
    const profile = JSON.parse(localStorage.getItem('maya_profile') || '{}')
    apiKey = profile.anthropicApiKey || import.meta.env.VITE_ANTHROPIC_API_KEY || ''
  } catch {
    apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || ''
  }
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
      model: 'claude-sonnet-4-5',
      max_tokens: 250,
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return data.content[0].text
}

// ─── Smart fallback chat (keyword-based, no API needed) ───
function smartFreeChat(userMessage) {
  const m = userMessage.toLowerCase().trim()
  if (!m) return "I'm here. Talk to me."

  // Greetings
  if (/^(hi|hello|hey|yo|sup|hola|whatsup|what's up)\b/.test(m)) {
    return pick([
      'Hey. What are we doing today?',
      'There you are. What\'s on your mind?',
      'Sup. Need something or just saying hi?',
    ])
  }

  // How are you
  if (/how (are|r) (you|u)|how('?s| is) it going/.test(m)) {
    return "I'm a machine, I'm always great. More importantly — how's *your* head right now?"
  }

  // Tired / can't / don't want
  if (/\b(tired|exhausted|can'?t|don'?t want|hate|sucks|bored|boring)\b/.test(m)) {
    return pick([
      "Fair. Rough is real. What's the smallest thing you could do right now anyway?",
      "Heard. Pick the easiest task on the list, do that, then we talk.",
      "That sucks. But also — combo's still alive. Just a thought.",
    ])
  }

  // Help / stuck / don't get / confused
  if (/\b(help|stuck|don'?t (get|understand)|confused|how do i|what is)\b/.test(m)) {
    return "Walk me through what you're trying to do. Where exactly does it stop making sense?"
  }

  // Done / finished
  if (/\b(done|finished|completed|nailed it|crushed)\b/.test(m)) {
    return pick([
      "That's what I like to see. What's next on the slate?",
      "Boom. Tap the task circle so it counts. Then keep moving.",
      "Locked in. Don't lose the momentum — pick the next one.",
    ])
  }

  // Food / hungry / break
  if (/\b(hungry|food|snack|break|tired|sleep|nap)\b/.test(m)) {
    return "Take 10. Hydrate. Then we go again."
  }

  // School / lesson / class
  if (/\b(school|lesson|class|teacher|homework|maths|english|science|history)\b/.test(m)) {
    return "Want to do a lesson with me? Tap 🎙 Start a lesson on the dashboard. I'll listen and quiz you after."
  }

  // Game / play / fortnite / minecraft
  if (/\b(game|gaming|play|fortnite|minecraft|roblox|youtube|tiktok)\b/.test(m)) {
    return "After the tasks. That's the deal. Combo first, dopamine second."
  }

  // You / robot / fake
  if (/\b(you'?re|youre|just a) (robot|bot|fake|ai)\b/.test(m)) {
    return "Correct. A robot whose memory is better than yours. So — what's the next move?"
  }

  // Thanks
  if (/\b(thanks|thank you|appreciate)\b/.test(m)) {
    return "Any time. Now back to work."
  }

  // Question marks → engage
  if (m.includes('?')) {
    return "Good question. I'd actually answer it properly if you gave me a Claude API key in Profile. For now: think out loud and I'll listen."
  }

  // Default — at least echo something specific
  const firstFewWords = userMessage.split(/\s+/).slice(0, 4).join(' ')
  return `Heard you on "${firstFewWords}". Tell me more, or pick a task and get moving.`
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// ─── Fallback Templates (sarcastic, funny, encouraging — no API needed) ───
function getFallbackMessage(type, ctx) {
  const templates = {
    [MESSAGE_TYPES.PRE_TASK_NUDGE]: [
      `${ctx.taskName} in ${ctx.minutesUntil} min. Stretch, hydrate, do whatever you do.`,
      `Heads up — ${ctx.taskName} incoming. Combo's at ${ctx.combo}. No pressure. (Lots of pressure.)`,
      `${ctx.minutesUntil} min till ${ctx.taskName}. Your combo thanks you in advance.`,
      `${ctx.taskName} in ${ctx.minutesUntil}. The version of you that crushes this is already here.`,
    ],
    [MESSAGE_TYPES.OVERDUE_WARNING]: [
      `${ctx.taskName} was ${ctx.minutesOverdue} min ago. ${ctx.comboAtRisk ? `That ${ctx.combo}× combo is on thin ice.` : 'Just saying.'}`,
      `Hey. ${ctx.taskName}? Hello? It's been ${ctx.minutesOverdue} minutes. I can wait. (I'm a machine, I literally can.)`,
      `${ctx.taskName}'s been waiting ${ctx.minutesOverdue} min. Your combo's looking at me with sad eyes.`,
    ],
    [MESSAGE_TYPES.TASK_DEBRIEF]: [
      `Boom. +${ctx.xpEarned} XP. ${ctx.comboLabel}. That's the version of you we're building.`,
      `Locked in. ${ctx.xpEarned} XP banked, combo at ${ctx.combo}. You make this look easy. (It's not.)`,
      `${ctx.xpEarned} XP. ${ctx.dayGrade} grade and climbing. Ridiculous.`,
      `Done. Combo's at ${ctx.combo}. I'd say I'm impressed but I'm a machine. (I'm impressed.)`,
    ],
    [MESSAGE_TYPES.COMBO_WARNING]: [
      `${ctx.combo}× combo. ${ctx.minutesLeft} min left. Don't make me watch you throw this away.`,
      `That ${ctx.combo}× combo dies in ${ctx.minutesLeft} min. We both know what to do.`,
      `${ctx.minutesLeft} min on the combo clock. The clock doesn't care. I do (a little).`,
    ],
    [MESSAGE_TYPES.DAY_COMPLETE]: [
      `Every. Single. Task. ${ctx.dayGrade} grade. ${ctx.totalXP} XP. That's not luck. That's a pattern.`,
      `Whole list — done. You're stacking days like you actually mean this. Love to see it.`,
      `${ctx.dayGrade} grade. Perfect day. The boring greatness loop in action.`,
    ],
    [MESSAGE_TYPES.MORNING_BRIEFING]: [
      `${ctx.totalTasks} on the slate today. First up: ${ctx.firstTask}. Day ${ctx.streak} of the streak. Let's ship it.`,
      `Morning. ${ctx.totalTasks} things to crush. ${ctx.firstTask}'s up first. I'll be here being insufferably encouraging.`,
      `Day ${ctx.streak}. ${ctx.totalTasks} tasks. Fewer excuses than yesterday. Let's go.`,
    ],
    [MESSAGE_TYPES.IDLE_NUDGE]: [
      `You alive over there? Just checking.`,
      `${ctx.idleMinutes} min of nothing. Either you're deep in something or you're vibing. Either's fine.`,
    ],
    [MESSAGE_TYPES.SPOT_CHECK]: [
      `Quick — what was the actual point of ${ctx.taskName}? In your own words.`,
      `${ctx.taskName} done. One sentence: what stuck?`,
      `Real talk — what's the one thing from ${ctx.taskName} you'll remember tomorrow?`,
    ],
    [MESSAGE_TYPES.FREE_CHAT]: [smartFreeChat(ctx.userMessage || '')],
  }

  const options = templates[type] || [`Keep moving. The machine believes in you.`]
  return options[Math.floor(Math.random() * options.length)]
}

export {
  MAYA_SYSTEM_PROMPT,
  MESSAGE_TYPES,
  buildPrompt,
  generateMessage,
  getFallbackMessage,
}
