// ============================================================
// BioWira Animal Fun Fact Unlock Store (Demo)
//
// Tracks which of the 3 demo animals have had their fun facts
// unlocked by completing a quiz. Unlock state is per-profile
// and persisted via storageService.
//
// DEMO ONLY: Limited to the 3 configured animals.
// Normal fun-fact access is still level-gated via the backend.
// ============================================================

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { storageService } from '@/services/storageService'
import { STORAGE_KEYS } from '@/app/config'
import { useSessionStore } from './sessionStore'
import {
  normalizeDemoFunFactAnimalId,
  isDemoFunFactUnlockAnimal,
  resolveDemoFunFactUnlockAnimal,
} from '@/domain/demoFunFactUnlocks'

export const useAnimalFunFactUnlockStore = defineStore('animalFunFactUnlock', () => {
  const sessionStore = useSessionStore()

  // ── State ─────────────────────────────────────────────────────────────────

  /** Canonical IDs of demo animals whose facts have been unlocked for the active profile. */
  const unlockedAnimalIds = ref<Set<string>>(new Set())

  // ── Helpers ───────────────────────────────────────────────────────────────

  function activeProfileId(): string | null {
    return sessionStore.activeProfile?.profileId ?? null
  }

  function storageKey(profileId: string): string {
    return STORAGE_KEYS.demoUnlockedFunFactAnimals(profileId)
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Load the unlock set for the currently active profile from storage. */
  function hydrateForActiveProfile(): void {
    const profileId = activeProfileId()
    if (!profileId) {
      unlockedAnimalIds.value = new Set()
      return
    }
    const stored = storageService.get<string[]>(storageKey(profileId)) ?? []
    unlockedAnimalIds.value = new Set(stored.filter((id) => isDemoFunFactUnlockAnimal(id)))
  }

  /**
   * Unlock all fun facts for a given animal (demo only).
   * Accepts any resolvable input — visual key, common name, canonical ID.
   * No-op for animals not in the 3 demo unlock list.
   */
  function unlockAnimalFacts(
    animalInput: string | { animalId?: string | null; animalName?: string | null; animalVisualKey?: string | null; scientificName?: string | null },
  ): void {
    const profileId = activeProfileId()
    if (!profileId) return

    const canonicalId =
      typeof animalInput === 'string'
        ? normalizeDemoFunFactAnimalId(animalInput)
        : (resolveDemoFunFactUnlockAnimal(animalInput)?.canonicalId ?? null)

    if (!canonicalId) return

    const updated = new Set(unlockedAnimalIds.value)
    updated.add(canonicalId)
    unlockedAnimalIds.value = updated

    const stored = [...updated]
    storageService.set(storageKey(profileId), stored)
  }

  /**
   * Whether the given animal's facts have been unlocked by quiz completion (demo).
   * Accepts any resolvable input.
   */
  function isAnimalFactsUnlocked(
    animalInput: string | { animalId?: string | null; animalName?: string | null; animalVisualKey?: string | null; scientificName?: string | null },
  ): boolean {
    const canonicalId =
      typeof animalInput === 'string'
        ? normalizeDemoFunFactAnimalId(animalInput)
        : (resolveDemoFunFactUnlockAnimal(animalInput)?.canonicalId ?? null)

    if (!canonicalId) return false
    return unlockedAnimalIds.value.has(canonicalId)
  }

  /**
   * Whether the given animal is eligible for demo quiz unlock (one of the 3 configured animals).
   */
  function isDemoUnlockEligible(
    animalInput: string | { animalId?: string | null; animalName?: string | null; animalVisualKey?: string | null; scientificName?: string | null },
  ): boolean {
    if (typeof animalInput === 'string') {
      return isDemoFunFactUnlockAnimal(animalInput)
    }
    return resolveDemoFunFactUnlockAnimal(animalInput) !== null
  }

  /** Clear the unlock set for the active profile (useful for tests). */
  function resetForActiveProfile(): void {
    const profileId = activeProfileId()
    if (profileId) {
      storageService.remove(storageKey(profileId))
    }
    unlockedAnimalIds.value = new Set()
  }

  // ── Watchers ──────────────────────────────────────────────────────────────

  watch(
    () => sessionStore.activeProfile?.profileId,
    (newId, oldId) => {
      if (newId !== oldId) {
        hydrateForActiveProfile()
      }
    },
    { immediate: true },
  )

  return {
    unlockedAnimalIds,
    hydrateForActiveProfile,
    unlockAnimalFacts,
    isAnimalFactsUnlocked,
    isDemoUnlockEligible,
    resetForActiveProfile,
  }
})
