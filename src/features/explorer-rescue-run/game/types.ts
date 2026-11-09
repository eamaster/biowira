// ── Explorer Rescue Run — shared types ───────────────────────────────────────

export type RescueTrait = {
  id: string
  label: string
  emoji: string
  /** Optional WebP icon path from the clue registry. Used by Vue badge and Phaser scene. */
  iconPath?: string
}

export type RescueChoice = {
  animalId: string
  name: string
  visualKey: string
  /** Emoji fallback for choice animal icon display. */
  fallbackEmoji?: string
  /**
   * The choice animal's own 3 traits (habitat, diet, group).
   * Always shown on the choice card before the player answers — never reveals
   * the correct answer count. Built from the centralized clue registry.
   */
  choiceTraits: RescueTrait[]
  /** IDs of traits shared with the explorer — used for result/game logic only. */
  sharedTraitIds: string[]
  isCorrect: boolean
  /** Backend discovery image URL for this choice animal. */
  imageUrl?: string
  /** Backend avatar/sprite path. */
  avatarPath?: string
  /** Resolved icon URL to use in Phaser/Vue icon display (discovery WEBP preferred). */
  iconUrl?: string
}

export type ExplorerRescueRound = {
  explorerAnimalId: string
  explorerName: string
  explorerVisualKey: string
  /** Emoji fallback for the explorer animal icon display. */
  explorerFallbackEmoji?: string
  clueTraits: RescueTrait[]
  choices: RescueChoice[]
  rewards: {
    firstCompletionLeafPoints: number
    replayLeafPoints: number
    restorationIncrease: number
    journalStamp: string
  }
  /**
   * Instruction text for the choosing panel.
   * When correct score is 3: "Pick the animal with the same habitat, diet, and group."
   * When correct score is less than 3: "Pick the animal with the best matching habitat, diet, and group."
   */
  matchInstruction?: string
}

export type ExplorerRescueResult = {
  profileId: string
  /** Canonical catalog id (`malayan-tiger`, …) — used by Play Again routing. Optional for older persisted saves. */
  rescueRunCatalogId?: string
  explorerAnimalId: string
  explorerName: string
  explorerVisualKey: string
  chosenMatchAnimalId: string
  chosenMatchName: string
  chosenMatchVisualKey: string
  isCorrect: boolean
  sharedTraits: RescueTrait[]
  pointsEarned: number
  restorationBefore: number
  restorationAfter: number
  journalStamp: string
  isFirstCompletion: boolean
  completedAt: string
}

export type ExplorerRescueProgress = {
  profileId: string
  rainforestRestored: number
  completedExplorerIds: string[]
  journalStamps: string[]
  latestResult?: ExplorerRescueResult
  updatedAt: string
}

export const DEFAULT_EXPLORER_RESCUE_PROGRESS = (profileId: string): ExplorerRescueProgress => ({
  profileId,
  rainforestRestored: 25,
  completedExplorerIds: [],
  journalStamps: [],
  updatedAt: new Date().toISOString(),
})

/** How Explorer Rescue resolves the Phaser runner texture (mirror with {@link resolveRescueExplorerPlayerIconResolution}). */
export type RescueExplorerPlayerTextureKind =
  | 'dedicated_gameplay'
  | 'discovery_raster'
  | 'explorer_svg'
  | 'none'

// ── Phaser game callbacks ─────────────────────────────────────────────────────
// onComplete is only called for CORRECT completions.
// wrongChoice events are handled directly by ExplorerRescueGamePage via
// scene.events — the factory must not route them through onComplete.
export type GameCallbacks = {
  onComplete: (result: ExplorerRescueResult) => void
  onReady: () => void
  onError: (error: Error) => void
}

export type GameConfig = {
  parent: HTMLElement
  round: ExplorerRescueRound
  rescueRunCatalogId: string
  profileId: string
  currentLeafPoints: number
  restorationBefore: number
  isFirstCompletion: boolean
  /** Resolved icon URL for the explorer animal — loaded by the Phaser scene preloader. */
  explorerIconUrl?: string
  /** Source of explorerIconUrl — used for runner mirror vs velocity (avoid guessing from URL suffix). */
  explorerPlayerTextureKind?: RescueExplorerPlayerTextureKind
  /**
   * When the Phaser runner uses a discovery raster spirit (`explorerPlayerTextureKind === 'discovery_raster'`),
   * flip scaleX conventions if that spirit faces the opposite horizontal direction vs the default authoring.
   * Set per catalog entry (see `ExplorerRescueRunCatalogItem`).
   */
  runnerDiscoveryMirrorInvert?: boolean
  callbacks: GameCallbacks
}
