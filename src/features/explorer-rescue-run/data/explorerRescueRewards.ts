// ── Explorer Rescue Run — Shared Reward Constants ─────────────────────────────
//
// Single source of truth for all reward values used across:
//   - explorerRescueRoundBuilder.ts (round building)
//   - explorerRescueProgress.ts store (authoritative reward recording)
//   - ExplorerRescueScene.ts (result construction)
//
// Do NOT hardcode these values anywhere else in the feature.

export const DEFAULT_RESCUE_REWARDS = {
  firstCompletionLeafPoints: 50,
  replayLeafPoints: 5,
  restorationIncrease: 15,
  /** Fallback / legacy static rounds; live rounds override via {@link loadExplorerRescueRound}. */
  journalStamp: 'wild-match-finder',
} as const

export type RescueRewards = typeof DEFAULT_RESCUE_REWARDS
