import { MOCK_QUIZZES } from '@/mocks/quizzes'
import type { Quiz, QuizResult } from '@/domain/quiz'
import { collectQuizRelatedMatchKeys } from '@/domain/quiz'
import type { IQuizRepository } from '../interfaces'
import type { QuizSaveProgressResult } from '@/domain/missionApi.dto'

function withRelatedKeys(quiz: Quiz): Quiz {
  return {
    ...quiz,
    relatedMatchKeys:
      quiz.relatedMatchKeys?.length ? quiz.relatedMatchKeys : collectQuizRelatedMatchKeys(quiz.questions),
  }
}

export class MockQuizRepository implements IQuizRepository {
  async getAll(): Promise<Quiz[]> {
    return structuredClone(MOCK_QUIZZES).map(withRelatedKeys)
  }

  async getById(id: string): Promise<Quiz | null> {
    const found = MOCK_QUIZZES.find((q) => q.id === id)
    return found ? withRelatedKeys(structuredClone(found)) : null
  }

  async submitResult(_result: QuizResult): Promise<void> {
    // Mock: no-op
  }

  async saveProgress(
    _totalQuestions: number,
    _correctAnswers: number,
  ): Promise<QuizSaveProgressResult> {
    // Mock: quiet no-op — returns zeroed values so quizStore falls back to local progress update
    return { totalPoints: 0, newLevel: 1, leveledUp: false, newFactsUnlocked: 0, newBadges: [] }
  }
}
