import { useFunFactStore } from '@/stores/funFactStore'
import { useProgressStore } from '@/stores/progressStore'
import { useSessionStore } from '@/stores/sessionStore'
import type { FunFact } from '@/domain/funFact'
import { resolveFunFactAccessState } from '@/domain/funFactAccess'

export function useFunFactUnlocks() {
  const funFactStore = useFunFactStore()
  const progressStore = useProgressStore()
  const sessionStore = useSessionStore()

  /**
   * Resolve whether a fact is unlocked for the current profile.
   *
   * Precedence (per resolveFunFactAccessState):
   *   1. accessStatus ("unlocked" / "locked")
   *   2. levelsNeeded (locked when > 0)
   *   3. userLevel vs unlockLevel
   *   4. isLocked (weak — backend bug: may be false when actually locked)
   *   5. unknown → local level fallback (mock mode only)
   */
  function isUnlocked(fact: FunFact): boolean {
    const state = resolveFunFactAccessState(fact)
    if (state.status !== 'unknown') return state.isUnlocked
    // Mock mode fallback: use client-side level
    return fact.unlockLevel <= progressStore.level
  }

  function levelsNeededToUnlock(fact: FunFact): number {
    const state = resolveFunFactAccessState(fact)
    if (state.status !== 'unknown') return state.levelsNeeded
    return Math.max(0, fact.unlockLevel - progressStore.level)
  }

  function isNewlyUnlocked(fact: FunFact): boolean {
    return funFactStore.newlyUnlockedFactIds.has(fact.id)
  }

  function acknowledgeUnlock(factId: string) {
    const profileId = sessionStore.activeProfile?.profileId
    if (profileId) {
      funFactStore.acknowledgeUnlock(factId, profileId)
    }
  }

  return {
    isUnlocked,
    levelsNeededToUnlock,
    isNewlyUnlocked,
    acknowledgeUnlock,
  }
}
