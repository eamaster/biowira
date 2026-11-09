<script setup lang="ts">
/**
 * MissionResultPage — shown after a Nature Mission is successfully completed.
 * Reads latestMissionResult from missionStore (fixed values from the journal record).
 */
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/app/config'
import { useMissionStore } from '@/stores/missionStore'
import { useProgressStore } from '@/stores/progressStore'
import { useAppAudio } from '@/composables/useAppAudio'
import BioWiraScenePage from '@/components/layout/BioWiraScenePage.vue'
import PixelButton from '@/components/ui/PixelButton.vue'
import PixelProgressBar from '@/components/ui/PixelProgressBar.vue'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'
import AnimalIcon from '@/components/ui/AnimalIcon.vue'
import {
  LEAF_POINTS_GAMEPLAY_ICON_KEY,
  LEAF_POINTS_LABEL,
  formatLeafPointsCount,
} from '@/domain/pointsCurrency'
import {
  formatMissionDurationEstimate,
  labelMissionEnvironment,
} from '@/domain/mission'
import { stripDisplayEmoji } from '@/domain/displayText'
import { resolveMissionCardTitleDisplay } from '@/features/game-journal/data/journalMissionMapping'
import { findExplorerAnimalChoice } from '@/features/welcome/data/explorerAnimalCatalog'

const router = useRouter()
const missionStore = useMissionStore()
const progressStore = useProgressStore()
const { sfx } = useAppAudio()

const result = computed(() => missionStore.latestMissionResult)

onMounted(() => {
  if (!result.value) {
    router.replace({ name: ROUTE_NAMES.missions })
    return
  }
  setTimeout(() => sfx('achievement'), 600)
})

const totalLeafPoints = computed(() =>
  progressStore.progress != null
    ? progressStore.leafPoints
    : (result.value?.leafPointsEarned ?? 0),
)

const levelProgressPercent = computed(() => progressStore.levelProgressPercent)
const levelSummary = computed(
  () => `LV ${progressStore.level} — ${progressStore.levelTitle}`,
)

const restorationBefore = computed(() => result.value?.restorationPercentBefore ?? 0)
const restorationAfter = computed(() => result.value?.restorationPercentAfter ?? 0)
const restorationDelta = computed(() => result.value?.restorationPercentDelta ?? 0)

const restorationLabel = computed(() => {
  if (restorationDelta.value > 0) return `+${restorationDelta.value}% Restoration`
  return 'Already restored for this stamp'
})

const missionCardTitle = computed(() =>
  result.value ? resolveMissionCardTitleDisplay(result.value.missionTitle) : null,
)

const mascotIconKey = computed(() => missionCardTitle.value?.animalIconKey ?? 'malayan-tiger')

const mascotFallbackEmoji = computed(() => {
  const id = missionCardTitle.value?.animalIconKey
  const fromCatalog = id ? findExplorerAnimalChoice(id)?.fallbackEmoji : undefined
  return fromCatalog ?? missionCardTitle.value?.animalFallbackEmoji ?? '🌿'
})

const missionTitleDisplay = computed(() => missionCardTitle.value?.titleText ?? '')

const missionDurationLabel = computed(() =>
  result.value
    ? formatMissionDurationEstimate(result.value.missionDurationMinutes)
    : '—',
)

const missionSettingLabel = computed(() =>
  result.value ? labelMissionEnvironment(result.value.missionEnvironment) : '—',
)

const stampTitleDisplay = computed(() => {
  if (!result.value) return ''
  const plain = stripDisplayEmoji(result.value.stampTitle)
  return plain.length > 0 ? plain : result.value.stampTitle
})

function goMissions() {
  void router.push({ name: ROUTE_NAMES.missions })
}

function goJournal() {
  void router.push({ name: ROUTE_NAMES.gameJournalMenu })
}

function goGames() {
  void router.push({ name: ROUTE_NAMES.games })
}

function goHome() {
  void router.push({ name: ROUTE_NAMES.home })
}
</script>

<template>
  <BioWiraScenePage
    title="Mission Complete!"
    subtitle="Nature Mission"
    content-width="wide"
    show-animal-chat
    animal-chat-placement="sky-left"
  >
    <template v-if="!result">
      <div class="mission-result__guard" role="status">
        <p>Loading your results…</p>
      </div>
    </template>

    <template v-else>
      <div class="mission-result" data-testid="mission-result-page">
        <div class="mission-result__stack">
          <section
            class="mission-result__summary"
            aria-label="Completed mission summary"
          >
            <div class="mission-result__summary-grid">
              <div class="mission-result__mascot" aria-hidden="true">
                <AnimalIcon
                  :icon-key="mascotIconKey"
                  :fallback-emoji="mascotFallbackEmoji"
                  size="clamp(72px, 12vw, 120px)"
                />
              </div>
              <div class="mission-result__summary-copy">
                <h2 class="mission-result__mission-title" data-testid="mission-result-title">
                  <GameplayIcon
                    class="mission-result__title-spirit"
                    type="missions"
                    size="clamp(22px, 3vw, 30px)"
                    alt=""
                  />
                  <span class="mission-result__mission-title-text">{{ missionTitleDisplay }}</span>
                </h2>
                <p class="mission-result__mission-desc" data-testid="mission-result-description">
                  {{ result.missionDescription }}
                </p>

                <div class="mission-result__meta" role="list">
                  <div class="mission-result__meta-item" role="listitem">
                    <GameplayIcon
                      class="mission-result__meta-spirit"
                      type="missions"
                      size="22px"
                      alt=""
                    />
                    <div class="mission-result__meta-text">
                      <span class="mission-result__meta-label">Mission time</span>
                      <span class="mission-result__meta-value">{{ missionDurationLabel }}</span>
                    </div>
                  </div>
                  <div class="mission-result__meta-item" role="listitem">
                    <GameplayIcon
                      class="mission-result__meta-spirit"
                      type="pawTrail"
                      size="22px"
                      alt=""
                    />
                    <div class="mission-result__meta-text">
                      <span class="mission-result__meta-label">Mission type</span>
                      <span class="mission-result__meta-value">{{ missionSettingLabel }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div class="mission-result__stats" role="list" aria-label="Rewards and progress">
            <div
              class="mission-result__stat-card"
              role="listitem"
              data-testid="mission-result-leaf-points-chip"
            >
              <GameplayIcon
                :type="LEAF_POINTS_GAMEPLAY_ICON_KEY"
                size="32px"
                :alt="LEAF_POINTS_LABEL"
              />
              <span class="mission-result__stat-strong">
                +{{ formatLeafPointsCount(result.leafPointsEarned) }}
              </span>
              <span class="mission-result__stat-line">
                Total: {{ formatLeafPointsCount(totalLeafPoints) }}
              </span>
              <span class="mission-result__stat-caption">{{ LEAF_POINTS_LABEL }}</span>
            </div>

            <div
              class="mission-result__stat-card"
              role="listitem"
              data-testid="mission-result-level-chip"
            >
              <GameplayIcon
                class="mission-result__stat-spirit"
                type="trophy"
                size="32px"
                alt=""
              />
              <PixelProgressBar
                :value="levelProgressPercent"
                :max="100"
                class="mission-result__stat-bar"
              />
              <span class="mission-result__stat-line">{{ levelSummary }}</span>
              <span class="mission-result__stat-caption">Level progress</span>
            </div>

            <div
              class="mission-result__stat-card"
              role="listitem"
              data-testid="mission-result-restoration-chip"
            >
              <GameplayIcon
                class="mission-result__stat-spirit"
                type="habitatForest"
                size="32px"
                alt=""
              />
              <PixelProgressBar
                :value="restorationAfter"
                :max="100"
                class="mission-result__stat-bar"
              />
              <span
                class="mission-result__stat-strong"
                data-testid="mission-result-restoration-range"
              >
                {{ restorationBefore }}% → {{ restorationAfter }}%
              </span>
              <span
                class="mission-result__stat-delta"
                :class="restorationDelta > 0 ? 'mission-result__stat-delta--positive' : ''"
                data-testid="mission-result-restoration-delta"
              >
                {{ restorationLabel }}
              </span>
              <span class="mission-result__stat-caption">Rainforest restored</span>
            </div>

            <div
              class="mission-result__stat-card mission-result__stat-card--stamp"
              role="listitem"
              data-testid="mission-result-stamp-chip"
            >
              <GameplayIcon
                class="mission-result__stat-spirit"
                type="journalPassport"
                size="32px"
                alt=""
              />
              <span class="mission-result__stat-strong">{{ stampTitleDisplay }}</span>
              <span class="mission-result__stat-line">Added to Journal!</span>
              <span class="mission-result__stat-caption">Journal stamp</span>
            </div>
          </div>

          <div class="mission-result__actions">
            <PixelButton
              variant="green"
              size="md"
              full-width
              data-testid="mission-result-new-mission-btn"
              @click="goMissions"
            >
              <span class="mission-result__action-inner">
                <GameplayIcon type="missions" size="18px" alt="" />
                Play Again
              </span>
            </PixelButton>
            <PixelButton
              variant="orange"
              size="md"
              full-width
              data-testid="mission-result-open-journal-btn"
              @click="goJournal"
            >
              Open Journal Book
            </PixelButton>
            <PixelButton
              variant="blue"
              size="md"
              full-width
              data-testid="mission-result-try-mission-btn"
              @click="goGames"
            >
              Try Mission
            </PixelButton>
            <PixelButton
              variant="gray"
              size="md"
              full-width
              data-testid="mission-result-continue-btn"
              @click="goHome"
            >
              Continue
            </PixelButton>
          </div>
        </div>
      </div>
    </template>
  </BioWiraScenePage>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;
@use '@/styles/mixins/result_page_actions_grid' as *;

.mission-result {
  width: 100%;
  min-height: 0;
}

.mission-result__guard {
  display: flex;
  justify-content: center;
  padding: var(--space-8);
  font-family: var(--font-body);
  font-weight: 700;
  color: var(--color-text-muted);
}

.mission-result__stack {
  width: min(100%, clamp(760px, 78vw, 1180px));
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: clamp(var(--space-4), 2vh, var(--space-6));
  padding: clamp(var(--space-3), 2vh, var(--space-5)) var(--space-2) var(--space-4);
  box-sizing: border-box;
}

.mission-result__summary {
  background: var(--scene-warm-panel-bg);
  border: var(--pixel-border) solid var(--scene-warm-panel-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--scene-warm-panel-shadow);
  padding: clamp(var(--space-4), 2.5vw, var(--space-6));
  backdrop-filter: blur(2px);
}

.mission-result__summary-grid {
  display: grid;
  gap: var(--space-4);
  align-items: center;

  @media (min-width: $bp-md) {
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--space-5);
  }
}

.mission-result__mascot {
  display: flex;
  justify-content: center;
  line-height: 0;

  @media (min-width: $bp-md) {
    justify-content: flex-start;
  }
}

.mission-result__summary-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

.mission-result__mission-title {
  font-family: var(--font-readable);
  font-size: clamp(18px, 2.4vw, 26px);
  font-weight: 900;
  color: var(--color-primary-dark);
  margin: 0;
  line-height: 1.25;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.mission-result__title-spirit {
  flex-shrink: 0;
}

.mission-result__mission-title-text {
  min-width: 0;
}

.mission-result__mission-desc {
  font-family: var(--font-body);
  font-size: clamp(14px, 1.6vw, 16px);
  font-weight: 700;
  color: var(--color-text-light);
  line-height: 1.5;
  margin: 0;
}

.mission-result__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-top: var(--space-1);
}

.mission-result__meta-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  min-width: min(100%, 200px);
}

.mission-result__meta-spirit {
  flex-shrink: 0;
  margin-top: 2px;
  line-height: 0;
}

.mission-result__meta-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mission-result__meta-label {
  font-family: var(--font-readable);
  font-size: var(--text-xs);
  font-weight: 800;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mission-result__meta-value {
  font-family: var(--font-readable);
  font-size: var(--text-base);
  font-weight: 900;
  color: var(--color-text);
}

.mission-result__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);

  @media (max-width: $bp-lg) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
}

.mission-result__stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  min-height: 140px;
  padding: var(--space-4) var(--space-3);
  background: var(--color-bg-card);
  border: var(--pixel-border) solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--pixel-shadow);
  text-align: center;

  &--stamp {
    background: var(--color-bg-card);
    border-color: var(--color-secondary);
  }
}

.mission-result__stat-spirit {
  line-height: 0;
}

.mission-result__stat-strong {
  font-family: var(--font-readable);
  font-size: var(--text-base);
  font-weight: 900;
  color: var(--color-secondary);
  line-height: 1.3;
}

.mission-result__stat-line {
  font-family: var(--font-readable);
  font-size: var(--text-sm);
  font-weight: 800;
  color: var(--color-text);
}

.mission-result__stat-caption {
  font-family: var(--font-readable);
  font-size: var(--text-xs);
  font-weight: 800;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mission-result__stat-bar {
  width: 100%;
}

.mission-result__stat-delta {
  font-family: var(--font-readable);
  font-size: var(--text-xs);
  font-weight: 800;
  color: var(--color-text-muted);

  &--positive {
    color: var(--color-primary);
  }
}

.mission-result__actions {
  @include result-page-actions-grid(4);
}

.mission-result__action-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}
</style>
