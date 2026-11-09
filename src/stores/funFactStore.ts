// ============================================================
// BioWira Fun Fact Store
// Fact-centric: grid shows one card per fun fact.
// ALL facts (locked + unlocked) are fetched eagerly on mount.
// Locked facts render as grayed-out cards so children can see
// what they'll unlock as they level up.
// All caches are keyed by session token to isolate profiles.
// ============================================================

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { AnimalListItem } from '@/domain/animal'
import type { FunFact } from '@/domain/funFact'
import { repositories } from '@/repositories'
import { storageService } from '@/services/storageService'
import { STORAGE_KEYS } from '@/app/config'
import { useSessionStore } from './sessionStore'
import { resolveFunFactAccessState } from '@/domain/funFactAccess'

export const useFunFactStore = defineStore('funFacts', () => {
  const sessionStore = useSessionStore()

  // ── State ──────────────────────────────────────────────────────────────────

  /** Animals (used as enrichment context for fact cards) */
  const animalList = ref<AnimalListItem[]>([])
  /** Per-animal facts. Key: `${sessionToken}:${animalId}` */
  const animalFactsCache = ref<Record<string, FunFact[]>>({})
  /** Which animalId is currently being fetched */
  const loadingAnimalFacts = ref<string | null>(null)
  /** True while fetchAllFacts() is running */
  const loadingAllFacts = ref(false)
  /** Newly unlocked fact IDs (for glow animation) */
  const newlyUnlockedFactIds = ref<Set<string>>(new Set())
  /** Currently open fact in the modal */
  const expandedFact = ref<FunFact | null>(null)

  const loadingAnimals = ref(false)
  const error = ref<string | null>(null)

  // ── Computed ──────────────────────────────────────────────────────────────

  const sortedAnimals = computed(() =>
    [...animalList.value].sort((a, b) => a.commonName.localeCompare(b.commonName)),
  )

  /**
   * All facts from all animals, sorted for display:
   *   1. unlockLevel ascending (easier-to-unlock facts first)
   *   2. factOrder ascending within the same unlockLevel
   *   3. original array index as a stable tiebreak
   *
   * Includes BOTH locked and unlocked facts so the full collection is visible.
   * Locked cards render grayed-out so children see what they'll unlock next.
   */
  const allFacts = computed<FunFact[]>(() => {
    const flat = Object.values(animalFactsCache.value).flat()
    return flat
      .map((f, i) => ({ f, i }))
      .sort((a, b) => {
        const aLevel = a.f.unlockLevel ?? 1
        const bLevel = b.f.unlockLevel ?? 1
        if (aLevel !== bLevel) return aLevel - bLevel
        const aOrder = a.f.factOrder ?? Infinity
        const bOrder = b.f.factOrder ?? Infinity
        if (aOrder !== bOrder) return aOrder - bOrder
        return a.i - b.i
      })
      .map(({ f }) => f)
  })

  // ── Session token (for cache keying) ────────────────────────────────────────

  function getCurrentToken(): string {
    return storageService.get<string>(STORAGE_KEYS.SESSION_TOKEN) ?? ''
  }

  function cacheKey(animalId: string): string {
    return `${getCurrentToken()}:${animalId}`
  }

  // ── Profile change invalidation ──────────────────────────────────────────────

  watch(
    () => sessionStore.activeProfile?.profileId,
    (newId, oldId) => {
      if (newId !== oldId) {
        // Clear all facts (personalised per explorer).
        // animalList can be re-used since it is not personalised.
        animalFactsCache.value = {}
        newlyUnlockedFactIds.value = new Set()
        expandedFact.value = null
        // Also clear the repository-level cache so the next getByAnimalId()
        // re-fetches with the new profile's session token.
        repositories.funFacts.clearCache()
      }
    },
  )

  // ── Level-change invalidation ─────────────────────────────────────────────────
  // Fun-fact access state (userLevel, accessStatus, isLocked, levelsNeeded) is
  // personalised to the current level. When the profile levels up (after quiz or
  // mission completion), the cached facts are stale and must be re-fetched.
  // This watcher fires whenever patchActiveProfile() updates the level field,
  // which happens in both quizStore.finishQuiz() and missionStore.completeMission().

  watch(
    () => sessionStore.activeProfile?.level,
    (newLevel, oldLevel) => {
      if (newLevel != null && oldLevel != null && newLevel !== oldLevel) {
        // Level changed — per-animal facts are now stale.
        // Clear both the store-level reactive cache AND the repository in-memory cache
        // so the next fetch returns fresh, level-accurate data from the backend.
        animalFactsCache.value = {}
        newlyUnlockedFactIds.value = new Set()
        repositories.funFacts.clearCache()
      }
    },
  )

  // ── Actions ──────────────────────────────────────────────────────────────────

  /**
   * Load the animal list. Animals are not profile-specific
   * so this only re-fetches when the list is empty.
   */
  async function fetchAnimals(force = false) {
    if (!force && animalList.value.length > 0) return
    loadingAnimals.value = true
    error.value = null
    try {
      animalList.value = await repositories.animals.getAll()
    } catch (e) {
      error.value = 'Could not load animals'
      console.error('[funFactStore] fetchAnimals failed', e)
    } finally {
      loadingAnimals.value = false
    }
  }

  /**
   * Eagerly fetch ALL animals then ALL their facts (locked + unlocked).
   * This populates `allFacts` so the page can render every fact card —
   * locked ones show as grayed-out so children see what they'll unlock next.
   *
   * Subsequent calls are no-ops unless force=true or the cache was invalidated.
   * After a level-up the level-change watcher clears the cache, so the next
   * call to fetchAllFacts() re-fetches fresh access states from the backend.
   */
  async function fetchAllFacts(force = false) {
    // Ensure the animal list is available first
    await fetchAnimals(force)

    // If we already have facts cached for ALL animals (and not forced), skip
    const allCached = animalList.value
      .filter((a) => a.backendId)
      .every((a) => cacheKey(a.backendId!) in animalFactsCache.value)
    if (!force && allCached && animalList.value.length > 0) return

    loadingAllFacts.value = true
    error.value = null

    try {
      // Fetch all animals' facts in parallel
      await Promise.all(
        animalList.value
          .filter((a) => a.backendId)
          .map((animal) => loadAnimalFacts(animal, force)),
      )
    } catch (e) {
      error.value = 'Could not load fun facts'
      console.error('[funFactStore] fetchAllFacts failed', e)
    } finally {
      loadingAllFacts.value = false
    }
  }

  /**
   * Lazy-load personalised facts for one animal.
   * Called by fetchAllFacts() eagerly, or directly when a card is flipped.
   * Results are cached by session token + animalId.
   */
  async function loadAnimalFacts(animal: AnimalListItem, force = false) {
    const id = animal.backendId
    if (!id) return

    const key = cacheKey(id)
    if (!force && animalFactsCache.value[key] !== undefined) return

    loadingAnimalFacts.value = id
    try {
      const facts = await repositories.funFacts.getByAnimalId(id, {
        commonName: animal.commonName,
        categoryEmoji: animal.iconEmoji,
        visualKey: animal.visualKey,
        imageUrl: animal.imageUrl,
        imageAttribution: animal.imageAttribution,
      })
      // Trigger reactivity by creating a new object
      animalFactsCache.value = { ...animalFactsCache.value, [key]: facts }
    } catch (e) {
      console.error(`[funFactStore] Failed to load facts for animal ${id}`, e)
      animalFactsCache.value = { ...animalFactsCache.value, [key]: [] }
    } finally {
      if (loadingAnimalFacts.value === id) {
        loadingAnimalFacts.value = null
      }
    }
  }

  /** Get cached facts for an animal, or empty array if not yet loaded. */
  function getAnimalFacts(animalId: string | null): FunFact[] {
    if (!animalId) return []
    return animalFactsCache.value[cacheKey(animalId)] ?? []
  }

  /** Whether facts for a given animal are currently loading. */
  function isLoadingAnimalFacts(animalId: string | null): boolean {
    return loadingAnimalFacts.value === animalId
  }

  /** Whether facts have been fetched for an animal (even if empty). */
  function hasFetchedAnimalFacts(animalId: string | null): boolean {
    if (!animalId) return false
    return cacheKey(animalId) in animalFactsCache.value
  }

  /**
   * Mark newly unlocked facts for the glow animation.
   * Uses the resolved access state per fact.
   */
  function checkAndMarkNewUnlocks(currentLevel: number, profileId: string) {
    const key = STORAGE_KEYS.seenUnlockKey(profileId)
    const seenList = storageService.get<string[]>(key) ?? []
    const seenSet = new Set(seenList)

    const facts = Object.values(animalFactsCache.value).flat()
    const newUnlocks = new Set<string>()
    for (const fact of facts) {
      const state = resolveFunFactAccessState(fact)
      const isUnlocked =
        state.status === 'unknown'
          ? fact.unlockLevel <= currentLevel
          : state.isUnlocked
      if (isUnlocked && !seenSet.has(fact.id)) {
        newUnlocks.add(fact.id)
      }
    }
    newlyUnlockedFactIds.value = newUnlocks
  }

  function acknowledgeUnlock(factId: string, profileId: string) {
    if (!newlyUnlockedFactIds.value.has(factId)) return

    const updated = new Set(newlyUnlockedFactIds.value)
    updated.delete(factId)
    newlyUnlockedFactIds.value = updated

    const key = STORAGE_KEYS.seenUnlockKey(profileId)
    const seenList = storageService.get<string[]>(key) ?? []
    if (!seenList.includes(factId)) {
      seenList.push(factId)
      storageService.set(key, seenList)
    }
  }

  /**
   * Invalidate all per-animal facts caches so the next fetchAllFacts() call
   * re-fetches from the backend with the current profile's level.
   *
   * Clears TWO cache layers:
   *   1. The store's reactive `animalFactsCache` ref
   *   2. The repository's in-memory Map (checked by getByAnimalId before the API call)
   * Both layers must be cleared; clearing only the store layer leaves the repository
   * cache intact and the next fetch still returns stale userLevel / accessStatus.
   *
   * Called automatically by the level-change and profile-switch watchers.
   * May also be called explicitly after quiz/mission completion if needed.
   */
  function invalidateFactsCache() {
    animalFactsCache.value = {}
    newlyUnlockedFactIds.value = new Set()
    repositories.funFacts.clearCache()
  }

  function openFact(fact: FunFact) {
    expandedFact.value = fact
  }

  function closeFact() {
    expandedFact.value = null
  }

  // ── Legacy compat ────────────────────────────────────────────────────────────

  /**
   * @deprecated Use fetchAllFacts() instead.
   * Kept for backward compat; internally delegates to fetchAllFacts.
   */
  async function fetchFacts(force = false) {
    await fetchAllFacts(force)
  }

  return {
    // State
    animalList,
    animalFactsCache,
    newlyUnlockedFactIds,
    expandedFact,
    loadingAnimals,
    loadingAllFacts,
    loadingAnimalFacts,
    error,

    // Computed
    sortedAnimals,
    allFacts,

    // Actions
    fetchAnimals,
    fetchAllFacts,
    fetchFacts,
    loadAnimalFacts,
    getAnimalFacts,
    isLoadingAnimalFacts,
    hasFetchedAnimalFacts,
    checkAndMarkNewUnlocks,
    acknowledgeUnlock,
    invalidateFactsCache,
    openFact,
    closeFact,
  }
})
