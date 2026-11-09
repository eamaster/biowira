import type { GameJournalRecord } from '@/domain/gameJournal'
import { collectExplorerRescueCompletedRunIdsFromRecords } from '@/features/game-journal/utils/explorerRescueJournalProgress'
import {
  EXPLORER_RESCUE_RUN_CATALOG,
  findExplorerRescueRunByAnimalId,
  findExplorerRescueRunById,
  type ExplorerRescueRunCatalogItem,
} from './explorerRescueRunCatalog'
import type { ExplorerRescueResult } from '../game/types'

/** Whether a catalog rescue run is in the player's completed list (any legacy key shape). */
export function isExplorerRescueCatalogRunComplete(
  run: ExplorerRescueRunCatalogItem,
  completedKeys: readonly string[],
): boolean {
  return completedKeys.some((key) => findExplorerRescueRunByAnimalId(key)?.id === run.id)
}

/** Count of finished demo runs for the chapter hub chip (0–catalog length). */
export function countCompletedExplorerRescueCatalogRuns(completedKeys: readonly string[]): number {
  return EXPLORER_RESCUE_RUN_CATALOG.filter((run) =>
    isExplorerRescueCatalogRunComplete(run, completedKeys),
  ).length
}

/** Stable key to persist — always the catalog run id when the session maps to a demo run. */
export function resolveExplorerRescueRunCompletionKeyFromResult(
  result: Pick<ExplorerRescueResult, 'rescueRunCatalogId' | 'explorerAnimalId' | 'explorerVisualKey'>,
): string {
  const fromRoute = findExplorerRescueRunById(result.rescueRunCatalogId)
  if (fromRoute) return fromRoute.id

  const fromAnimal = findExplorerRescueRunByAnimalId(result.explorerAnimalId)
  if (fromAnimal) return fromAnimal.id

  const vk = (result.explorerVisualKey ?? '').trim()
  if (vk) {
    const fromVisualKey = EXPLORER_RESCUE_RUN_CATALOG.find(
      (r) => r.visualKey === vk || r.animalId === vk || r.id === vk,
    )
    if (fromVisualKey) return fromVisualKey.id
  }

  return result.explorerAnimalId
}

export function isExplorerRescueRunFirstCompletion(
  completedKeys: readonly string[],
  catalogRunId: string,
): boolean {
  const run = findExplorerRescueRunById(catalogRunId)
  if (run) return !isExplorerRescueCatalogRunComplete(run, completedKeys)
  return !completedKeys.includes(catalogRunId)
}

/**
 * Normalize persisted completion keys to catalog run ids and merge journal history
 * (covers API-only animal ids and older saves).
 */
export function normalizeExplorerRescueCompletedIds(
  completedKeys: readonly string[],
  journalRecords: readonly GameJournalRecord[] = [],
): string[] {
  const out = new Set<string>()

  for (const key of completedKeys) {
    const run = findExplorerRescueRunByAnimalId(key)
    if (run) out.add(run.id)
  }

  for (const runId of collectExplorerRescueCompletedRunIdsFromRecords(journalRecords)) {
    out.add(runId)
  }

  return [...out]
}
