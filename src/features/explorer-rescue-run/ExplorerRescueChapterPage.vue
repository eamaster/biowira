<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/app/config'
import { EXPLORER_RESCUE_ASSETS } from '@/app/branding'
import { useProgressStore } from '@/stores/progressStore'
import { useExplorerRescueProgressStore } from './stores/explorerRescueProgress'
import {
  EXPLORER_RESCUE_RUN_CATALOG,
  DEFAULT_EXPLORER_RESCUE_RUN_ID,
  type ExplorerRescueRunCatalogItem,
} from './data/explorerRescueRunCatalog'
import {
  countCompletedExplorerRescueCatalogRuns,
  isExplorerRescueCatalogRunComplete,
} from './data/explorerRescueRunProgress'
import { resolveExplorerRescueSprite } from './utils/explorerRescueSprites'
import BioWiraScenePage from '@/components/layout/BioWiraScenePage.vue'
import PixelButton from '@/components/ui/PixelButton.vue'
import RescueChoiceIcon from './components/RescueChoiceIcon.vue'
import RescueInfoChips from './components/RescueInfoChips.vue'
import RescueProgressPanel from './components/RescueProgressPanel.vue'
import ExplorerRescueStagePreview from './components/ExplorerRescueStagePreview.vue'

const router = useRouter()
const progressStore = useProgressStore()
const rescueStore = useExplorerRescueProgressStore()

const leafPoints = computed(() => progressStore.leafPoints)
const rainforestRestored = computed(() => rescueStore.rainforestRestored)

const catalogLength = computed(() => EXPLORER_RESCUE_RUN_CATALOG.length)
const rescuedCompletedCount = computed(() =>
  countCompletedExplorerRescueCatalogRuns(rescueStore.completedExplorerIds),
)

const defaultCatalogVisualKey = EXPLORER_RESCUE_RUN_CATALOG.find((r) => r.id === DEFAULT_EXPLORER_RESCUE_RUN_ID)?.visualKey ?? DEFAULT_EXPLORER_RESCUE_RUN_ID

const infoSummary = computed(() => ({
  headline: 'Animal Rescue Runs',
  subline:
    rescuedCompletedCount.value === catalogLength.value
      ? 'All rescue runs completed — replay any time!'
      : `${rescuedCompletedCount.value} of ${catalogLength.value} rescue runs finished`,
  mascotSrc: resolveExplorerRescueSprite(defaultCatalogVisualKey),
}))

const completedSteps = computed(() => {
  const steps: string[] = ['meet']
  if (rescueStore.completedExplorerIds.length > 0) {
    steps.push('run', 'match', 'journal')
  }
  return steps
})

const assets = EXPLORER_RESCUE_ASSETS.landing

const defaultPreviewMascot = computed(() => resolveExplorerRescueSprite(defaultCatalogVisualKey))

function startRescueFor(id: string) {
  router.push({
    name: ROUTE_NAMES.explorerRescuePlay,
    query: { rescueAnimal: id },
  })
}

function isRunComplete(run: ExplorerRescueRunCatalogItem): boolean {
  return isExplorerRescueCatalogRunComplete(run, rescueStore.completedExplorerIds)
}

function backToGames() {
  router.push({ name: ROUTE_NAMES.games })
}
</script>

<template>
  <BioWiraScenePage
    title="Explorer Rescue Run"
    subtitle="Choose an animal rescue run, then find its Wild Match."
    content-width="wide"
  >
    <div class="chapter-page" data-testid="explorer-rescue-page">
      <div class="chapter-page__content">
        <RescueInfoChips
          :neutral-summary="infoSummary"
          :rainforest-restored="rainforestRestored"
          :leaf-points="leafPoints"
        />

        <ExplorerRescueStagePreview
          :background-src="assets.stagePreviewBackground"
          :mascot-src="defaultPreviewMascot"
          mascot-alt="Animal rescue mascot"
        />

        <RescueProgressPanel current-step="run" :completed="completedSteps" :preview-visual-key="defaultCatalogVisualKey" />

        <div class="rescue-run-cards" aria-label="Choose an animal rescue run">
          <article
            v-for="run in EXPLORER_RESCUE_RUN_CATALOG"
            :key="run.id"
            class="rescue-run-cards__card pixel-card"
            :data-testid="`explorer-rescue-run-card-${run.id}`"
          >
            <div class="rescue-run-cards__header">
              <RescueChoiceIcon
                class="rescue-run-cards__icon"
                :visual-key="run.visualKey"
                :common-name="run.animalName"
                :fallback-emoji="run.fallbackEmoji ?? '🐾'"
                size="64px"
                :alt="run.animalName"
              />
              <div class="rescue-run-cards__titles">
                <h2 class="rescue-run-cards__name">{{ run.animalName }}</h2>
                <span
                  v-if="isRunComplete(run)"
                  class="rescue-run-cards__badge"
                  data-testid="explorer-rescue-run-complete-chip"
                >Finished</span>
              </div>
            </div>
            <p class="rescue-run-cards__desc">{{ run.description }}</p>
            <PixelButton
              variant="green"
              size="md"
              full-width
              class="rescue-run-cards__start"
              :aria-label="`Start ${run.animalName} rescue`"
              :data-testid="`explorer-rescue-start-${run.id}`"
              @click="startRescueFor(run.id)"
            >
              Start Rescue
            </PixelButton>
          </article>

          <div class="rescue-run-cards__footer">
            <PixelButton
              variant="gray"
              size="md"
              full-width
              aria-label="Back to Games menu"
              data-testid="explorer-rescue-back-button"
              @click="backToGames"
            >
              Back to Games
            </PixelButton>
          </div>
        </div>
      </div>
    </div>
  </BioWiraScenePage>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.chapter-page {
  min-height: 100%;
}

.chapter-page__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-top: var(--space-3);
  padding-bottom: var(--space-8);
  width: min(100%, var(--content-game-width, 1040px));
  margin: 0 auto;

  @media (max-width: $bp-md) {
    gap: var(--space-3);
    padding-top: var(--space-2);
  }
}

.rescue-run-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  width: 100%;

  @media (max-width: $bp-md) {
    grid-template-columns: 1fr;
  }
}

.rescue-run-cards__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--pixel-shadow);
}

.rescue-run-cards__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.rescue-run-cards__icon {
  flex-shrink: 0;
}

.rescue-run-cards__titles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.rescue-run-cards__name {
  margin: 0;
  font-family: var(--font-readable);
  font-size: clamp(18px, 3vw, 22px);
  font-weight: 900;
  color: var(--color-primary);
  line-height: 1.2;
}

.rescue-run-cards__badge {
  font-family: var(--font-readable);
  font-size: var(--text-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-on-primary);
  background: var(--color-primary);
  border-radius: var(--radius-sm);
  padding: 4px var(--space-2);
}

.rescue-run-cards__desc {
  margin: 0;
  flex: 1;
  font-family: var(--font-readable);
  font-size: var(--text-sm);
  color: var(--color-text);
  line-height: 1.35;
}

.rescue-run-cards__start {
  margin-top: auto;
}

.rescue-run-cards__footer {
  grid-column: 1 / -1;
}
</style>
