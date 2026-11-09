import { apiClient } from '@/services/apiClient'
import type { IBadgeRepository } from '../interfaces'
import type { BackendBadge, BadgeCollectionItemDto } from '@/domain/badgeApi.dto'
import { mapBadgeCollectionItemDto } from '@/domain/badgeApi.dto'

export class ApiBadgeRepository implements IBadgeRepository {
  async getBadges(): Promise<BackendBadge[]> {
    const dtos = await apiClient.get<BadgeCollectionItemDto[]>('/badges')
    return dtos.map(mapBadgeCollectionItemDto)
  }
}
