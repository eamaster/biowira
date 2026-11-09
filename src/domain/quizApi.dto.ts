import type { Quiz, QuizQuestion, QuizAnswer } from './quiz'
import { collectQuizRelatedMatchKeys } from './quiz'

// ── Backend API Wire Types ─────────────────────────────────────────────────────

export interface ApiQuizSummary {
  id: number | string
  title: string
  description: string
  topic: string
}

export interface ApiQuizChoice {
  choiceLabel: string  // e.g. "A"
  choiceText: string   // e.g. "40 years"
  isCorrect: boolean
}

export interface ApiQuizQuestion {
  questionId: number | string
  animalId: number | string
  questionText: string
  /** Shown after retries are used — teaching note from the API (not shown on first wrong answer). */
  explanation: string
  difficulty: string
  choices: ApiQuizChoice[]
}

// ── Visual Dictionary Type ──────────────────────────────────────────────────────

export interface AnimalVisualContext {
  visualKey?: string
  emoji: string
}

// ── Mapping Layer ─────────────────────────────────────────────────────────────

export function mapBackendQuizToDomain(
  summary: ApiQuizSummary,
  rawQuestions: ApiQuizQuestion[],
  animalVisualMap: Record<string, AnimalVisualContext>
): Quiz {
  const questions = rawQuestions.map((q) => mapBackendQuestionToDomain(q, animalVisualMap))
  return {
    id: String(summary.id),
    title: summary.title,
    description: summary.description,
    topic: summary.topic,
    questions,
    relatedMatchKeys: collectQuizRelatedMatchKeys(questions),
    // Derive safely; this is not in the summary payload but required by domain
    pointsPerCorrect: 20,
    bonusForPerfect: 20,
  }
}

export function mapBackendQuestionToDomain(
  dto: ApiQuizQuestion,
  animalVisualMap: Record<string, AnimalVisualContext>
): QuizQuestion {
  const qIdStr = String(dto.questionId)
  
  // 1. Validate choices
  if (!dto.choices || dto.choices.length === 0) {
    throw new Error(`QuizQuestion ${qIdStr} has no choices defined.`)
  }

  const correctChoices = dto.choices.filter(c => c.isCorrect)
  if (correctChoices.length !== 1) {
    throw new Error(`QuizQuestion ${qIdStr} must have exactly one correct choice, found ${correctChoices.length}.`)
  }

  const correctChoice = correctChoices[0]!
  const correctAnswerId = `${qIdStr}:${correctChoice.choiceLabel}`

  // 2. Map choices to Domain Answers
  const answers: QuizAnswer[] = dto.choices.map(c => ({
    id: `${qIdStr}:${c.choiceLabel}`,
    label: c.choiceLabel,
    text: c.choiceText,
    isCorrect: c.isCorrect
  }))

  // 3. Resolve visual identity from backend animal id lookup
  const backendAnimalIdStr = String(dto.animalId)
  const visualCtx = animalVisualMap[backendAnimalIdStr] || { emoji: '❓' }

  return {
    id: qIdStr,
    questionText: dto.questionText,
    animalEmoji: visualCtx.emoji,
    animalVisualKey: visualCtx.visualKey,
    sourceAnimalId: backendAnimalIdStr,
    answers,
    explanation: dto.explanation || 'No explanation provided.',
    correctAnswerId,
  }
}
