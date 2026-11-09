// ============================================================
// BioWira Eco-Comic Progress Store
//
// Tracks which story endings have been unlocked per profile.
// Guards against duplicate point/stamp awards for the same ending.
// Completion integrates with gameJournalStore + progressStore.
// ============================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSessionStore } from '@/stores/sessionStore'
import { useProgressStore } from '@/stores/progressStore'
import { useGameJournalStore } from '@/stores/gameJournalStore'
import { storageService } from '@/services/storageService'
import { STORAGE_KEYS } from '@/app/config'
import { getStoryById } from '../data/ecoComicStoryCatalog'
import type { GameJournalRecord } from '@/domain/gameJournal'

// ── Persisted state ────────────────────────────────────────────────────────────

interface EcoComicProfileProgress {
  profileId: string
  /** storyId → set of endingIds already completed (with points awarded) */
  completedEndings: Record<string, string[]>
  updatedAt: string
}

function blankProgress(profileId: string): EcoComicProfileProgress {
  return {
    profileId,
    completedEndings: {},
    updatedAt: new Date().toISOString(),
  }
}

function safeParse(
  raw: EcoComicProfileProgress | null,
  profileId: string,
): EcoComicProfileProgress {
  if (!raw || typeof raw !== 'object') return blankProgress(profileId)
  return {
    profileId: raw.profileId ?? profileId,
    completedEndings:
      raw.completedEndings && typeof raw.completedEndings === 'object'
        ? raw.completedEndings
        : {},
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useEcoComicProgressStore = defineStore('ecoComicProgress', () => {
  const sessionStore = useSessionStore()
  const progressStore = useProgressStore()
  const journalStore = useGameJournalStore()

  const _progress = ref<EcoComicProfileProgress | null>(null)

  const activeProfileId = computed(
    () => sessionStore.activeProfile?.profileId ?? 'guest',
  )

  function _load(): EcoComicProfileProgress {
    if (_progress.value?.profileId === activeProfileId.value) {
      return _progress.value
    }
    const key = STORAGE_KEYS.ecoComicProgress(activeProfileId.value)
    const raw = storageService.get<EcoComicProfileProgress>(key)
    _progress.value = safeParse(raw, activeProfileId.value)
    return _progress.value
  }

  function _save(state: EcoComicProfileProgress): void {
    _progress.value = state
    const key = STORAGE_KEYS.ecoComicProgress(state.profileId)
    storageService.set(key, state)
  }

  // ── Computed ──────────────────────────────────────────────────────────────────

  /** Whether a specific story ending has already been completed (and points awarded). */
  const isEndingCompleted = computed(
    () =>
      (storyId: string, endingId: string): boolean => {
        const state = _load()
        return state.completedEndings[storyId]?.includes(endingId) ?? false
      },
  )

  /** All completed ending IDs for a given story. */
  const completedEndingsForStory = computed(
    () =>
      (storyId: string): string[] => {
        const state = _load()
        return state.completedEndings[storyId] ?? []
      },
  )

  // ── Actions ───────────────────────────────────────────────────────────────────

  /**
   * Record an eco-comic ending completion.
   *
   * - Awards leaf points and records in the journal ONLY if this is the first
   *   time this profile completes this storyId + endingId combination.
   * - Returns `{ isFirstCompletion, leafPointsAwarded, journalRecord }`.
   */
  async function completeEnding(
    storyId: string,
    endingId: string,
  ): Promise<{
    isFirstCompletion: boolean
    leafPointsAwarded: number
    stampId: string
    endingTitle: string
    journalRecord: GameJournalRecord | null
  }> {
    const story = getStoryById(storyId)
    if (!story) throw new Error(`[ecoComicProgressStore] Unknown story: ${storyId}`)

    // Find the ending panel
    const endingPanel = Object.values(story.panels).find(
      (p) => p.isEnding && p.endingId === endingId,
    )
    if (!endingPanel) {
      throw new Error(`[ecoComicProgressStore] Unknown ending: ${endingId} in story ${storyId}`)
    }

    const state = _load()
    const alreadyCompleted = state.completedEndings[storyId]?.includes(endingId) ?? false

    const leafPoints = endingPanel.leafPoints ?? 0
    const stampId = endingPanel.stampId ?? ''
    const endingTitle = endingPanel.endingTitle ?? endingId

    let journalRecord: GameJournalRecord | null = null

    if (!alreadyCompleted) {
      // Mark as completed in eco-comic progress
      const currentList = state.completedEndings[storyId] ?? []
      const updated: EcoComicProfileProgress = {
        ...state,
        completedEndings: {
          ...state.completedEndings,
          [storyId]: [...currentList, endingId],
        },
        updatedAt: new Date().toISOString(),
      }
      _save(updated)

      // Award leaf points
      if (leafPoints > 0) {
        await progressStore.addPoints(leafPoints)
      }

      // Record in the unified game journal (first completion — stamp unlocked)
      if (stampId) {
        journalRecord = journalStore.recordGameCompletion({
          categoryId: 'eco-comic',
          sourceId: `${storyId}_${endingId}`,
          title: story.title,
          description: endingPanel.endingDescription ?? `Completed: ${endingTitle}`,
          leafPointsEarned: leafPoints,
          stampId,
          metadata: {
            storyId,
            storyTitle: story.title,
            endingId,
            endingName: endingTitle,
            branchPath: endingId,
            isFirstCompletion: true,
          },
        })
      }
    } else {
      // Replay: append a history record with 0 points (stamp already unlocked — deduplication
      // in recordGameCompletion keeps unlockedStampIds clean).
      if (stampId) {
        journalRecord = journalStore.recordGameCompletion({
          categoryId: 'eco-comic',
          sourceId: `${storyId}_${endingId}`,
          title: story.title,
          description: endingPanel.endingDescription ?? `Completed: ${endingTitle}`,
          leafPointsEarned: 0,
          stampId,
          metadata: {
            storyId,
            storyTitle: story.title,
            endingId,
            endingName: endingTitle,
            branchPath: endingId,
            isFirstCompletion: false,
          },
        })
      }
    }

    return {
      isFirstCompletion: !alreadyCompleted,
      leafPointsAwarded: alreadyCompleted ? 0 : leafPoints,
      stampId,
      endingTitle,
      journalRecord,
    }
  }

  function _resetForTests(profileId = 'guest'): void {
    if (import.meta.env.MODE !== 'test' && import.meta.env.VITEST !== 'true') return
    const fresh = blankProgress(profileId)
    _save(fresh)
  }

  return {
    isEndingCompleted,
    completedEndingsForStory,
    completeEnding,
    _resetForTests,
  }
})
