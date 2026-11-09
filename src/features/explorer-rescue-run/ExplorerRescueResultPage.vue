<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/app/config'
import {
  DEFAULT_EXPLORER_RESCUE_RUN_ID,
  findExplorerRescueRunByAnimalId,
  findExplorerRescueRunById,
} from './data/explorerRescueRunCatalog'
import { useExplorerRescueProgressStore } from './stores/explorerRescueProgress'
import { useProgressStore } from '@/stores/progressStore'
import { getLevelForPoints } from '@/domain/user'
import BioWiraScenePage from '@/components/layout/BioWiraScenePage.vue'
import PixelButton from '@/components/ui/PixelButton.vue'
import ExplorerRescueRewardSummary from './components/ExplorerRescueRewardSummary.vue'
import AnimalIcon from '@/components/ui/AnimalIcon.vue'
import RescueChoiceIcon from './components/RescueChoiceIcon.vue'
import RescueTraitBadge from './components/RescueTraitBadge.vue'
import { useAppAudio } from '@/composables/useAppAudio'

const router = useRouter()
const rescueStore = useExplorerRescueProgressStore()
const progressStore = useProgressStore()
const { sfx } = useAppAudio()

const result = computed(() => rescueStore.latestResult)

/** Catalog emoji — used only if explorer spirit SVG/WebP fails to load. */
const explorerResultEmoji = computed(() =>
  result.value?.explorerAnimalId
    ? findExplorerRescueRunByAnimalId(result.value.explorerAnimalId)?.fallbackEmoji ?? '🐾'
    : '🐾',
)

const totalLeafPointsAfter = computed(() => {
  if (progressStore.progress != null) return progressStore.leafPoints
  return result.value?.pointsEarned ?? 0
})

const showLevelUp = computed(() => {
  const r = result.value
  if (!r || progressStore.progress == null) return false
  const ptsAfter = progressStore.leafPoints
  const ptsBefore = Math.max(0, ptsAfter - r.pointsEarned)
  return getLevelForPoints(ptsAfter).level > getLevelForPoints(ptsBefore).level
})

onMounted(() => {
  const r = result.value
  if (!r) return
  // Short delay so SFX doesn't clash with route transition
  setTimeout(() => {
    sfx('achievement')
  }, 600)
})

function rescuePlayCatalogId(): string {
  const r = result.value
  const candidateId =
    r?.rescueRunCatalogId ??
    (r?.explorerAnimalId ? findExplorerRescueRunByAnimalId(r.explorerAnimalId)?.id : undefined)
  // Validate the candidate id is still present in the catalog.
  // Old saved results whose rescue run was removed fall back to the current default.
  if (candidateId && findExplorerRescueRunById(candidateId)) {
    return candidateId
  }
  return DEFAULT_EXPLORER_RESCUE_RUN_ID
}

function playAgain() {
  router.push({
    name: ROUTE_NAMES.explorerRescuePlay,
    query: { rescueAnimal: rescuePlayCatalogId() },
  })
}

function openJournal() {
  router.push({ name: ROUTE_NAMES.gameJournalMenu })
}

function tryMission() {
  router.push({ name: ROUTE_NAMES.missions })
}

function continueChapter() {
  router.push({ name: ROUTE_NAMES.explorerRescue })
}

function startRescue() {
  router.push({
    name: ROUTE_NAMES.explorerRescuePlay,
    query: { rescueAnimal: DEFAULT_EXPLORER_RESCUE_RUN_ID },
  })
}
</script>

<template>
  <BioWiraScenePage
    title="Your Wild Match!"
    subtitle="See your shared clues, rewards, and new journal stamp."
    density="compact"
    :show-decor="false"
  >
    <!-- No result guard -->
    <template v-if="!result">
      <div class="result-page__empty">
        <p class="result-page__empty-text">No rescue result yet.</p>
        <PixelButton variant="green" size="lg" @click="startRescue">
          Start Rescue
        </PixelButton>
      </div>
    </template>

    <template v-else>
      <div class="result-page__stack">
        <!-- Match summary -->
        <div class="result-page__match-card">
          <div class="result-page__animal-row">
            <div class="result-page__animal-card">
              <span class="result-page__animal-label">Rescue Animal</span>
              <AnimalIcon
                :icon-key="result.explorerVisualKey"
                :common-name="result.explorerName"
                :fallback-emoji="explorerResultEmoji"
                use-rescue-runner-icon
                size="clamp(74px, 12vw, 96px)"
                :alt="result.explorerName"
              />
              <span class="result-page__animal-name">{{ result.explorerName }}</span>
            </div>

            <div class="result-page__vine" aria-hidden="true">
              <div class="result-page__vine-line"></div>
              <div class="result-page__vine-center">
                <p class="result-page__match-title">Great match!</p>
                <p class="result-page__match-sub">
                  They share {{ result.sharedTraits.length }} clues.
                </p>
              </div>
              <div class="result-page__vine-line"></div>
            </div>

            <div class="result-page__animal-card">
              <span class="result-page__animal-label result-page__animal-label--wild">Wild Match</span>
              <RescueChoiceIcon
                :visual-key="result.chosenMatchVisualKey"
                :common-name="result.chosenMatchName"
                fallback-emoji="🐾"
                size="clamp(74px, 12vw, 96px)"
                :alt="result.chosenMatchName"
              />
              <span class="result-page__animal-name">{{ result.chosenMatchName }}</span>
            </div>
          </div>

          <div class="result-page__traits" aria-label="Shared clues">
            <RescueTraitBadge
              v-for="trait in result.sharedTraits"
              :key="trait.id"
              :trait="trait"
              collected
            />
          </div>
        </div>

        <ExplorerRescueRewardSummary
          :result="result"
          :total-leaf-points="totalLeafPointsAfter"
          :level="progressStore.level"
          :level-title="progressStore.levelTitle"
          :level-progress-percent="progressStore.levelProgressPercent"
          :show-level-up="showLevelUp"
        />

        <div class="result-page__actions">
          <PixelButton variant="green" size="md" full-width aria-label="Play again" @click="playAgain">Play Again</PixelButton>
          <PixelButton variant="orange" size="md" full-width aria-label="Open Journal Book" @click="openJournal">Open Journal Book</PixelButton>
          <PixelButton variant="blue" size="md" full-width aria-label="Try a Nature Mission" @click="tryMission">Try Mission</PixelButton>
          <PixelButton variant="gray" size="md" full-width aria-label="Continue chapter" @click="continueChapter">Continue</PixelButton>
        </div>
      </div>
    </template>
  </BioWiraScenePage>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;
@use '@/styles/mixins/result_page_actions_grid' as *;

.result-page__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8);
  text-align: center;
}

.result-page__empty-text {
  font-family: var(--font-readable);
  font-weight: 800;
  font-size: var(--text-base);
  color: var(--color-text-muted);
}

.result-page__stack {
  width: min(100%, clamp(760px, 78vw, 1180px));
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(var(--space-3), 1.8vh, var(--space-5));
}

.result-page__match-card {
  width: 100%;
  flex-shrink: 0;
  min-width: 0;
  background: var(--color-bg-card);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--pixel-shadow-lg);
  padding: clamp(var(--space-4), 2vw, var(--space-5));
  display: flex;
  flex-direction: column;
  gap: clamp(var(--space-3), 1.5vh, var(--space-4));
}

.result-page__animal-row {
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;
  align-items: center;
  gap: var(--space-4);

  @media (min-width: $bp-md) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.result-page__animal-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  min-width: 0;
  width: min(100%, 240px);
  box-shadow: var(--pixel-shadow);
}

.result-page__animal-label {
  font-family: var(--font-readable);
  font-size: var(--text-xs);
  font-weight: 800;
  color: var(--color-text-muted);
  text-transform: uppercase;

  &--wild {
    color: var(--color-primary);
  }
}

.result-page__animal-name {
  font-family: var(--font-readable);
  font-size: var(--text-base);
  font-weight: 800;
  color: var(--color-text);
  text-align: center;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.result-page__vine {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
  width: min(100%, 260px);
}

.result-page__vine-line {
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, transparent, #5b8a3c, transparent);
  border-radius: 2px;
}

.result-page__vine-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.result-page__match-title {
  font-family: var(--font-readable);
  font-size: var(--text-md);
  font-weight: 900;
  color: var(--color-primary);
  margin: 0;
}

.result-page__match-sub {
  font-family: var(--font-readable);
  font-size: var(--text-sm);
  font-weight: 800;
  color: var(--color-text-muted);
  margin: 0;
}

.result-page__traits {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: center;

  :deep(.rescue-trait-badge__icon) {
    width: clamp(32px, 5vw + 18px, 44px);
    height: clamp(32px, 5vw + 18px, 44px);
  }

  :deep(.rescue-trait-badge__label) {
    font-size: clamp(13px, 1vw + 10px, 16px);
  }
}

.result-page__actions {
  @include result-page-actions-grid(4);
}
</style>
