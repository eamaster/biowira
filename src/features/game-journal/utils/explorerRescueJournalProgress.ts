import type { GameJournalRecord } from '@/domain/gameJournal'
import {
  EXPLORER_RESCUE_RUN_CATALOG,
  findExplorerRescueRunByAnimalId,
  findExplorerRescueRunById,
  type ExplorerRescueRunCatalogItem,
} from '@/features/explorer-rescue-run/data/explorerRescueRunCatalog'

/** Resolve which demo rescue run a journal history row belongs to. */
export function resolveExplorerRescueRunFromJournalRecord(
  record: Pick<GameJournalRecord, 'sourceId' | 'title' | 'metadata'>,
): ExplorerRescueRunCatalogItem | undefined {
  const source = (record.sourceId ?? '').trim()
  if (source) {
    const byRunId = findExplorerRescueRunById(source)
    if (byRunId) return byRunId
    const byAnimalId = findExplorerRescueRunByAnimalId(source)
    if (byAnimalId) return byAnimalId
  }

  const rescueName = String(record.metadata?.rescueAnimalName ?? '').trim()
  if (rescueName) {
    const byName = EXPLORER_RESCUE_RUN_CATALOG.find(
      (run) => run.animalName.toLowerCase() === rescueName.toLowerCase(),
    )
    if (byName) return byName
  }

  const titleAnimal = (record.title ?? '')
    .trim()
    .replace(/\s+wild\s+match\s*$/i, '')
    .trim()
  if (titleAnimal) {
    const byTitle = EXPLORER_RESCUE_RUN_CATALOG.find(
      (run) => run.animalName.toLowerCase() === titleAnimal.toLowerCase(),
    )
    if (byTitle) return byTitle
  }

  return undefined
}

/** Unique catalog run ids finished according to Explorer Rescue journal history. */
export function collectExplorerRescueCompletedRunIdsFromRecords(
  records: readonly GameJournalRecord[],
): Set<string> {
  const runIds = new Set<string>()
  for (const record of records) {
    if (record.categoryId !== 'explorer-rescue-run') continue
    const run = resolveExplorerRescueRunFromJournalRecord(record)
    if (run) runIds.add(run.id)
  }
  return runIds
}

/** Unique journal stamp ids earned from Explorer Rescue history (source of truth for x/y chip). */
export function collectExplorerRescueStampIdsFromRecords(
  records: readonly GameJournalRecord[],
): Set<string> {
  const stampIds = new Set<string>()
  for (const record of records) {
    if (record.categoryId !== 'explorer-rescue-run') continue
    const run = resolveExplorerRescueRunFromJournalRecord(record)
    if (run) {
      stampIds.add(run.journalStampId)
      continue
    }
    if (record.stampId) stampIds.add(record.stampId)
  }
  return stampIds
}
