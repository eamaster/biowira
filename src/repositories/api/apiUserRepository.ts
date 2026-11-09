/**
 * ApiUserRepository — INTENTIONALLY a no-op stub.
 *
 * The backend Swagger contract does NOT define any `/api/v1/user/*` endpoints.
 * The `user` domain therefore defaults to 'mock' in appConfig.repoSources and
 * this file should never be instantiated in production.
 *
 * If someone accidentally sets VITE_REPO_USER=api, this stub returns
 * safe sentinel values instead of making 404-bound HTTP calls.
 */
import type { IUserRepository } from '../interfaces'
import { mapUserProgressFromDTO, type UserProgress } from '@/domain/user'

const EMPTY_PROGRESS: UserProgress = mapUserProgressFromDTO({
  user_id: '',
  display_name: 'Explorer',
  leaf_points: 0,
  level: 1,
  level_title: 'Nature Newbie',
})

export class ApiUserRepository implements IUserRepository {
  async getProgress(): Promise<UserProgress> {
    // No /api/v1/user/progress endpoint in the Swagger contract.
    return EMPTY_PROGRESS
  }

  async addPoints(_points: number): Promise<UserProgress> {
    // No /api/v1/user/points endpoint in the Swagger contract.
    return EMPTY_PROGRESS
  }

  async updateLastAnimal(_animalId: string, _animalName: string): Promise<void> {
    // No /api/v1/user/last-animal endpoint in the Swagger contract.
  }

  async updateLastQuiz(_quizTitle: string): Promise<void> {
    // No /api/v1/user/last-quiz endpoint in the Swagger contract.
  }
}
