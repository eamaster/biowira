<script setup lang="ts">
/**
 * EcoComicJournalRecord — Eco-Comic journal stamp page.
 * Uses WEBP sprites from the central asset registry.
 *
 * Prototype: eco_comic_journal_pangolin.png / eco_comic_journal_locked.png
 */
import { computed } from 'vue'
import type { GameJournalRecord, GameJournalStampDefinition } from '@/domain/gameJournal'
import {
  GAME_JOURNAL_ASSETS,
  getEcoComicStampAsset,
} from '../../data/gameJournalAssetRegistry'
import JournalBookFrame from '../JournalBookFrame.vue'
import PixelProgressBar from '@/components/ui/PixelProgressBar.vue'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'
import { LEAF_POINTS_GAMEPLAY_ICON_KEY, LEAF_POINTS_LABEL, formatLeafPointsCount } from '@/domain/pointsCurrency'
import { getStoryById } from '@/features/eco-comics/data/ecoComicStoryCatalog'

const props = defineProps<{
  record: GameJournalRecord
  stampDefs: Array<GameJournalStampDefinition & { isUnlocked: boolean }>
  /** @deprecated Restoration is read from record.restorationPercent* fields. */
  rainforestPercent?: number
}>()

const catalogStory = computed(() =>
  props.record.metadata?.storyId ? getStoryById(props.record.metadata.storyId) : undefined,
)

const storyDescription = computed(
  () =>
    props.record.description ||
    catalogStory.value?.completionImpactLine ||
    '',
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
    <!-- LEFT: Rescued Animal pangolin card WEBP -->
    <template #left>
      <div class="eco-left">
        <div class="eco-left__card-wrap">
          <img
            :src="GAME_JOURNAL_ASSETS.ecoComic.pangolinCard"
            alt="Rescued Animal — Sunda Pangolin"
            class="eco-left__card-img"
          />
        </div>
      </div>
    </template>

    <!-- CENTER: Collectible stamp WEBPs (unlocked) or locked stamp WEBP -->
    <template #center>
      <div class="eco-center">
        <div class="eco-center__stamps" aria-label="Eco-Comic ending stamps">
          <div
            v-for="stamp in stampDefs"
            :key="stamp.stampId"
            class="eco-center__stamp"
            :class="[
              stamp.isUnlocked ? 'eco-center__stamp--unlocked' : 'eco-center__stamp--locked',
              stamp.isUnlocked ? 'journal-stamp--unlocked' : 'journal-stamp--locked',
            ]"
            :aria-label="`${stamp.title} — ${stamp.isUnlocked ? 'unlocked' : 'locked'}`"
            :data-testid="`journal-stamp-${stamp.stampId}`"
          >
            <!-- Stamp WEBP: locked art already includes lock treatment -->
            <div class="eco-center__stamp-img-wrap">
              <img
                :src="getEcoComicStampAsset(stamp.stampId, stamp.isUnlocked)"
                :alt="stamp.isUnlocked ? stamp.title : `Locked: ${stamp.title}`"
                class="eco-center__stamp-img"
                :class="{ 'eco-center__stamp-img--locked': !stamp.isUnlocked }"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- RIGHT: Story info + stats -->
    <template #right>
      <div class="eco-right">
        <h3 class="eco-right__heading">Story Description</h3>
        <p class="eco-right__desc">{{ storyDescription }}</p>

        <!-- Description decorative icon from registry -->
        <div class="eco-right__deco" aria-hidden="true">
          <img
            :src="GAME_JOURNAL_ASSETS.ecoComic.descriptionIcon"
            alt=""
            class="eco-right__deco-img"
          />
        </div>

        <div class="eco-right__stat">
          <span class="eco-right__stat-label">🌿 Rainforest Restored</span>
          <PixelProgressBar :value="restAfter" :max="100" />
          <span class="eco-right__stat-value eco-right__stat-value--restore">
            {{ restBefore }}% → {{ restAfter }}%
          </span>
          <span class="eco-right__stat-delta" :class="restDelta > 0 ? 'eco-right__stat-delta--positive' : ''">
            {{ restLabel }}
          </span>
        </div>

        <div class="eco-right__stat">
          <span class="eco-right__stat-label">
            <GameplayIcon
              :type="LEAF_POINTS_GAMEPLAY_ICON_KEY"
              size="14px"
              :alt="LEAF_POINTS_LABEL"
            />
            {{ LEAF_POINTS_LABEL }} Rewarded
          </span>
          <!-- Use record.leafPointsEarned so each journal page shows what was earned in that session -->
          <span class="eco-right__stat-value eco-right__stat-value--points">
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
.eco-left {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;

  &__card-wrap {
    width: 100%;
    max-width: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__card-img {
    width: 100%;
    height: auto;
    object-fit: contain;
    display: block;
    border-radius: var(--radius-sm);
  }
}

// ── Center ───────────────────────────────────────────────────
.eco-center {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  justify-content: center;

  &__stamps {
    display: flex;
    flex-direction: column;
    gap: var(--journal-eco-stamp-stack-gap);
    flex: 0 1 auto;
    justify-content: flex-start;
    align-items: center;
    align-self: center;
  }

  &__stamp:not(:first-child) {
    margin-top: calc(-1 * var(--journal-eco-stamp-stack-pull));
  }

  &__stamp {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;

    &--unlocked {
      opacity: 1;
    }

    &--locked {
      opacity: 0.7;
    }
  }

  &__stamp-img-wrap {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    line-height: 0;
  }

  &__stamp-img {
    width: var(--journal-eco-stamp-img-size);
    height: var(--journal-eco-stamp-img-size);
    object-fit: contain;
    flex-shrink: 0;
    display: block;
    border-radius: var(--radius-sm);

    &--locked {
      filter: grayscale(0.6) brightness(0.75);
    }
  }
}

// ── Right ────────────────────────────────────────────────────
.eco-right {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  height: 100%;
  padding-right: var(--space-1);

  &__heading {
    font-family: var(--font-readable);
    font-size: clamp(13px, 1.6vw, 16px);
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
    justify-content: flex-end;
  }

  &__deco-img {
    width: clamp(36px, 5vw, 60px);
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
