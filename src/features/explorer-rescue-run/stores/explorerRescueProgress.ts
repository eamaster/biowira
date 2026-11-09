import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSessionStore } from '@/stores/sessionStore'
import { useProgressStore } from '@/stores/progressStore'
import { useGameJournalStore } from '@/stores/gameJournalStore'
import { loadProgress, saveProgress } from '../utils/explorerRescueStorage'
import { DEFAULT_RESCUE_REWARDS } from '../data/explorerRescueRewards'
import { resolveExplorerRescueJournalStampIdForSession } from '../data/explorerRescueRunCatalog'
import {
  isExplorerRescueRunFirstCompletion,
  normalizeExplorerRescueCompletedIds,
  resolveExplorerRescueRunCompletionKeyFromResult,
} from '../data/explorerRescueRunProgress'
import type { ExplorerRescueProgress, ExplorerRescueResult } from '../game/types'
import { DEFAULT_EXPLORER_RESCUE_PROGRESS } from '../game/types'

/**
 * Persisted explorer-rescue slice.
 *
 * `completedExplorerIds` stores canonical catalog run ids (`larut-torrent-frog`, `sun-bear`, …).
 * Legacy saves may hold API animal ids until {@link loadProgress} normalizes them.
 */
export const useExplorerRescueProgressStore = defineStore('explorerRescueProgress', () => {
  const sessionStore = useSessionStore()
  const progressStore = useProgressStore()
  const journalStore = useGameJournalStore()

  const _progress = ref<ExplorerRescueProgress | null>(null)

  const activeProfileId = computed(() => sessionStore.activeProfile?.profileId ?? 'guest')

  function _ensureLoaded(): ExplorerRescueProgress {
    if (!_progress.value || _progress.value.profileId !== activeProfileId.value) {
      _progress.value = loadProgress(activeProfileId.value)
    }
    return _progress.value
  }

  const rainforestRestored = computed(() => _ensureLoaded().rainforestRestored)
  const journalStamps = computed(() => _ensureLoaded().journalStamps)
  const latestResult = computed(() => _ensureLoaded().latestResult)
  const completedExplorerIds = computed(() => _ensureLoaded().completedExplorerIds)

  /** @param catalogRunId Route/catalog id from {@link EXPLORER_RESCUE_RUN_CATALOG}. */
  function checkFirstCompletion(catalogRunId: string): boolean {
    return isExplorerRescueRunFirstCompletion(_ensureLoaded().completedExplorerIds, catalogRunId)
  }

  /**
   * Record a completed round authoritatively.
   *
   * Reward values (pointsEarned, restoration) are ALWAYS recalculated from the
   * current persisted state — never trusted from the stale scene result — so
   * replaying or refreshing can never duplicate the first-completion reward.
   */
  async function recordCompletion(result: ExplorerRescueResult): Promise<void> {
    const freshProgress = loadProgress(activeProfileId.value)
    const completionKey = resolveExplorerRescueRunCompletionKeyFromResult(result)
    const completedIds = freshProgress.completedExplorerIds

    const isFirst = isExplorerRescueRunFirstCompletion(completedIds, completionKey)

    const pointsEarned = isFirst
      ? DEFAULT_RESCUE_REWARDS.firstCompletionLeafPoints
      : DEFAULT_RESCUE_REWARDS.replayLeafPoints

    const restorationBefore = freshProgress.rainforestRestored
    const restorationAfter = isFirst
      ? Math.min(100, restorationBefore + DEFAULT_RESCUE_REWARDS.restorationIncrease)
      : restorationBefore

    const catalogStampId = resolveExplorerRescueJournalStampIdForSession(
      result.rescueRunCatalogId,
      { id: result.explorerAnimalId, visualKey: result.explorerVisualKey },
    )
    const journalStamp = isFirst ? catalogStampId : ''

    const normalizedResult: ExplorerRescueResult = {
      ...result,
      pointsEarned,
      restorationBefore,
      restorationAfter,
      isFirstCompletion: isFirst,
      journalStamp,
    }

    const newCompletedIds = isFirst
      ? normalizeExplorerRescueCompletedIds([...completedIds, completionKey])
      : completedIds

    const newStamps =
      journalStamp && !freshProgress.journalStamps.includes(journalStamp)
        ? [...freshProgress.journalStamps, journalStamp]
        : freshProgress.journalStamps

    const updated: ExplorerRescueProgress = {
      ...freshProgress,
      completedExplorerIds: newCompletedIds,
      rainforestRestored: restorationAfter,
      journalStamps: newStamps,
      latestResult: normalizedResult,
      updatedAt: new Date().toISOString(),
    }

    _progress.value = updated
    saveProgress(updated)

    await progressStore.addPoints(pointsEarned)

    try {
      journalStore.recordGameCompletion({
        categoryId: 'explorer-rescue-run',
        sourceId: completionKey,
        title: `${result.explorerName} Wild Match`,
        description: `Found the Wild Match for ${result.explorerName}!`,
        leafPointsEarned: pointsEarned,
        stampId: catalogStampId,
        metadata: {
          rescueAnimalName: result.explorerName,
          wildMatchName: result.chosenMatchName,
          sharedTraitIds: result.sharedTraits.map((t) => t.id),
          sharedTraitLabels: result.sharedTraits.map((t) => t.label),
          isFirstCompletion: isFirst,
        },
      })
    } catch (journalErr) {
      console.warn('[explorerRescueProgressStore] Failed to record journal completion', journalErr)
    }
  }

  function reset(): void {
    const fresh = DEFAULT_EXPLORER_RESCUE_PROGRESS(activeProfileId.value)
    _progress.value = fresh
    saveProgress(fresh)
  }

  return {
    rainforestRestored,
    journalStamps,
    latestResult,
    completedExplorerIds,
    checkFirstCompletion,
    recordCompletion,
    reset,
  }
})
