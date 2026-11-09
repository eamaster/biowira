<script setup lang="ts">
import {
  LEAF_POINTS_GAMEPLAY_ICON_KEY,
  LEAF_POINTS_LABEL,
  formatLeafPointsCount,
} from '@/domain/pointsCurrency'
import { resolveExplorerRescueSprite } from '../utils/explorerRescueSprites'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'
import PixelProgressBar from '@/components/ui/PixelProgressBar.vue'

/** Summarizes catalog progress — used on Explorer Rescue chapter (no profile avatar tie-in). */
export type RescueNeutralSummaryChip = {
  headline: string
  subline: string
  mascotSrc: string
}

const props = defineProps<{
  /** Preferred chapter layout — rainforest + leaf totals with neutral mascot. */
  neutralSummary?: RescueNeutralSummaryChip
  /** Legacy / other screens that still tie a mascot to Welcome explorer visuals. */
  explorerName?: string
  animalName?: string
  rainforestRestored: number
  leafPoints: number
  /** Visual key used when rendering the legacy explorer mascot image. */
  explorerVisualKey?: string
}>()
</script>

<template>
  <div class="rescue-info-chips">
    <!-- Catalog / rescue summary (chapter) -->
    <div
      v-if="neutralSummary"
      class="rescue-info-chips__chip rescue-info-chips__chip--explorer"
      data-testid="explorer-rescue-run-summary"
    >
      <div class="rescue-info-chips__chip-text">
        <span class="rescue-info-chips__chip-label">{{ neutralSummary.headline }}</span>
        <span class="rescue-info-chips__chip-value">{{ neutralSummary.subline }}</span>
      </div>
      <img
        class="rescue-info-chips__mascot"
        :src="neutralSummary.mascotSrc"
        alt=""
        draggable="false"
        aria-hidden="true"
      >
    </div>

    <!-- Legacy: profile explorer chip (games outside catalog selection) -->
    <div
      v-else
      class="rescue-info-chips__chip rescue-info-chips__chip--explorer"
      data-testid="explorer-rescue-current-explorer"
    >
      <div class="rescue-info-chips__chip-text">
        <span class="rescue-info-chips__chip-label">Current Explorer</span>
        <span class="rescue-info-chips__chip-value">{{ explorerName }}</span>
        <span
          v-if="animalName && animalName !== explorerName"
          class="rescue-info-chips__chip-sub"
        >
          {{ animalName }}
        </span>
      </div>
      <img
        class="rescue-info-chips__mascot"
        :src="resolveExplorerRescueSprite(explorerVisualKey ?? '')"
        alt=""
        draggable="false"
        aria-hidden="true"
      >
    </div>

    <!-- Rainforest Restored card -->
    <div
      class="rescue-info-chips__chip rescue-info-chips__chip--progress"
      data-testid="explorer-rescue-restored"
    >
      <span class="rescue-info-chips__chip-label">Rainforest Restored</span>
      <PixelProgressBar :value="rainforestRestored" :max="100" />
      <span class="rescue-info-chips__chip-value">{{ rainforestRestored }}% Restored</span>
    </div>

    <!-- Leaf Points card -->
    <div
      class="rescue-info-chips__chip"
      data-testid="explorer-rescue-leaf-points"
      :aria-label="`${LEAF_POINTS_LABEL}: ${leafPoints}`"
    >
      <span class="rescue-info-chips__chip-label">
        <GameplayIcon :type="LEAF_POINTS_GAMEPLAY_ICON_KEY" size="18px" class="rescue-info-chips__leaf-icon" />
        {{ LEAF_POINTS_LABEL }}
      </span>
      <span class="rescue-info-chips__chip-value rescue-info-chips__chip-value--gold">
        {{ formatLeafPointsCount(leafPoints) }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.rescue-info-chips {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  align-items: stretch;
  width: 100%;

  @media (max-width: $bp-lg) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    .rescue-info-chips__chip--progress {
      grid-column: span 2;
    }
  }

  @media (max-width: $bp-md) {
    grid-template-columns: 1fr;

    .rescue-info-chips__chip--progress {
      grid-column: auto;
    }
  }
}

.rescue-info-chips__chip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  min-width: 0;
  width: 100%;
  box-shadow: var(--pixel-shadow);

  &--progress {
    max-width: none;

    :deep(.progress-bar) {
      min-width: 0;
      width: 100%;
    }
  }

  &--explorer {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }
}

.rescue-info-chips__chip-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.rescue-info-chips__mascot {
  width: clamp(44px, 6vw, 68px);
  height: clamp(44px, 6vw, 68px);
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  flex-shrink: 0;
}

.rescue-info-chips__chip-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-readable);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.rescue-info-chips__leaf-icon {
  flex-shrink: 0;
}

.rescue-info-chips__chip-value {
  font-family: var(--font-readable);
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text);

  &--gold {
    color: var(--color-secondary);
  }
}

.rescue-info-chips__chip-sub {
  font-family: var(--font-readable);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
</style>
