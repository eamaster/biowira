import { describe, it, expect } from 'vitest'
import type { GameJournalRecord } from '@/domain/gameJournal'
import {
  buildEcoComicStampDefsForRecordAtIndex,
  sortEcoComicRecordsChronologically,
} from '@/features/game-journal/utils/ecoComicJournalStampProgress'

function rec(
  id: string,
  stampId: string,
  completedAt: string,
): GameJournalRecord {
  return {
    id,
    categoryId: 'eco-comic',
    sourceId: 's',
    title: 't',
    description: 'd',
    completedAt,
    leafPointsEarned: 10,
    stampId,
    stampTitle: '',
    stampDescription: '',
    restorationPercentBefore: 0,
    restorationPercentAfter: 10,
    restorationPercentDelta: 10,
    metadata: {},
  }
}

describe('sortEcoComicRecordsChronologically', () => {
  it('orders by completedAt ascending', () => {
    const a = rec('1', 'family-team-hero', '2024-01-02T00:00:00.000Z')
    const b = rec('2', 'pangolin-guardian', '2024-01-01T00:00:00.000Z')
    expect(sortEcoComicRecordsChronologically([a, b]).map((r) => r.id)).toEqual(['2', '1'])
  })
})

describe('buildEcoComicStampDefsForRecordAtIndex', () => {
  const chronological = [
    rec('1', 'family-team-hero', '2024-01-01T00:00:00.000Z'),
    rec('2', 'pangolin-guardian', '2024-01-02T00:00:00.000Z'),
  ]

  it('page 0 unlocks only stamps from first session', () => {
    const defs = buildEcoComicStampDefsForRecordAtIndex(chronological, 0)
    const byId = Object.fromEntries(defs.map((d) => [d.stampId, d.isUnlocked]))
    expect(byId['family-team-hero']).toBe(true)
    expect(byId['pangolin-guardian']).toBe(false)
    expect(byId['wildlife-secret-agent']).toBe(false)
  })

  it('page 1 unlocks cumulative stamps from first two sessions', () => {
    const defs = buildEcoComicStampDefsForRecordAtIndex(chronological, 1)
    const byId = Object.fromEntries(defs.map((d) => [d.stampId, d.isUnlocked]))
    expect(byId['family-team-hero']).toBe(true)
    expect(byId['pangolin-guardian']).toBe(true)
    expect(byId['wildlife-secret-agent']).toBe(false)
  })
})
