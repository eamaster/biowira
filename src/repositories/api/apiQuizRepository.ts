import { apiClient } from '@/services/apiClient'
import type { Quiz, QuizResult } from '@/domain/quiz'
import type { IQuizRepository } from '../interfaces'
import {
  mapBackendQuizToDomain,
  type ApiQuizSummary,
  type ApiQuizQuestion,
  type AnimalVisualContext
} from '@/domain/quizApi.dto'
import type { AnimalCardApiDto } from '@/domain/animalApi.dto'
import { resolveAnimalVisualKey } from '@/domain/animalVisuals'
import { CATEGORY_EMOJI } from '@/app/config'
import type { QuizSaveProgressResult, RewardProgressDto } from '@/domain/missionApi.dto'

export class ApiQuizRepository implements IQuizRepository {
  private animalVisualCache: Record<string, AnimalVisualContext> | null = null

  private async getAnimalVisualsMap(): Promise<Record<string, AnimalVisualContext>> {
    if (this.animalVisualCache) return this.animalVisualCache

    try {
      const dtos = await apiClient.get<AnimalCardApiDto[]>('/animals')
      const map: Record<string, AnimalVisualContext> = {}
      for (const dto of dtos) {
        map[String(dto.id)] = {
          visualKey: resolveAnimalVisualKey(dto.scientificName, dto.commonName),
          // normalize common category enum shapes (e.g. "Marine Freshwater" -> "marine_freshwater")
          emoji: CATEGORY_EMOJI[(dto.animalClass ?? '').toLowerCase().replace(/ & | /g, '_')] ?? '❓'
        }
      }
      this.animalVisualCache = map
      return map
    } catch (err) {
      console.warn('ApiQuizRepository: Failed to load animal metadata for quiz visuals', err)
      return {}
    }
  }

  async getAll(): Promise<Quiz[]> {
    // 1. Fetch quiz summaries
    const summaries = await apiClient.get<ApiQuizSummary[]>('/quizzes')

    // 2. Prepare animal visual mapping cache
    const visualMap = await this.getAnimalVisualsMap()

    // 3. Fetch questions for every summary
    const quizzes = await Promise.all(
      summaries.map(async (summary) => {
        try {
          const questions = await apiClient.get<ApiQuizQuestion[]>(`/quizzes/${summary.id}/questions`)
          return mapBackendQuizToDomain(summary, questions, visualMap)
        } catch (err) {
          console.warn(`ApiQuizRepository: Skipping quiz ${summary.id} due to invalid question fetch:`, err)
          return null
        }
      })
    )

    // Return only successfully mapped quizzes
    return quizzes.filter((q): q is Quiz => q !== null)
  }

  async getById(id: string): Promise<Quiz | null> {
    try {
      // Because there is no nested /quizzes/:id endpoint, we must compose it ourselves.
      // First, get the summaries.
      const summaries = await apiClient.get<ApiQuizSummary[]>('/quizzes')
      const summary = summaries.find(s => String(s.id) === String(id))
      
      if (!summary) return null

      // Then grab the dedicated questions for this quiz
      const questions = await apiClient.get<ApiQuizQuestion[]>(`/quizzes/${id}/questions`)
      const visualMap = await this.getAnimalVisualsMap()

      return mapBackendQuizToDomain(summary, questions, visualMap)
    } catch {
      return null
    }
  }

  async submitResult(_result: QuizResult): Promise<void> {
    // No verified POST /api/quizzes/result endpoint exists — quiet no-op.
    return Promise.resolve()
  }

  /**
   * POST /api/quizzes/save-progress
   * Body: { totalQuestions, correctAnswers }
   * Returns updated reward/progress from the backend.
   * The client must NOT send profileId or client-computed score.
   */
  async saveProgress(
    totalQuestions: number,
    correctAnswers: number,
  ): Promise<QuizSaveProgressResult> {
    const dto = await apiClient.post<RewardProgressDto>('/quizzes/save-progress', {
      totalQuestions,
      correctAnswers,
    })
    return {
      totalPoints: dto.totalPoints,
      newLevel: dto.newLevel,
      leveledUp: dto.leveledUp,
      newFactsUnlocked: dto.newFactsUnlocked,
      newBadges: dto.newBadges,
    }
  }
}
