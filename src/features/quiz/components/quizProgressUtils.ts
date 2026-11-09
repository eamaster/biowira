import type { QuizAttempt } from '@/domain/quiz'
import { QuizAnswerResult } from '@/domain/enums'

export type DotStatus = 'pending' | 'answered' | 'correct' | 'wrong'

export interface DotModel {
  status: DotStatus
  /** True when this dot corresponds to the currently active question */
  isCurrent: boolean
}

/**
 * Derives the display model for a single progress dot.
 *
 * Separates answer-status from current-step emphasis so that the current
 * question always receives a visual ring/outline even after being answered.
 */
export function getDotModel(
  i: number,
  attempts: QuizAttempt[],
  currentIndex: number,
): DotModel {
  const found = attempts[i]
  const isCurrent = i === currentIndex

  let status: DotStatus
  if (found) {
    if (found.result === QuizAnswerResult.Correct) {
      status = 'correct'
    } else if (found.retriesUsed >= 1 && !found.isRetrying) {
      status = 'wrong'
    } else {
      status = 'answered'
    }
  } else {
    status = 'pending'
  }

  return { status, isCurrent }
}
