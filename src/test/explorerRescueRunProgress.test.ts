import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { GameJournalRecord } from '@/domain/gameJournal'
import { STORAGE_KEYS } from '@/app/config'
import {
  countCompletedExplorerRescueCatalogRuns,
  isExplorerRescueCatalogRunComplete,
  isExplorerRescueRunFirstCompletion,
  normalizeExplorerRescueCompletedIds,
  resolveExplorerRescueRunCompletionKeyFromResult,
} from '@/features/explorer-rescue-run/data/explorerRescueRunProgress'
import { EXPLORER_RESCUE_RUN_CATALOG } from '@/features/explorer-rescue-run/data/explorerRescueRunCatalog'
import { loadProgress, saveProgress } from '@/features/explorer-rescue-run/utils/explorerRescueStorage'
import { DEFAULT_EXPLORER_RESCUE_PROGRESS } from '@/features/explorer-rescue-run/game/types'
import { storageService } from '@/services/storageService'

vi.mock('@/services/storageService', () => ({
  storageService: {
    get: vi.fn((key: string) => {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (!parsed || parsed.v !== 1) return null
        return parsed.data
      } catch {
        return null
      }
    }),
    set: vi.fn((key: string, value: unknown) => {
      localStorage.setItem(key, JSON.stringify({ v: 1, data: value }))
    }),
    remove: vi.fn((key: string) => {
      localStorage.removeItem(key)
    }),
  },
}))

function rescueJournalRecord(
  partial: Partial<GameJournalRecord> & Pick<GameJournalRecord, 'id'>,
): GameJournalRecord {
  return {
    categoryId: 'explorer-rescue-run',
    sourceId: '',
    title: '',
    description: '',
    completedAt: '2026-01-01T00:00:00.000Z',
    leafPointsEarned: 50,
    stampId: 'wild-match-finder',
    stampTitle: '',
    stampDescription: '',
    restorationPercentBefore: 0,
    restorationPercentAfter: 0,
    restorationPercentDelta: 0,
    metadata: {},
    ...partial,
  }
}

describe('explorerRescueRunProgress', () => {
  const frog = EXPLORER_RESCUE_RUN_CATALOG[0]!
  const bear = EXPLORER_RESCUE_RUN_CATALOG[1]!

  it('counts catalog runs when completed keys are API ids with matching visualKey', () => {
    const completed = ['discovery-api-frog-99', 'discovery-api-bear-42']
    expect(isExplorerRescueCatalogRunComplete(frog, completed)).toBe(false)
    expect(countCompletedExplorerRescueCatalogRuns(completed)).toBe(0)
  })

  it('counts catalog runs when keys are canonical catalog ids', () => {
    expect(countCompletedExplorerRescueCatalogRuns(['larut-torrent-frog', 'sun-bear'])).toBe(2)
  })

  it('resolveExplorerRescueRunCompletionKeyFromResult prefers rescueRunCatalogId', () => {
    expect(
      resolveExplorerRescueRunCompletionKeyFromResult({
        rescueRunCatalogId: 'sun-bear',
        explorerAnimalId: 'backend-uuid',
        explorerVisualKey: 'sun-bear',
      }),
    ).toBe('sun-bear')
  })

  it('normalizeExplorerRescueCompletedIds merges journal history for legacy API-only saves', () => {
    const journal = [
      rescueJournalRecord({
        id: 'frog',
        metadata: { rescueAnimalName: 'Larut Torrent Frog' },
      }),
      rescueJournalRecord({
        id: 'bear',
        metadata: { rescueAnimalName: 'Sun Bear' },
      }),
    ]
    const normalized = normalizeExplorerRescueCompletedIds(['opaque-api-id-1'], journal)
    expect(normalized).toEqual(expect.arrayContaining(['larut-torrent-frog', 'sun-bear']))
    expect(normalized).toHaveLength(2)
  })

  it('isExplorerRescueRunFirstCompletion uses catalog run id', () => {
    expect(isExplorerRescueRunFirstCompletion(['larut-torrent-frog'], 'sun-bear')).toBe(true)
    expect(isExplorerRescueRunFirstCompletion(['larut-torrent-frog', 'sun-bear'], 'sun-bear')).toBe(
      false,
    )
  })
})

describe('explorerRescueStorage loadProgress migration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('backfills completedExplorerIds from journal when persisted keys are unmapped API ids', () => {
    const profileId = 'profile-migrate'
    storageService.set(STORAGE_KEYS.gameJournalState(profileId), {
      profileId,
      records: [
        rescueJournalRecord({
          id: 'frog',
          metadata: { rescueAnimalName: 'Larut Torrent Frog' },
        }),
        rescueJournalRecord({
          id: 'bear',
          metadata: { rescueAnimalName: 'Sun Bear' },
        }),
      ],
      unlockedStampIds: [],
      updatedAt: '',
    })
    saveProgress({
      ...DEFAULT_EXPLORER_RESCUE_PROGRESS(profileId),
      completedExplorerIds: ['opaque-backend-frog', 'opaque-backend-bear'],
    })

    const loaded = loadProgress(profileId)
    expect(countCompletedExplorerRescueCatalogRuns(loaded.completedExplorerIds)).toBe(2)
  })
})
