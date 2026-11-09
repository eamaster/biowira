// ============================================================
// BioWira Game Journal Store
//
// Unified store for all game completion records and stamps.
// Uses storageService exclusively — never touches localStorage directly.
// Rainforest restoration % is computed dynamically from the
// stamp catalog denominator, so it auto-adjusts as new stamps
// are added to gameJournalCatalog.ts.
// ============================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  GameJournalState,
  GameJournalRecord,
  GameJournalCompletionInput,
  GameJournalCategoryId,
} from '@/domain/gameJournal'
import type { GameJournalStampDefinition } from '@/domain/gameJournal'
import {
  GAME_JOURNAL_STAMP_CATALOG,
  GAME_JOURNAL_CATEGORIES,
  TOTAL_AVAILABLE_STAMPS,
  getStampById,
  getStampsByCategory,
  getStampsForJournalMenuTally,
} from '@/features/game-journal/data/gameJournalCatalog'
import { getNatureMissionJournalStampIdFromTitle } from '@/features/game-journal/data/journalMissionMapping'
import { getExplorerRescueJournalStampIdForAnimalId } from '@/features/explorer-rescue-run/data/explorerRescueRunCatalog'
import { loadProgress as loadExplorerRescueProgress } from '@/features/explorer-rescue-run/utils/explorerRescueStorage'
import {
  collectExplorerRescueStampIdsFromRecords,
  resolveExplorerRescueRunFromJournalRecord,
} from '@/features/game-journal/utils/explorerRescueJournalProgress'
import { STORAGE_KEYS } from '@/app/config'
import { storageService } from '@/services/storageService'
import { useSessionStore } from './sessionStore'

// ── Helpers ────────────────────────────────────────────────────────────────────

function blankState(profileId: string): GameJournalState {
  return {
    profileId,
    records: [],
    unlockedStampIds: [],
    updatedAt: new Date().toISOString(),
  }
}

/** Migrate a persisted record that may be missing before/delta fields (backward compat). */
function migrateRecord(r: GameJournalRecord): GameJournalRecord {
  const after = r.restorationPercentAfter ?? 0
  const before = r.restorationPercentBefore ?? 0
  return {
    ...r,
    restorationPercentAfter: after,
    restorationPercentBefore: before,
    restorationPercentDelta: r.restorationPercentDelta ?? Math.max(0, after - before),
  }
}

function migrateNatureMissionLegacyStamps(state: GameJournalState): GameJournalState {
  if (!state.unlockedStampIds.includes('nature-mission-helper')) return state

  const inferred = new Set<string>()
  for (const r of state.records) {
    if (r.categoryId !== 'nature-mission') continue
    inferred.add(getNatureMissionJournalStampIdFromTitle(r.metadata?.missionTitle ?? r.title))
  }

  const withoutHelper = state.unlockedStampIds.filter((id) => id !== 'nature-mission-helper')
  let unlocked = [...withoutHelper]
  for (const id of inferred) {
    if (!unlocked.includes(id)) unlocked = [...unlocked, id]
  }

  const hadOnlyHelper =
    inferred.size === 0 &&
    state.unlockedStampIds.length === 1 &&
    state.unlockedStampIds[0] === 'nature-mission-helper'
  if (hadOnlyHelper) {
    unlocked = ['nature-mission-helper']
  }

  return { ...state, unlockedStampIds: unlocked }
}

/**
 * Backfill per-animal Explorer Rescue stamps from history records.
 * Older sessions always wrote `wild-match-finder` even for Sun Bear, so players
 * with two journal pages could still show 1/2 until the correct stamp id is inferred
 * from `sourceId` (rescue animal id) via the run catalog.
 */
function migrateExplorerRescueStamps(
  state: GameJournalState,
  profileId: string,
): GameJournalState {
  const inferred = collectExplorerRescueStampIdsFromRecords(state.records)

  for (const animalId of loadExplorerRescueProgress(profileId).completedExplorerIds) {
    inferred.add(getExplorerRescueJournalStampIdForAnimalId(animalId))
  }

  if (inferred.size === 0) return state

  let unlocked = state.unlockedStampIds
  let changed = false
  for (const stampId of inferred) {
    if (!unlocked.includes(stampId)) {
      unlocked = [...unlocked, stampId]
      changed = true
    }
  }
  return changed ? { ...state, unlockedStampIds: unlocked } : state
}

function countUnlockedStampsForCategory(
  categoryId: GameJournalCategoryId,
  state: GameJournalState,
): number {
  const stamps = getStampsForJournalMenuTally(categoryId)
  if (categoryId === 'explorer-rescue-run') {
    const earned = collectExplorerRescueStampIdsFromRecords(state.records)
    return stamps.filter((s) => earned.has(s.stampId)).length
  }
  return stamps.filter((s) => state.unlockedStampIds.includes(s.stampId)).length
}

function applyPersistedMigrations(
  state: GameJournalState,
  profileId: string,
): GameJournalState {
  return migrateExplorerRescueStamps(migrateNatureMissionLegacyStamps(state), profileId)
}

function stampIdsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const setB = new Set(b)
  return a.every((id) => setB.has(id))
}

function safeParse(raw: GameJournalState | null, profileId: string): GameJournalState {
  if (!raw || typeof raw !== 'object') return blankState(profileId)
  const base: GameJournalState = {
    profileId: raw.profileId ?? profileId,
    records: Array.isArray(raw.records) ? raw.records.map(migrateRecord) : [],
    unlockedStampIds: Array.isArray(raw.unlockedStampIds) ? raw.unlockedStampIds : [],
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
  return applyPersistedMigrations(base, profileId)
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useGameJournalStore = defineStore('gameJournal', () => {
  const sessionStore = useSessionStore()

  const _state = ref<GameJournalState | null>(null)

  // ── Active profile id (falls back to 'guest' for no-session / test mode) ────

  const activeProfileId = computed(
    () => sessionStore.activeProfile?.profileId ?? 'guest',
  )

  // ── Load / save ───────────────────────────────────────────────────────────────

  function _load(): GameJournalState {
    const profileId = activeProfileId.value
    const key = STORAGE_KEYS.gameJournalState(profileId)

    if (_state.value?.profileId === profileId) {
      const migrated = applyPersistedMigrations(_state.value, profileId)
      if (!stampIdsEqual(_state.value.unlockedStampIds, migrated.unlockedStampIds)) {
        _state.value = migrated
        storageService.set(key, migrated)
      }
      return _state.value
    }

    const raw = storageService.get<GameJournalState>(key)
    const parsed = safeParse(raw, profileId)
    const priorIds = Array.isArray(raw?.unlockedStampIds) ? raw.unlockedStampIds : []
    _state.value = parsed
    if (raw && !stampIdsEqual(priorIds, parsed.unlockedStampIds)) {
      storageService.set(key, parsed)
    }
    return parsed
  }

  function _save(state: GameJournalState): void {
    _state.value = state
    const key = STORAGE_KEYS.gameJournalState(state.profileId)
    storageService.set(key, state)
  }

  // ── Computed ──────────────────────────────────────────────────────────────────

  /** All completion records for a given category, newest first. */
  const recordsByCategory = computed(
    () =>
      (categoryId: GameJournalCategoryId): GameJournalRecord[] => {
        const state = _load()
        return state.records
          .filter((r) => r.categoryId === categoryId)
          .slice()
          .sort(
            (a, b) =>
              new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
          )
      },
  )

  /** Whether any completed records exist for a category. */
  const hasCompletedRecords = computed(
    () =>
      (categoryId: GameJournalCategoryId): boolean => {
        const state = _load()
        return state.records.some((r) => r.categoryId === categoryId)
      },
  )

  /** All unlocked stamp IDs for the active profile. */
  const unlockedStampIds = computed((): string[] => _load().unlockedStampIds)

  /** Count of unlocked stamps that count toward restoration. */
  const unlockedStampCount = computed((): number => {
    const ids = unlockedStampIds.value
    return GAME_JOURNAL_STAMP_CATALOG.filter(
      (s) => s.availableForRestoration && ids.includes(s.stampId),
    ).length
  })

  /** Total stamps available in the current catalog. */
  const totalAvailableStampCount = computed((): number => TOTAL_AVAILABLE_STAMPS)

  /**
   * Unified rainforest restoration % for the active profile.
   * Computed as: unlockedAvailableStamps / totalAvailableStamps * 100.
   * Returns 0 when no stamps are unlocked.
   */
  const rainforestRestoredPercent = computed((): number => {
    if (TOTAL_AVAILABLE_STAMPS === 0) return 0
    return Math.round((unlockedStampCount.value / TOTAL_AVAILABLE_STAMPS) * 100)
  })

  /**
   * Data for category cards on the journal menu.
   * Includes completed count, unlocked stamp count, and category definition.
   */
  const categoryCardsData = computed(() => {
    const state = _load()
    return GAME_JOURNAL_CATEGORIES.map((cat) => {
      const stamps = getStampsForJournalMenuTally(cat.id)
      const unlockedCount = countUnlockedStampsForCategory(cat.id, state)
      const recordCount = state.records.filter(
        (r) => r.categoryId === cat.id,
      ).length
      return {
        ...cat,
        recordCount,
        unlockedStampCount: unlockedCount,
        totalStampCount: stamps.length,
        hasRecords: recordCount > 0,
      }
    })
  })

  /**
   * All stamp definitions for a category, annotated with locked/unlocked state.
   */
  const categoryStampDefinitions = computed(
    () =>
      (categoryId: GameJournalCategoryId): Array<GameJournalStampDefinition & { isUnlocked: boolean }> => {
        const state = _load()
        const explorerEarned =
          categoryId === 'explorer-rescue-run'
            ? collectExplorerRescueStampIdsFromRecords(state.records)
            : null
        return getStampsByCategory(categoryId).map((stamp) => ({
          ...stamp,
          isUnlocked: explorerEarned
            ? explorerEarned.has(stamp.stampId)
            : state.unlockedStampIds.includes(stamp.stampId),
        }))
      },
  )

  // ── Actions ───────────────────────────────────────────────────────────────────

  /**
   * Record a completed game activity in the journal.
   * - Always appends a history record.
   * - Unlocks the stamp only if not already unlocked (idempotent per stamp).
   * - Restoration % updates automatically from the stamp count.
   */
  function recordGameCompletion(input: GameJournalCompletionInput): GameJournalRecord {
    const state = _load()

    const stampIdForUnlock =
      input.categoryId === 'explorer-rescue-run'
        ? (resolveExplorerRescueRunFromJournalRecord({
            sourceId: input.sourceId,
            title: input.title,
            metadata: input.metadata ?? {},
          })?.journalStampId ??
          (input.sourceId
            ? getExplorerRescueJournalStampIdForAnimalId(input.sourceId)
            : input.stampId))
        : input.stampId

    const stampDef = getStampById(stampIdForUnlock) ?? getStampById(input.stampId)
    const stampTitle = stampDef?.title ?? stampIdForUnlock
    const stampDescription = stampDef?.description ?? ''

    const shouldUnlockStamp = input.metadata?.isFirstCompletion !== false
    const isNewStamp =
      shouldUnlockStamp && !state.unlockedStampIds.includes(stampIdForUnlock)
    const newUnlocked = isNewStamp
      ? [...state.unlockedStampIds, stampIdForUnlock]
      : state.unlockedStampIds

    // Compute restoration BEFORE this session (current unlocked count)
    const oldUnlockedCount = GAME_JOURNAL_STAMP_CATALOG.filter(
      (s) => s.availableForRestoration && state.unlockedStampIds.includes(s.stampId),
    ).length
    const restorationBefore =
      TOTAL_AVAILABLE_STAMPS > 0
        ? Math.round((oldUnlockedCount / TOTAL_AVAILABLE_STAMPS) * 100)
        : 0

    // Compute restoration AFTER this potential stamp unlock
    const newUnlockedCount = GAME_JOURNAL_STAMP_CATALOG.filter(
      (s) => s.availableForRestoration && newUnlocked.includes(s.stampId),
    ).length
    const restorationAfter =
      TOTAL_AVAILABLE_STAMPS > 0
        ? Math.round((newUnlockedCount / TOTAL_AVAILABLE_STAMPS) * 100)
        : 0

    const restorationDelta = restorationAfter - restorationBefore

    const record: GameJournalRecord = {
      id: crypto.randomUUID(),
      categoryId: input.categoryId,
      sourceId: input.sourceId,
      title: input.title,
      description: input.description,
      completedAt: input.completedAt ?? new Date().toISOString(),
      leafPointsEarned: input.leafPointsEarned,
      stampId: stampIdForUnlock,
      stampTitle,
      stampDescription,
      stampAssetKey: input.stampAssetKey,
      restorationPercentBefore: restorationBefore,
      restorationPercentAfter: restorationAfter,
      restorationPercentDelta: restorationDelta,
      metadata: input.metadata ?? {},
    }

    const updated: GameJournalState = migrateExplorerRescueStamps(
      {
        ...state,
        records: [record, ...state.records],
        unlockedStampIds: newUnlocked,
        updatedAt: new Date().toISOString(),
      },
      state.profileId,
    )

    _save(updated)
    return record
  }

  /** Get completion records for a category (alias for use outside computed). */
  function getRecordsForCategory(categoryId: GameJournalCategoryId): GameJournalRecord[] {
    return recordsByCategory.value(categoryId)
  }

  /** Whether any completion records exist for a category. */
  function hasRecords(categoryId: GameJournalCategoryId): boolean {
    return hasCompletedRecords.value(categoryId)
  }

  /**
   * Stamp count summary for a category.
   * Returns unlocked count, total count, and a human-readable label like "1/3 stamps".
   */
  function getStampCountForCategory(categoryId: GameJournalCategoryId): {
    unlockedStampCount: number
    totalStampCount: number
    label: string
  } {
    const state = _load()
    const stamps = getStampsForJournalMenuTally(categoryId)
    const unlocked = countUnlockedStampsForCategory(categoryId, state)
    const total = stamps.length
    return {
      unlockedStampCount: unlocked,
      totalStampCount: total,
      label: `${unlocked}/${total} stamp${total !== 1 ? 's' : ''}`,
    }
  }

  /** Force-reload state from storage (use when profile changes). */
  function reloadForProfile(profileId: string): void {
    const key = STORAGE_KEYS.gameJournalState(profileId)
    const raw = storageService.get<GameJournalState>(key)
    const parsed = safeParse(raw, profileId)
    const priorIds = Array.isArray(raw?.unlockedStampIds) ? raw.unlockedStampIds : []
    _state.value = parsed
    if (raw && !stampIdsEqual(priorIds, parsed.unlockedStampIds)) {
      storageService.set(key, parsed)
    }
  }

  /**
   * Reset state for tests.
   * Only callable in test environments — no-ops in production.
   */
  function _resetForTests(profileId = 'guest'): void {
    if (import.meta.env.MODE !== 'test' && import.meta.env.VITEST !== 'true') return
    const fresh = blankState(profileId)
    _save(fresh)
  }

  return {
    // Computed
    recordsByCategory,
    hasCompletedRecords,
    unlockedStampIds,
    unlockedStampCount,
    totalAvailableStampCount,
    rainforestRestoredPercent,
    categoryCardsData,
    categoryStampDefinitions,
    // Actions
    recordGameCompletion,
    getRecordsForCategory,
    hasRecords,
    getStampCountForCategory,
    reloadForProfile,
    _resetForTests,
  }
})
