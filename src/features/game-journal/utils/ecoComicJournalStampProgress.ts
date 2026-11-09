import type { GameJournalRecord, GameJournalStampDefinition } from '@/domain/gameJournal'
import { getStampsByCategory } from '../data/gameJournalCatalog'

/**
 * Eco-comic journal pages are chronological: each spread reflects stamp progress only up to
 * that session, not the profile's current global unlock set.
 */
export function sortEcoComicRecordsChronologically(
  records: GameJournalRecord[],
): GameJournalRecord[] {
  return records.slice().sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
  )
}

export function buildEcoComicStampDefsForRecordAtIndex(
  chronologicalRecords: GameJournalRecord[],
  recordIndex: number,
): Array<GameJournalStampDefinition & { isUnlocked: boolean }> {
  const catalogStamps = getStampsByCategory('eco-comic')
  if (chronologicalRecords.length === 0 || recordIndex < 0) {
    return catalogStamps.map((stamp) => ({ ...stamp, isUnlocked: false }))
  }
  const end = Math.min(recordIndex, chronologicalRecords.length - 1)
  const cumulative = new Set<string>()
  for (let i = 0; i <= end; i++) {
    const r = chronologicalRecords[i]
    if (r) cumulative.add(r.stampId)
  }
  return catalogStamps.map((stamp) => ({
    ...stamp,
    isUnlocked: cumulative.has(stamp.stampId),
  }))
}
