<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/app/config'
import { useExplorerRescueProgressStore } from './stores/explorerRescueProgress'
import { useProgressStore } from '@/stores/progressStore'
import BioWiraScenePage from '@/components/layout/BioWiraScenePage.vue'
import PixelButton from '@/components/ui/PixelButton.vue'
import PixelProgressBar from '@/components/ui/PixelProgressBar.vue'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'
import AnimalIcon from '@/components/ui/AnimalIcon.vue'
import RescueTraitBadge from './components/RescueTraitBadge.vue'
import RescueJournalStamp from './components/RescueJournalStamp.vue'
import { LEAF_POINTS_GAMEPLAY_ICON_KEY, LEAF_POINTS_LABEL } from '@/domain/pointsCurrency'
import { useAppAudio } from '@/composables/useAppAudio'
import { getStampsByCategory } from '@/features/game-journal/data/gameJournalCatalog'

const router = useRouter()
const rescueStore = useExplorerRescueProgressStore()
const progressStore = useProgressStore()
const { sfx } = useAppAudio()

const explorerRescueJournalStampDefs = getStampsByCategory('explorer-rescue-run')

onMounted(() => {
  sfx('journal-flip')
})

const latestResult = computed(() => rescueStore.latestResult)
const journalStamps = computed(() => rescueStore.journalStamps)
const rainforestRestored = computed(() => rescueStore.rainforestRestored)
const leafPoints = computed(() => progressStore.leafPoints)

function isExplorerJournalStampUnlocked(stampId: string): boolean {
  return journalStamps.value.includes(stampId)
}

function backToGames() {
  router.push({ name: ROUTE_NAMES.games })
}

function continueChapter() {
  router.push({ name: ROUTE_NAMES.explorerRescue })
}
</script>

<template>
  <BioWiraScenePage
    title="Rescue Journal"
    subtitle="Explorer Rescue Run"
    content-width="wide"
    :show-decor="false"
  >
    <div class="journal-page" data-testid="explorer-rescue-journal-page">
      <div class="journal-page__content">
        <!-- Scrapbook card -->
        <div class="journal-page__book">
          <!-- Left page -->
          <div class="journal-page__left-page">
            <!-- Explorer card -->
            <div v-if="latestResult" class="journal-page__explorer-card">
              <span class="journal-page__section-label">Rescue Animal</span>
              <AnimalIcon
                :icon-key="latestResult.explorerVisualKey"
                fallback-emoji="🐾"
                size="52px"
                :alt="latestResult.explorerName"
              />
              <span class="journal-page__animal-name">{{ latestResult.explorerName }}</span>
            </div>
            <div v-else class="journal-page__explorer-card journal-page__explorer-card--empty">
              <span class="journal-page__section-label">Rescue Animal</span>
              <span class="journal-page__placeholder">🐾</span>
              <span class="journal-page__animal-name">No run yet</span>
            </div>

            <!-- Vine decoration -->
            <div class="journal-page__vine-deco" aria-hidden="true">🌿</div>

            <!-- Wild Match card -->
            <div v-if="latestResult" class="journal-page__explorer-card">
              <span class="journal-page__section-label">Wild Match</span>
              <AnimalIcon
                :icon-key="latestResult.chosenMatchVisualKey"
                fallback-emoji="🐾"
                size="52px"
                :alt="latestResult.chosenMatchName"
              />
              <span class="journal-page__animal-name">{{ latestResult.chosenMatchName }}</span>
            </div>
          </div>

          <!-- Spine -->
          <div class="journal-page__spine" aria-hidden="true"></div>

          <!-- Right page -->
          <div class="journal-page__right-page">
            <!-- Primary stamp -->
            <div class="journal-page__stamps-row">
              <div
                v-for="def in explorerRescueJournalStampDefs"
                :key="def.stampId"
                class="journal-page__stamp-wrapper"
              >
                <RescueJournalStamp
                  :stamp-key="def.stampId"
                  :title="def.title"
                  :unlocked="isExplorerJournalStampUnlocked(def.stampId)"
                />
              </div>
            </div>

            <!-- Shared clues -->
            <template v-if="latestResult && latestResult.sharedTraits.length > 0">
              <div class="journal-page__section">
                <span class="journal-page__section-label">Shared Clue Badges</span>
                <div class="journal-page__traits">
                  <RescueTraitBadge
                    v-for="trait in latestResult.sharedTraits"
                    :key="trait.id"
                    :trait="trait"
                    collected
                    size="sm"
                  />
                </div>
              </div>
            </template>

            <!-- Progress -->
            <div class="journal-page__section">
              <span class="journal-page__section-label">Rainforest Restored</span>
              <PixelProgressBar :value="rainforestRestored" :max="100" />
              <span class="journal-page__progress-value">{{ rainforestRestored }}%</span>
            </div>

            <!-- Leaf Points -->
            <div class="journal-page__section">
              <span class="journal-page__section-label">
                <GameplayIcon :type="LEAF_POINTS_GAMEPLAY_ICON_KEY" size="16px" class="journal-page__leaf-icon" />
                {{ LEAF_POINTS_LABEL }} Earned
              </span>
              <span class="journal-page__points-value">{{ leafPoints }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="journal-page__actions">
          <PixelButton
            variant="gray"
            size="md"
            full-width
            aria-label="Back to Games menu"
            data-testid="explorer-rescue-journal-back-button"
            @click="backToGames"
          >
            Back to Games
          </PixelButton>
          <PixelButton
            variant="green"
            size="md"
            full-width
            aria-label="Continue chapter"
            @click="continueChapter"
          >
            Continue Chapter ▶
          </PixelButton>
        </div>
      </div>
    </div>
  </BioWiraScenePage>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;
@use '@/styles/pixel' as *;

.journal-page {
  min-height: 100%;
}

.journal-page__content {
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

.journal-page__book {
  width: 100%;
  display: flex;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  @include pixel-border-thick;
  overflow: hidden;
  min-height: 380px;

  @media (max-width: $bp-md) {
    flex-direction: column;
  }
}

.journal-page__left-page {
  flex: 1;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-bg-card);
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 27px,
    color-mix(in srgb, var(--color-border) 15%, transparent) 27px,
    color-mix(in srgb, var(--color-border) 15%, transparent) 28px
  );
}

.journal-page__spine {
  width: var(--space-2);
  background: var(--color-border);
  flex-shrink: 0;

  @media (max-width: $bp-md) {
    width: 100%;
    height: var(--space-2);
  }
}

.journal-page__right-page {
  flex: 1.2;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.journal-page__explorer-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  width: 100%;
  max-width: 160px;
  box-shadow: var(--pixel-shadow);

  &--empty {
    opacity: 0.5;
  }
}

.journal-page__section-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-readable);
  font-size: var(--text-sm);
  font-weight: 800;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.journal-page__leaf-icon {
  flex-shrink: 0;
}

.journal-page__animal-name {
  font-family: var(--font-readable);
  font-size: var(--text-base);
  font-weight: 800;
  color: var(--color-text);
  text-align: center;
}

.journal-page__animal-species {
  font-family: var(--font-readable);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text-muted);
  text-align: center;
}

.journal-page__placeholder {
  font-size: var(--text-2xl);
}

.journal-page__vine-deco {
  font-size: var(--text-xl);
  opacity: 0.7;
}

.journal-page__stamps-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--space-2);
  width: 100%;
  min-width: 0;
  align-items: start;

  @media (max-width: 420px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.journal-page__stamp-wrapper {
  min-width: 0;
  width: 100%;
  display: flex;
  justify-content: center;
}

.journal-page__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.journal-page__traits {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.journal-page__progress-value {
  font-family: var(--font-readable);
  font-size: var(--text-sm);
  font-weight: 800;
  color: var(--color-primary);
}

.journal-page__points-value {
  font-family: var(--font-readable);
  font-size: var(--text-lg);
  font-weight: 900;
  color: var(--color-secondary);
}

.journal-page__actions {
  display: grid;
  gap: var(--space-3);
  width: 100%;

  @media (min-width: $bp-md) {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
