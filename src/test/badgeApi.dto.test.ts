import { describe, it, expect } from 'vitest'
import { mapBadgeCollectionItemDto, type BadgeCollectionItemDto } from '@/domain/badgeApi.dto'

describe('badgeApi.dto — mapBadgeCollectionItemDto', () => {
  it('maps a fully-populated unlocked badge from Swagger response', () => {
    const dto: BadgeCollectionItemDto = {
      id: 1,
      badgeName: 'Nature Starter',
      badgeImageUrl: '/badges/nature-starter.png',
      description: 'Complete your first mission',
      badgeType: 'missions',
      levelRequired: 1,
      missionsRequired: 1,
      source: 'system',
      earnedAt: '2025-04-01T10:00:00.000Z',
      isUnlocked: true,
      currentLevel: 2,
      totalPoints: 250,
      totalMissions: 1,
      progressPercentage: 100,
    }
    const badge = mapBadgeCollectionItemDto(dto)

    expect(badge.badgeName).toBe('Nature Starter')
    expect(badge.isUnlocked).toBe(true)
    expect(badge.earnedAt).toBe('2025-04-01T10:00:00.000Z')
    expect(badge.progressPercentage).toBe(100)
    expect(badge.currentLevel).toBe(2)
    expect(badge.totalPoints).toBe(250)
    expect(badge.totalMissions).toBe(1)
    expect(badge.badgeType).toBe('missions')
    expect(badge.levelRequired).toBe(1)
    expect(badge.missionsRequired).toBe(1)
    expect(badge.source).toBe('system')
    expect(badge.id).toBe(1)
  })

  it('maps a locked badge with progressPercentage < 100', () => {
    const dto: BadgeCollectionItemDto = {
      id: 2,
      badgeName: 'Mission Expert',
      description: 'Complete 5 missions',
      badgeType: 'missions',
      missionsRequired: 5,
      earnedAt: null,
      isUnlocked: false,
      currentLevel: 1,
      totalPoints: 80,
      totalMissions: 0,
      progressPercentage: 0,
    }
    const badge = mapBadgeCollectionItemDto(dto)

    expect(badge.isUnlocked).toBe(false)
    expect(badge.earnedAt).toBeNull()
    expect(badge.progressPercentage).toBe(0)
    expect(badge.totalMissions).toBe(0)
  })

  it('preserves undefined optional fields', () => {
    const dto: BadgeCollectionItemDto = {
      badgeName: 'Minimal Badge',
      description: 'A badge',
      isUnlocked: false,
    }
    const badge = mapBadgeCollectionItemDto(dto)

    expect(badge.id).toBeUndefined()
    expect(badge.badgeImageUrl).toBeUndefined()
    expect(badge.badgeType).toBeUndefined()
    expect(badge.levelRequired).toBeUndefined()
    expect(badge.missionsRequired).toBeUndefined()
    expect(badge.source).toBeUndefined()
    expect(badge.earnedAt).toBeUndefined()
    expect(badge.currentLevel).toBeUndefined()
    expect(badge.totalPoints).toBeUndefined()
    expect(badge.totalMissions).toBeUndefined()
    expect(badge.progressPercentage).toBeUndefined()
  })

  it('does not use isEarned field — only isUnlocked is the Swagger contract field', () => {
    // Ensure the DTO and domain type do not have isEarned (old stale contract)
    const dto: BadgeCollectionItemDto = {
      badgeName: 'Test',
      description: 'desc',
      isUnlocked: true,
    }
    const badge = mapBadgeCollectionItemDto(dto)
    // isEarned must not exist on the domain model — only isUnlocked
    expect('isEarned' in badge).toBe(false)
    expect(badge.isUnlocked).toBe(true)
  })
})
