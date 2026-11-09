// ============================================================
// BioWira Fun Fact Access Resolver
//
// The live API no longer returns `isLocked`. The authoritative
// unlock signals are `accessStatus`, `levelsNeeded`, and `userLevel`.
// This resolver applies a strict precedence order.
//
// Precedence (highest → lowest):
//   1. accessStatus === "unlocked" / "locked"
//   2. levelsNeeded (locked when > 0)
//   3. userLevel vs unlockLevel comparison
//   4. isLocked (mock mode only — not present in live API responses)
//   5. 'unknown' → caller falls back to progressStore.level (mock mode)
// ============================================================

export type FunFactAccessStatus = 'unlocked' | 'locked' | 'unknown'

export interface FunFactAccessState {
  status: FunFactAccessStatus
  isUnlocked: boolean
  /** How many more levels are needed to unlock. 0 when unlocked. */
  levelsNeeded: number
}

/**
 * Resolve whether a fun fact is accessible for the current profile.
 *
 * The live API no longer returns `isLocked`. Rely on `accessStatus`,
 * `levelsNeeded`, and `userLevel` for authoritative resolution.
 * The `isLocked` parameter is retained for mock mode backward compat only.
 */
export function resolveFunFactAccessState(fact: {
  accessStatus?: string
  levelsNeeded?: number
  userLevel?: number
  unlockLevel?: number
  isLocked?: boolean
}): FunFactAccessState {
  // 1. accessStatus string is most reliable when present
  if (fact.accessStatus === 'unlocked') {
    return { status: 'unlocked', isUnlocked: true, levelsNeeded: 0 }
  }
  if (fact.accessStatus === 'locked') {
    const needed = fact.levelsNeeded != null && fact.levelsNeeded > 0 ? fact.levelsNeeded : 1
    return { status: 'locked', isUnlocked: false, levelsNeeded: needed }
  }

  // 2. levelsNeeded is explicit and unambiguous
  if (fact.levelsNeeded != null) {
    if (fact.levelsNeeded <= 0) {
      return { status: 'unlocked', isUnlocked: true, levelsNeeded: 0 }
    }
    return { status: 'locked', isUnlocked: false, levelsNeeded: fact.levelsNeeded }
  }

  // 3. Compare userLevel vs unlockLevel when both are present
  if (fact.userLevel != null && fact.unlockLevel != null) {
    const isUnlocked = fact.userLevel >= fact.unlockLevel
    const levelsNeeded = isUnlocked ? 0 : fact.unlockLevel - fact.userLevel
    return {
      status: isUnlocked ? 'unlocked' : 'locked',
      isUnlocked,
      levelsNeeded,
    }
  }

  // 4. isLocked as a weak fallback (mock mode only — not present in live API responses)
  if (fact.isLocked != null) {
    return {
      status: fact.isLocked ? 'locked' : 'unlocked',
      isUnlocked: !fact.isLocked,
      levelsNeeded: fact.isLocked ? 1 : 0,
    }
  }

  // 5. Unknown — no backend signal. Caller must supply level-based fallback (mock mode).
  return { status: 'unknown', isUnlocked: true, levelsNeeded: 0 }
}
