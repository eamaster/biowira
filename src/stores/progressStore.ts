import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { UserProgress } from '@/domain/user'
import type { ChildProfile } from '@/domain/session'
import { getLevelForPoints, getLevelProgress } from '@/domain/user'
import { appConfig } from '@/app/config'
import { repositories } from '@/repositories'
import { useSessionStore } from './sessionStore'

export const useProgressStore = defineStore('progress', () => {
  // ── State ──────────────────────────────────────────────────────────────────

  const progress = ref<UserProgress | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Computed ────────────────────────────────────────────────────────────────

  const leafPoints = computed(() => progress.value?.leafPoints ?? 0)
  const level = computed(() => progress.value?.level ?? 1)
  const levelTitle = computed(() => progress.value?.levelTitle ?? 'Nature Newbie')
  /**
   * displayName comes from the active child profile's nickname if a session is
   * active, falling back to the legacy displayName field for backward compat.
   */
  const displayName = computed(() => {
    const sessionStore = useSessionStore()
    return sessionStore.activeProfile?.displayNickname ?? progress.value?.displayName ?? 'Explorer'
  })
  const levelProgressPercent = computed(() => getLevelProgress(leafPoints.value))
  const levelDefinition = computed(() => getLevelForPoints(leafPoints.value))

  // ── Profile hydration ───────────────────────────────────────────────────────

  /**
   * Populate progress from a ChildProfile.
   * Called automatically by the watch below when activeProfile changes.
   */
  function hydrateFromProfile(profile: ChildProfile): void {
    progress.value = {
      userId: profile.profileId,
      displayName: profile.displayNickname,
      leafPoints: profile.leafPoints,
      level: profile.level,
      levelTitle: profile.levelTitle,
      lastAnimalId: profile.lastAnimalId,
      lastAnimalName: profile.lastAnimalName,
      lastQuizTitle: profile.lastQuizTitle,
    }
  }

  // Watch activeProfile changes (including profile switch) and auto-hydrate.
  // `immediate: true` is required: bootstrapSession() sets activeProfile BEFORE
  // any component (and therefore this store) is created, so the watch would never
  // fire for the initial value without it. Without this, progress.value stays null
  // and recordAnimalVisit / recordQuizVisit silently no-op on first use.
  const sessionStore = useSessionStore()
  watch(
    () => sessionStore.activeProfile,
    (profile) => {
      if (profile) {
        hydrateFromProfile(profile)
      } else {
        progress.value = null
      }
    },
    { immediate: true },
  )

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Fetch / refresh progress.
   * - With an active session: reads from activeProfile (already hydrated by watch).
   * - Without an active session (tests, no-auth fallback): uses IUserRepository.
   */
  async function fetchProgress() {
    loading.value = true
    error.value = null
    try {
      if (sessionStore.activeProfile) {
        hydrateFromProfile(sessionStore.activeProfile)
      } else if (appConfig.repoSources.user === 'mock') {
        progress.value = await repositories.user.getProgress()
      } else {
        progress.value = null
      }
    } catch (e) {
      error.value = 'Could not load progress'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Add points to the current progress.
   *
   * SESSION-ACTIVE path:
   *   Computes new total directly from the in-memory profile progress — never
   *   routes through repositories.user (which is a shared in-memory singleton
   *   and would bleed state across profiles).
   *
   * NO-SESSION fallback (legacy / tests):
   *   Delegates to repositories.user.addPoints() for backward compat.
   */
  async function addPoints(points: number) {
    try {
      if (sessionStore.activeProfile) {
        // Compute new total from the profile's own leaf points
        const currentPoints = progress.value?.leafPoints ?? sessionStore.activeProfile.leafPoints
        const newPoints = currentPoints + points
        const levelDef = getLevelForPoints(newPoints)
        const updated: Partial<UserProgress> = {
          leafPoints: newPoints,
          level: levelDef.level,
          levelTitle: levelDef.title,
        }
        // Update in-memory progress immediately (optimistic)
        if (progress.value) {
          progress.value = { ...progress.value, ...updated }
        }
        // Persist to active profile
        await _persistToActiveProfile()
      } else {
        // No-session fallback — use legacy singleton repository
        progress.value = await repositories.user.addPoints(points)
      }
    } catch (e) {
      console.error('Failed to add points', e)
    }
  }

  /**
   * Record last animal visit.
   *
   * SESSION-ACTIVE path: writes directly to profile; never touches repositories.user.
   * NO-SESSION fallback: delegates to repositories.user.updateLastAnimal().
   */
  async function recordAnimalVisit(animalId: string, animalName: string) {
    try {
      if (sessionStore.activeProfile) {
        if (progress.value) {
          progress.value = { ...progress.value, lastAnimalId: animalId, lastAnimalName: animalName }
        }
        await _persistToActiveProfile()
      } else {
        await repositories.user.updateLastAnimal(animalId, animalName)
        if (progress.value) {
          progress.value = { ...progress.value, lastAnimalId: animalId, lastAnimalName: animalName }
        }
      }
    } catch (e) {
      console.error('Failed to record animal visit', e)
    }
  }

  /**
   * Record last quiz visit.
   *
   * SESSION-ACTIVE path:
   *   1. Trims and guards empty titles.
   *   2. Hydrates progress.value from the active profile if it is null (handles
   *      the edge case where progressStore is used before the watch fires).
   *   3. Updates progress.value immediately (optimistic in-memory update).
   *   4. Patches sessionStore.activeProfile synchronously so Home-page computed
   *      values update before the async persist completes.
   *   5. Persists to the local catalog via _persistToActiveProfile().
   *
   * NO-SESSION fallback: delegates to repositories.user.updateLastQuiz().
   */
  async function recordQuizVisit(quizTitle: string) {
    const safeTitle = quizTitle.trim()
    if (!safeTitle) return

    try {
      if (sessionStore.activeProfile) {
        // Ensure progress is hydrated so the spread below has all fields.
        if (!progress.value) {
          hydrateFromProfile(sessionStore.activeProfile)
        }

        if (progress.value) {
          progress.value = { ...progress.value, lastQuizTitle: safeTitle }
        }

        // Synchronous patch — Home page reactive computed updates immediately
        // without waiting for the async persist round-trip.
        sessionStore.patchActiveProfile({ lastQuizTitle: safeTitle })

        await _persistToActiveProfile()
      } else {
        await repositories.user.updateLastQuiz(safeTitle)
        if (progress.value) {
          progress.value = { ...progress.value, lastQuizTitle: safeTitle }
        }
      }
    } catch (e) {
      console.error('Failed to record quiz visit', e)
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Write current progress back to the active profile in storage.
   * No-op when no session is active (test mode, non-session fallback).
   */
  async function _persistToActiveProfile(): Promise<void> {
    const profileId = sessionStore.activeProfile?.profileId
    if (!profileId || !progress.value) return
    try {
      // Lazy-import profileStore to avoid module circular references
      const { useProfileStore } = await import('./profileStore')
      const profileStore = useProfileStore()
      await profileStore.updateProgress(profileId, {
        leafPoints: progress.value.leafPoints,
        level: progress.value.level,
        levelTitle: progress.value.levelTitle,
        lastAnimalId: progress.value.lastAnimalId,
        lastAnimalName: progress.value.lastAnimalName,
        lastQuizTitle: progress.value.lastQuizTitle,
      })
    } catch (e) {
      console.error('[progressStore] Failed to persist progress to profile', e)
    }
  }

  return {
    progress,
    loading,
    error,
    leafPoints,
    level,
    levelTitle,
    displayName,
    levelProgressPercent,
    levelDefinition,
    fetchProgress,
    addPoints,
    recordAnimalVisit,
    recordQuizVisit,
    hydrateFromProfile,
  }
})
