/**
 * Agent 7: Anti-Gaming Sentinel
 * Spot-checks ~30% of task completions.
 * Generates verification questions. Evaluates response depth.
 * NEVER punishes — just records.
 */

const SPOT_CHECK_RATE = 0.3 // 30% of completions

// ─── Should We Spot-Check This Completion? ───
function shouldSpotCheck() {
  return Math.random() < SPOT_CHECK_RATE
}

// ─── Generate Spot-Check Question (template-based fallback) ───
// When Claude API is available, Maya Core handles this with personality
function generateSpotCheckQuestion(task) {
  const questions = {
    maths: [
      'What type of problem were you working on?',
      'What was the trickiest part?',
      'Can you explain one concept you practiced?',
    ],
    reading: [
      'What was the chapter about in one sentence?',
      'Who was the main character dealing with?',
      'What happened that surprised you?',
    ],
    science: [
      'What topic did you cover?',
      'What was the key experiment or concept?',
      'Explain one thing you learned like I\'m 10.',
    ],
    writing: [
      'What did you write about?',
      'What was your opening sentence?',
      'What was the hardest part to put into words?',
    ],
    piano: [
      'What piece were you practicing?',
      'Which section gave you trouble?',
      'How many times did you play through it?',
    ],
    tennis: [
      'What did your coach focus on today?',
      'What shot felt best?',
      'What are you working on improving?',
    ],
    default: [
      'What was the main thing you worked on?',
      'What was the hardest part?',
      'Rate that session 1-10 — why?',
    ],
  }

  const pool = questions[task.type?.toLowerCase()] || questions.default
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─── Evaluate Response Depth ───
// Simple heuristic for Phase 1; can be upgraded with AI later
function evaluateResponse(response) {
  if (!response || response.trim().length === 0) {
    return { score: 0, flag: 'no_response', label: 'No response' }
  }

  const words = response.trim().split(/\s+/).length
  const hasDetail = words >= 5
  const hasSpecifics = /\d|chapter|page|section|problem|piece|song|set|coach|drill/i.test(response)

  if (words >= 10 && hasSpecifics) {
    return { score: 3, flag: 'detailed', label: 'Detailed' }
  }
  if (hasDetail || hasSpecifics) {
    return { score: 2, flag: 'adequate', label: 'Adequate' }
  }
  if (words >= 2) {
    return { score: 1, flag: 'shallow', label: 'Shallow' }
  }
  return { score: 0, flag: 'minimal', label: 'Minimal' }
}

// ─── Record Spot-Check Result ───
function createSpotCheckRecord(task, question, response, evaluation) {
  return {
    taskId: task.id,
    taskName: task.name,
    taskType: task.type,
    question,
    response: response || null,
    evaluation,
    timestamp: new Date().toISOString(),
  }
}

export {
  SPOT_CHECK_RATE,
  shouldSpotCheck,
  generateSpotCheckQuestion,
  evaluateResponse,
  createSpotCheckRecord,
}
