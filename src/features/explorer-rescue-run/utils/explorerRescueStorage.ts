import { storageService } from '@/services/storageService'
import { STORAGE_KEYS } from '@/app/config'
import type { GameJournalState } from '@/domain/gameJournal'
import {
  isExplorerRescueRunFirstCompletion,
  normalizeExplorerRescueCompletedIds,
} from '../data/explorerRescueRunProgress'
import type { ExplorerRescueProgress } from '../game/types'
import { DEFAULT_EXPLORER_RESCUE_PROGRESS } from '../game/types'

function loadJournalRecords(profileId: string) {
  const raw = storageService.get<GameJournalState>(STORAGE_KEYS.gameJournalState(profileId))
  return Array.isArray(raw?.records) ? raw.records : []
}

function completedIdsChanged(before: readonly string[], after: readonly string[]): boolean {
  if (before.length !== after.length) return true
  const setAfter = new Set(after)
  return before.some((id) => !setAfter.has(id))
}

export function loadProgress(profileId: string): ExplorerRescueProgress {
  const key = STORAGE_KEYS.explorerRescueProgress(profileId)
  const raw = storageService.get<ExplorerRescueProgress>(key) ?? DEFAULT_EXPLORER_RESCUE_PROGRESS(profileId)
  const journalRecords = loadJournalRecords(profileId)
  const completedExplorerIds = normalizeExplorerRescueCompletedIds(
    raw.completedExplorerIds,
    journalRecords,
  )

  if (!completedIdsChanged(raw.completedExplorerIds, completedExplorerIds)) {
    return raw
  }

  const migrated: ExplorerRescueProgress = {
    ...raw,
    completedExplorerIds,
    updatedAt: new Date().toISOString(),
  }
  storageService.set(key, migrated)
  return migrated
}

export function saveProgress(progress: ExplorerRescueProgress): void {
  const key = STORAGE_KEYS.explorerRescueProgress(progress.profileId)
  storageService.set(key, { ...progress, updatedAt: new Date().toISOString() })
}

export function isFirstCompletion(profileId: string, catalogRunId: string): boolean {
  const progress = loadProgress(profileId)
  return isExplorerRescueRunFirstCompletion(progress.completedExplorerIds, catalogRunId)
}
