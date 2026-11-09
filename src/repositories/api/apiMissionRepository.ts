import { apiClient } from '@/services/apiClient'
import type { IMissionRepository } from '../interfaces'
import type {
  AssignMissionInput,
  AssignMissionResponseDto,
  MissionCompleteResult,
  MissionHistoryItem,
  MissionHistoryItemDto,
  MissionPreview,
  RewardProgressDto,
  WeatherAdaptiveMissionDto,
  WeatherAdaptiveMissionQueryInput,
} from '@/domain/missionApi.dto'
import {
  mapMissionHistoryItemDto,
  mapWeatherAdaptiveMissionDto,
} from '@/domain/missionApi.dto'

export class ApiMissionRepository implements IMissionRepository {
  async getWeatherAdaptiveMission(input: WeatherAdaptiveMissionQueryInput): Promise<MissionPreview> {
    const params = new URLSearchParams({
      weatherCode: String(input.weatherCode),
      isDay: String(input.isDay),
    })
    const dto = await apiClient.get<WeatherAdaptiveMissionDto>(
      `/missions/weather-adaptive?${params.toString()}`,
    )
    return mapWeatherAdaptiveMissionDto(dto)
  }

  async assignMission(input: AssignMissionInput): Promise<{ profileMissionId: number }> {
    const dto = await apiClient.post<AssignMissionResponseDto>('/missions/assign', {
      missionId: input.missionId,
      weatherCode: input.weatherCode,
      isDay: input.isDay,
      weatherTemp: input.weatherTemp,
      locationLat: input.locationLat,
      locationLon: input.locationLon,
    })
    return { profileMissionId: dto.profileMissionId }
  }

  async startMission(profileMissionId: number): Promise<void> {
    await apiClient.post<void>('/missions/start', { profileMissionId })
  }

  async getMissionHistory(): Promise<MissionHistoryItem[]> {
    const dtos = await apiClient.get<MissionHistoryItemDto[]>('/missions/history')
    return dtos.map(mapMissionHistoryItemDto)
  }

  async completeMission(profileMissionId: number): Promise<MissionCompleteResult> {
    const dto = await apiClient.post<RewardProgressDto>('/missions/complete', { profileMissionId })
    return {
      totalPoints: dto.totalPoints,
      newLevel: dto.newLevel,
      leveledUp: dto.leveledUp,
      newFactsUnlocked: dto.newFactsUnlocked,
      newBadges: dto.newBadges,
    }
  }
}
