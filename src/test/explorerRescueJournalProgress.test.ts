import { describe, it, expect } from 'vitest'
import {
  collectExplorerRescueCompletedRunIdsFromRecords,
  collectExplorerRescueStampIdsFromRecords,
  resolveExplorerRescueRunFromJournalRecord,
} from '@/features/game-journal/utils/explorerRescueJournalProgress'
import type { GameJournalRecord } from '@/domain/gameJournal'

function rescueRecord(
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

describe('explorerRescueJournalProgress', () => {
  it('resolves run from rescueAnimalName when sourceId is a legacy placeholder', () => {
    const run = resolveExplorerRescueRunFromJournalRecord({
      sourceId: 'malayan-tiger',
      title: 'Sun Bear Wild Match',
      metadata: { rescueAnimalName: 'Sun Bear' },
    })
    expect(run?.id).toBe('sun-bear')
    expect(run?.journalStampId).toBe('wild-match-sun-bear')
  })

  it('collects distinct catalog run ids for frog and sun bear history rows', () => {
    const runIds = collectExplorerRescueCompletedRunIdsFromRecords([
      rescueRecord({
        id: 'frog',
        sourceId: 'malayan-tiger',
        metadata: { rescueAnimalName: 'Larut Torrent Frog' },
      }),
      rescueRecord({
        id: 'bear',
        sourceId: 'malayan-tiger',
        metadata: { rescueAnimalName: 'Sun Bear' },
      }),
    ])
    expect(runIds).toEqual(new Set(['larut-torrent-frog', 'sun-bear']))
  })

  it('collects distinct stamp ids for frog and sun bear history rows', () => {
    const stampIds = collectExplorerRescueStampIdsFromRecords([
      rescueRecord({
        id: 'frog',
        sourceId: 'malayan-tiger',
        metadata: { rescueAnimalName: 'Larut Torrent Frog' },
      }),
      rescueRecord({
        id: 'bear',
        sourceId: 'malayan-tiger',
        metadata: { rescueAnimalName: 'Sun Bear' },
      }),
    ])
    expect(stampIds).toEqual(new Set(['wild-match-finder', 'wild-match-sun-bear']))
  })
})
