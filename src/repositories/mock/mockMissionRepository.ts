import type { IMissionRepository } from '../interfaces'
import type {
  AssignMissionInput,
  MissionCompleteResult,
  MissionHistoryItem,
  MissionPreview,
  WeatherAdaptiveMissionQueryInput,
} from '@/domain/missionApi.dto'
import { getTemplatesByEnvironment } from '@/features/missions/data/missionCatalog'
import { getNewlyUnlockedBadges } from '@/features/missions/data/badgeCatalog'

/**
 * Mock mission repository for unit tests and local development.
 * Uses the local mission catalog to generate deterministic mission data.
 * Tracks completion state so getMissionHistory() returns truthful mock data.
 */
export class MockMissionRepository implements IMissionRepository {
  private _lastPreview: MissionPreview | null = null
  private _history: MissionHistoryItem[] = []
  private _completionCount = 0
  private _earnedBadgeIds = new Set<string>()

  async getWeatherAdaptiveMission(input: WeatherAdaptiveMissionQueryInput): Promise<MissionPreview> {
    // Derive outdoor safety: clear sky (0) or partly cloudy (1-3) during day
    const isOutdoorSafe = input.isDay && input.weatherCode <= 3
    const templates = getTemplatesByEnvironment(isOutdoorSafe)
    const chosen = templates[Math.floor(Math.random() * templates.length)]!

    const preview: MissionPreview = {
      backendId: -1, // fake backend ID in mock mode
      title: chosen.title,
      description: chosen.description,
      steps: chosen.steps,
      durationMinutes: chosen.durationMinutes,
      pointsValue: chosen.pointsValue,
      isOutdoor: chosen.environment === 'outdoor',
      isDayOnly: false,
      typeName: 'Nature',
    }
    this._lastPreview = preview
    return preview
  }

  async assignMission(_input: AssignMissionInput): Promise<{ profileMissionId: number }> {
    return { profileMissionId: -1 }
  }

  async startMission(_profileMissionId: number): Promise<void> {
    // no-op in mock
  }

  async getMissionHistory(): Promise<MissionHistoryItem[]> {
    return this._history.slice(0, 3)
  }

  async completeMission(_profileMissionId: number): Promise<MissionCompleteResult> {
    this._completionCount++

    // Record history entry from the last fetched preview
    if (this._lastPreview) {
      this._history.unshift({
        missionId: this._lastPreview.backendId,
        title: this._lastPreview.title,
        typeName: this._lastPreview.typeName,
        pointsEarned: this._lastPreview.pointsValue,
        isOutdoor: this._lastPreview.isOutdoor,
        completedAt: new Date().toISOString(),
      })
    }

    // Compute newly unlocked badges using local milestone logic (mock only)
    const alreadyEarned = Array.from(this._earnedBadgeIds)
    const newBadgeDefs = getNewlyUnlockedBadges(this._completionCount, alreadyEarned)
    for (const b of newBadgeDefs) {
      this._earnedBadgeIds.add(b.id)
    }

    return {
      totalPoints: 0,
      newLevel: 1,
      leveledUp: false,
      newFactsUnlocked: 0,
      newBadges: newBadgeDefs.map((b) => ({
        badgeName: b.title,
        badgeImageUrl: '',
        description: b.description,
      })),
    }
  }

  /** Reset state — useful for test teardown */
  reset(): void {
    this._lastPreview = null
    this._history = []
    this._completionCount = 0
    this._earnedBadgeIds = new Set()
  }
}
