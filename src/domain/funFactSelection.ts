// ============================================================
// BioWira Fun Fact Selection Helpers
//
// Centralises the logic for picking which fact to display
// so that FunFactCard, FunFactModal and any future component
// all use the same consistent ordering.
//
// Display order precedence (ascending):
//   1. factOrder  — backend-controlled display rank
//   2. unlockLevel — secondary sort when factOrder ties
//   3. original array index — stable final tiebreak
// ============================================================

import type { FunFact } from './funFact'
import { resolveFunFactAccessState } from './funFactAccess'

/**
 * Return a new array of facts sorted for display.
 * Always factOrder first (lowest = first), then unlockLevel, then original index.
 */
export function sortFunFactsForDisplay(facts: FunFact[]): FunFact[] {
  return facts.map((f, i) => ({ f, i })).sort((a, b) => {
    const aOrder = a.f.factOrder ?? Infinity
    const bOrder = b.f.factOrder ?? Infinity
    if (aOrder !== bOrder) return aOrder - bOrder

    const aLevel = a.f.unlockLevel ?? 1
    const bLevel = b.f.unlockLevel ?? 1
    if (aLevel !== bLevel) return aLevel - bLevel

    return a.i - b.i
  }).map(({ f }) => f)
}

/**
 * Pick the first fact that is accessible to the current profile,
 * ordered by factOrder → unlockLevel → original index.
 *
 * Returns null when the list is empty or all facts are locked.
 * In 'unknown' state (mock mode) every fact is treated as unlocked.
 */
export function pickPrimaryUnlockedFact(facts: FunFact[]): FunFact | null {
  for (const fact of sortFunFactsForDisplay(facts)) {
    const state = resolveFunFactAccessState(fact)
    const isUnlocked = state.status !== 'unknown' ? state.isUnlocked : true
    if (isUnlocked) return fact
  }
  return null
}

/**
 * Pick the first locked fact, ordered by factOrder → unlockLevel.
 * Used to drive the "Reach Level X" chip on locked cards.
 *
 * Returns null when the list is empty or all facts are unlocked.
 */
export function pickPrimaryLockedFact(facts: FunFact[]): FunFact | null {
  for (const fact of sortFunFactsForDisplay(facts)) {
    const state = resolveFunFactAccessState(fact)
    const isLocked = state.status !== 'unknown' ? !state.isUnlocked : false
    if (isLocked) return fact
  }
  return null
}
