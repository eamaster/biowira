// ============================================================
// BioWira Game Journal Domain Types
// Shared types for the unified game journal system.
// ============================================================

export type GameJournalCategoryId = 'nature-mission' | 'eco-comic' | 'explorer-rescue-run'

export interface GameJournalStampDefinition {
  stampId: string
  title: string
  description: string
  categoryId: GameJournalCategoryId
  /** Leaf points awarded when this ending is first completed (eco-comic specific) */
  leafPoints?: number
  /** When true, this stamp counts toward the unified rainforest restoration percentage */
  availableForRestoration: boolean
  /** Eco-Comic: which story this stamp belongs to */
  storyId?: string
  /** Eco-Comic: which story ending unlocks this stamp */
  endingId?: string
  /**
   * When false, excluded from the journal menu category “x/y stamps” chip on featured missions.
   * Still counts toward restoration when {@link availableForRestoration} is true.
   */
  journalMenuProgress?: boolean
}

export interface GameJournalCategoryDefinition {
  id: GameJournalCategoryId
  title: string
  description: string
  /** Emoji fallback for category icon */
  icon: string
  /** When set, used as the green CTA label on the category stamp page (bottom bar). */
  stampPageCtaLabel?: string
}

/**
 * One completed-game record stored per profile.
 * Records are append-only history; stamps are deduplicated separately.
 */
export interface GameJournalRecord {
  /** UUID generated at record time */
  id: string
  categoryId: GameJournalCategoryId
  /** e.g. mission id, rescue animal id, or storyId+endingId for eco-comic */
  sourceId: string
  title: string
  description: string
  /** ISO date string */
  completedAt: string
  leafPointsEarned: number
  stampId: string
  stampTitle: string
  stampDescription: string
  /** Optional icon/asset key — may be undefined if no image exists yet */
  stampAssetKey?: string
  /** Unified rainforest restoration % BEFORE this session (fixed at record time) */
  restorationPercentBefore: number
  /** Unified rainforest restoration % AFTER this record was created (fixed at record time) */
  restorationPercentAfter: number
  /**
   * How much restoration this specific session added.
   * 0 for replays / when stamp was already unlocked.
   */
  restorationPercentDelta: number
  /** Category-specific extra data for richer display */
  metadata: GameJournalRecordMetadata
}

export interface GameJournalRecordMetadata {
  // Nature Mission
  missionTitle?: string
  missionType?: string
  missionEnvironment?: string
  missionDurationMinutes?: number
  // Eco-Comic
  storyId?: string
  storyTitle?: string
  endingId?: string
  endingName?: string
  branchPath?: string
  // Explorer Rescue Run
  rescueAnimalName?: string
  wildMatchName?: string
  /** Canonical clue ids (`diet_omnivore`, …) — preferred for journal badge sprites. */
  sharedTraitIds?: string[]
  sharedTraitLabels?: string[]
  isFirstCompletion?: boolean
}

/**
 * Input to gameJournalStore.recordGameCompletion().
 * The store computes derived fields (restoration %, timestamps, etc.).
 */
export interface GameJournalCompletionInput {
  categoryId: GameJournalCategoryId
  /** Stable unique source identifier (mission id, animal id, storyId_endingId) */
  sourceId: string
  title: string
  description: string
  leafPointsEarned: number
  stampId: string
  /** Optional override for completedAt ISO string (defaults to now) */
  completedAt?: string
  /** Optional asset key for the stamp image (resolved by registry) */
  stampAssetKey?: string
  metadata?: GameJournalRecordMetadata
}

/** Persisted state shape written to localStorage via storageService */
export interface GameJournalState {
  profileId: string
  /** Append-only completion history (may include replays) */
  records: GameJournalRecord[]
  /** Deduplicated set of stamp IDs that have been unlocked at least once */
  unlockedStampIds: string[]
  updatedAt: string
}
