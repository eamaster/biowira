<script setup lang="ts">
/**
 * NatureMissionJournalRecord — Nature Mission journal stamp page.
 * Uses WEBP sprites from the central asset registry via journalMissionMapping.
 *
 * Prototype: nature_mission_journal_tiger.png / sunbear.png / orangutan.png
 */
import { computed } from 'vue'
import type { GameJournalRecord } from '@/domain/gameJournal'
import { resolveMissionJournalDisplay } from '../../data/journalMissionMapping'
import JournalBookFrame from '../JournalBookFrame.vue'
import PixelProgressBar from '@/components/ui/PixelProgressBar.vue'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'
import { LEAF_POINTS_GAMEPLAY_ICON_KEY, LEAF_POINTS_LABEL, formatLeafPointsCount } from '@/domain/pointsCurrency'

const props = defineProps<{
  record: GameJournalRecord
  /** @deprecated Pass the record; restoration is read from record.restorationPercent* fields. */
  rainforestPercent?: number
}>()

const missionTitle = computed(
  () => props.record.metadata?.missionTitle || props.record.title,
)

const missionDisplay = computed(() => resolveMissionJournalDisplay(missionTitle.value))
const missionAssets  = computed(() => missionDisplay.value.assets)

const hasWebpCard  = computed(() => Boolean(missionAssets.value.animalCardAsset))
const hasWebpStamp = computed(() => Boolean(missionAssets.value.stampAsset))

const missionDescription = computed(
  () => props.record.description || 'Completed a nature mission and helped protect the rainforest!',
)

// Fixed restoration values from the record (AC3)
const restAfter  = computed(() => props.record.restorationPercentAfter  ?? props.rainforestPercent ?? 0)
const restBefore = computed(() => props.record.restorationPercentBefore ?? 0)
const restDelta  = computed(() => props.record.restorationPercentDelta  ?? Math.max(0, restAfter.value - restBefore.value))
const restLabel  = computed(() =>
  restDelta.value > 0 ? `+${restDelta.value}% this session` : 'Already restored for this stamp',
)
</script>

<template>
  <JournalBookFrame>
    <!-- LEFT: Mission Animal card WEBP or CSS polaroid fallback -->
    <template #left>
      <div class="mission-left">
        <template v-if="hasWebpCard">
          <img
            :src="missionAssets.animalCardAsset"
            :alt="`Mission Animal — ${missionDisplay.animalName}`"
            class="mission-left__card-webp"
          />
        </template>

        <template v-else>
          <div class="mission-left__polaroid">
            <div class="mission-left__label">Mission Animal</div>
            <div class="mission-left__img-wrap">
              <img
                v-if="missionDisplay.animalIconUrl"
                :src="missionDisplay.animalIconUrl"
                :alt="missionDisplay.animalName"
                class="mission-left__img"
              />
              <span v-else aria-hidden="true" class="mission-left__emoji">
                {{ missionDisplay.animalEmoji }}
              </span>
            </div>
            <div class="mission-left__name">{{ missionDisplay.animalName }}</div>
          </div>
        </template>
      </div>
    </template>

    <!-- CENTER: Mission stamp WEBP or CSS stamp card fallback -->
    <template #center>
      <div class="mission-center">
        <div
          class="mission-center__stamp"
          :aria-label="`${missionTitle} mission stamp`"
          :data-testid="`journal-stamp-${record.stampId}`"
        >
          <template v-if="hasWebpStamp">
            <img
              :src="missionAssets.stampAsset"
              :alt="missionTitle"
              class="mission-center__stamp-webp"
            />
          </template>

          <template v-else>
            <div class="mission-center__title">{{ missionTitle }}</div>
            <div class="mission-center__art" aria-hidden="true">
              <img
                v-if="missionDisplay.animalIconUrl"
                :src="missionDisplay.animalIconUrl"
                :alt="missionDisplay.animalName"
                class="mission-center__art-img"
              />
              <span v-else class="mission-center__art-emoji">
                {{ missionDisplay.animalEmoji }}
              </span>
            </div>
            <div class="mission-center__caption">{{ missionTitle }}</div>
          </template>
        </div>
      </div>
    </template>

    <!-- RIGHT: Mission info + stats -->
    <template #right>
      <div class="mission-right">
        <h3 class="mission-right__heading">Mission Description</h3>
        <p class="mission-right__desc">{{ missionDescription }}</p>

        <!-- Description decorative icons from registry -->
        <div
          v-if="missionAssets.descriptionIconAssets.length"
          class="mission-right__deco"
          aria-hidden="true"
        >
          <img
            v-for="(iconSrc, idx) in missionAssets.descriptionIconAssets"
            :key="idx"
            :src="iconSrc"
            alt=""
            class="mission-right__deco-img"
          />
        </div>
        <div v-else class="mission-right__deco" aria-hidden="true">
          <span>🧭</span><span>🌿</span>
        </div>

        <div class="mission-right__stat">
          <span class="mission-right__stat-label">🌿 Rainforest Restored</span>
          <PixelProgressBar :value="restAfter" :max="100" />
          <span class="mission-right__stat-value mission-right__stat-value--restore">
            {{ restBefore }}% → {{ restAfter }}%
          </span>
          <span class="mission-right__stat-delta" :class="restDelta > 0 ? 'mission-right__stat-delta--positive' : ''">
            {{ restLabel }}
          </span>
        </div>

        <div class="mission-right__stat">
          <span class="mission-right__stat-label">
            <GameplayIcon :type="LEAF_POINTS_GAMEPLAY_ICON_KEY" size="14px" :alt="LEAF_POINTS_LABEL" />
            {{ LEAF_POINTS_LABEL }} Rewarded
          </span>
          <span class="mission-right__stat-value mission-right__stat-value--points">
            {{ formatLeafPointsCount(record.leafPointsEarned) }}
          </span>
        </div>
      </div>
    </template>
  </JournalBookFrame>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

// ── Left ─────────────────────────────────────────────────────
.mission-left {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;

  // WEBP card variant
  &__card-webp {
    width: 100%;
    max-width: 180px;
    height: auto;
    object-fit: contain;
    display: block;
    border-radius: var(--radius-sm);
  }

  // CSS polaroid fallback
  &__polaroid {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    background: #fffdf0;
    border: 3px solid #c8a870;
    border-radius: var(--radius-sm);
    padding: var(--space-3) var(--space-4) var(--space-4);
    box-shadow: 3px 3px 0 rgba(61, 43, 31, 0.18);
    max-width: 160px;
    width: 100%;
    position: relative;

    &::before, &::after {
      content: '';
      position: absolute;
      width: 26px;
      height: 12px;
      background: rgba(200, 168, 80, 0.5);
      border-radius: 2px;
    }
    &::before { top: -6px; left: 14px; transform: rotate(-8deg); }
    &::after  { top: -6px; right: 14px; transform: rotate(8deg); }
  }

  &__label {
    font-family: var(--font-readable);
    font-size: 10px;
    font-weight: 900;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: rgba(200, 155, 40, 0.15);
    padding: 2px 8px;
    border-radius: 4px;
  }

  &__img-wrap {
    width: 80px;
    height: 80px;
    background: #f0e8d0;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  &__img { width: 72px; height: 72px; object-fit: contain; }
  &__emoji { font-size: 46px; line-height: 1; }

  &__name {
    font-family: var(--font-readable);
    font-size: clamp(12px, 1.4vw, 14px);
    font-weight: 900;
    color: var(--color-text);
    text-align: center;
  }
}

// ── Center ───────────────────────────────────────────────────
.mission-center {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;

  &__stamp {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
  }

  // WEBP stamp variant
  &__stamp-webp {
    width: 100%;
    max-width: 220px;
    height: auto;
    object-fit: contain;
    display: block;
    border-radius: var(--radius-md);
  }

  // CSS fallback stamp
  &__title {
    font-family: var(--font-readable);
    font-size: clamp(10px, 1.3vw, 13px);
    font-weight: 900;
    color: var(--color-text);
    text-align: center;
    line-height: 1.3;
  }

  &__art {
    width: 100%;
    background: #e8dfc8;
    border: 2px dashed #c8a870;
    border-radius: var(--radius-sm);
    padding: var(--space-3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__art-img { width: 68px; height: 68px; object-fit: contain; }
  &__art-emoji { font-size: 44px; line-height: 1; }

  &__caption {
    font-family: var(--font-readable);
    font-size: 10px;
    font-weight: 800;
    color: var(--color-text-muted);
    text-align: center;
  }
}

// ── Right ────────────────────────────────────────────────────
.mission-right {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  height: 100%;

  &__heading {
    font-family: var(--font-readable);
    font-size: clamp(12px, 1.6vw, 15px);
    font-weight: 900;
    color: var(--color-text);
    margin: 0;
  }

  &__desc {
    font-family: var(--font-body);
    font-size: clamp(11px, 1.3vw, 13px);
    font-weight: 700;
    color: var(--color-text-light);
    line-height: 1.5;
    margin: 0;
    flex: 1;
  }

  &__deco {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
    font-size: 22px;
  }

  &__deco-img {
    width: clamp(28px, 4vw, 48px);
    height: auto;
    object-fit: contain;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__stat-label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-family: var(--font-readable);
    font-size: var(--text-xs);
    font-weight: 800;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__stat-value {
    font-family: var(--font-readable);
    font-weight: 900;

    &--restore { font-size: var(--text-sm); color: var(--color-primary); }
    &--points  { font-size: var(--text-lg); color: var(--color-secondary); }
  }

  &__stat-delta {
    font-family: var(--font-readable);
    font-size: var(--text-xs);
    font-weight: 800;
    color: var(--color-text-muted);

    &--positive { color: var(--color-primary); }
  }
}
</style>
