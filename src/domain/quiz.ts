import type { QuizAnswerResult } from './enums'

export interface QuizAnswer {
  id: string
  label: string
  text: string
  isCorrect: boolean
}

export interface QuizQuestion {
  id: string
  questionText: string
  animalEmoji: string
  /** Registry / sprite key for {@link AnimalIcon} (domain-style slug when known). */
  animalVisualKey?: string
  /** Backend quiz question `animalId` as a string — used for relevance, not for icons. */
  sourceAnimalId?: string
  answers: QuizAnswer[]
  explanation: string
  correctAnswerId: string
}

export interface Quiz {
  id: string
  title: string
  description: string
  /** API quiz topic when loaded from the backend (optional for mocks). */
  topic?: string
  /**
   * Distinct animal linkage keys from questions (visual keys + source ids).
   * Filled by API mapper / {@link collectQuizRelatedMatchKeys} for mocks.
   */
  relatedMatchKeys?: string[]
  questions: QuizQuestion[]
  pointsPerCorrect: number
  bonusForPerfect: number
}

export interface QuizAttempt {
  questionId: string
  /** The answer the user most recently selected; null while in retry mode */
  selectedAnswerId: string | null
  result: QuizAnswerResult
  /** How many retries have been consumed (0 = first try not yet retried, 1 = retry used) */
  retriesUsed: number
  /** True while waiting for the user's retry selection; blocks canProceed */
  isRetrying: boolean
}

export interface QuizResult {
  quizId: string
  score: number
  totalQuestions: number
  pointsEarned: number
  attempts: QuizAttempt[]
  completedAt: Date
}

export interface QuizDTO {
  id: string
  title: string
  description: string
  questions: QuizQuestionDTO[]
  points_per_correct: number
  bonus_for_perfect: number
}

export interface QuizQuestionDTO {
  id: string
  question_text: string
  animal_emoji: string
  /** Optional: visual/registry key (mock JSON) */
  animal_id?: string
  answers: QuizAnswerDTO[]
  explanation: string
  correct_answer_id: string
}

export interface QuizAnswerDTO {
  id: string
  label: string
  text: string
  is_correct: boolean
}

export function collectQuizRelatedMatchKeys(questions: QuizQuestion[]): string[] {
  const out = new Set<string>()
  for (const q of questions) {
    if (q.sourceAnimalId) out.add(q.sourceAnimalId)
    if (q.animalVisualKey) out.add(q.animalVisualKey)
  }
  return [...out]
}

export function mapQuizFromDTO(dto: QuizDTO): Quiz {
  const questions = dto.questions.map(mapQuizQuestionFromDTO)
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    questions,
    relatedMatchKeys: collectQuizRelatedMatchKeys(questions),
    pointsPerCorrect: dto.points_per_correct,
    bonusForPerfect: dto.bonus_for_perfect,
  }
}

export function mapQuizQuestionFromDTO(dto: QuizQuestionDTO): QuizQuestion {
  const slug = dto.animal_id
  return {
    id: dto.id,
    questionText: dto.question_text,
    animalEmoji: dto.animal_emoji,
    animalVisualKey: slug,
    sourceAnimalId: slug,
    answers: dto.answers.map((a) => ({
      id: a.id,
      label: a.label,
      text: a.text,
      isCorrect: a.is_correct,
    })),
    explanation: dto.explanation,
    correctAnswerId: dto.correct_answer_id,
  }
}

/** Matches the quiz hub mascot — only when a quiz has no usable question visuals. */
const QUIZ_HUB_ICON_FALLBACK_EMOJI = '🦁'

function dominantAnimalVisualKey(questions: QuizQuestion[]): string | undefined {
  const counts = new Map<string, number>()
  for (const q of questions) {
    const k = q.animalVisualKey?.trim()
    if (!k) continue
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  let bestKey: string | undefined
  let bestN = 0
  for (const [k, n] of counts) {
    if (n > bestN) {
      bestKey = k
      bestN = n
    }
  }
  return bestKey
}

/**
 * Props for {@link AnimalIcon} on the quiz hub picker — same `animalVisualKey` / emoji
 * chain as live questions, aggregated so each card shows the quiz’s main animal spirit
 * (modal key across questions — no per-title hardcoding in Vue).
 */
export function getQuizHubAnimalIconProps(quiz: Quiz): {
  iconKey?: string
  fallbackEmoji: string
} {
  const questions = quiz.questions
  if (!questions.length) {
    return { fallbackEmoji: QUIZ_HUB_ICON_FALLBACK_EMOJI }
  }

  const dominant = dominantAnimalVisualKey(questions)
  if (dominant) {
    const match = questions.find((q) => q.animalVisualKey?.trim() === dominant)
    const emoji = match?.animalEmoji?.trim()
    return {
      iconKey: dominant,
      fallbackEmoji: emoji && emoji.length > 0 ? emoji : '🐾',
    }
  }

  const firstEmoji = questions
    .map((q) => q.animalEmoji?.trim())
    .find((e) => e && e.length > 0)
  if (firstEmoji) {
    return { fallbackEmoji: firstEmoji }
  }

  return { fallbackEmoji: QUIZ_HUB_ICON_FALLBACK_EMOJI }
}
