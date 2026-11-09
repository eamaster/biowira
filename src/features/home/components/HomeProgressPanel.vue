<script setup lang="ts">
import PixelProgressBar from '@/components/ui/PixelProgressBar.vue'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'
import {
  LEAF_POINTS_GAMEPLAY_ICON_KEY,
  LEAF_POINTS_LABEL,
  formatLeafPointsCount,
} from '@/domain/pointsCurrency'

defineProps<{
  points: number
  level: number
  levelTitle: string
  levelProgressPercent: number
}>()
</script>

<template>
  <div class="hpp" role="region" aria-label="Your Progress">
    <!-- Total Leaf Points -->
    <div class="hpp__points">
      <p class="hpp__sub-label">Total {{ LEAF_POINTS_LABEL }}</p>
      <div class="hpp__points-value">
        <GameplayIcon
          :type="LEAF_POINTS_GAMEPLAY_ICON_KEY"
          size="28px"
          class="hpp__leaf-icon"
        />
        <span>{{ formatLeafPointsCount(points) }}</span>
      </div>
    </div>

    <!-- Vertical divider (desktop) / Horizontal divider (mobile) -->
    <div class="hpp__divider" aria-hidden="true"></div>

    <!-- Level Progress -->
    <div class="hpp__level">
      <p class="hpp__sub-label">Level Progress</p>
      <PixelProgressBar
        :value="levelProgressPercent"
        :max="100"
        color="var(--color-primary)"
      />
      <p class="hpp__level-name">
        <GameplayIcon
          :type="LEAF_POINTS_GAMEPLAY_ICON_KEY"
          size="14px"
          class="hpp__leaf-icon-sm"
        />
        Level {{ level }} – {{ levelTitle }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.hpp {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
  min-width: 0;

  // Panel background lives on `.home-page__dashboard-panel` (progess-card.webp)

  /* Below sm: divider is horizontal — must stack so `width:100%` on the rule
     does not sit in a row flex (would claim full row width and crush `.hpp__level`). */
  @media (max-width: $bp-sm) {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }

  &__points {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    flex: 0 0 auto;
    min-width: 120px;

    @media (max-width: $bp-sm) {
      align-items: flex-start;
    }
  }

  &__points-value {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-readable);
    font-size: clamp(20px, 3vw + 12px, 34px);
    font-weight: 900;
    color: var(--color-secondary);
    line-height: 1;
    white-space: nowrap;
  }

  &__leaf-icon {
    flex-shrink: 0;
  }

  &__leaf-icon-sm {
    flex-shrink: 0;
    vertical-align: middle;
  }

  &__divider {
    width: 2px;
    align-self: stretch;
    background: var(--color-border-light);
    border-radius: 2px;
    flex: 0 0 auto;
    flex-shrink: 0;

    @media (max-width: $bp-sm) {
      width: 100%;
      height: 2px;
      align-self: stretch;
    }
  }

  &__level {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    flex: 1 1 0;
    min-width: 0;

    @media (max-width: $bp-sm) {
      flex: 1 1 auto;
      width: 100%;
    }
  }

  &__sub-label {
    font-family: var(--font-readable);
    font-size: var(--home-font-progress-label, var(--text-sm));
    font-weight: 800;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0;
  }

  &__level-name {
    font-family: var(--font-readable);
    font-size: var(--home-font-progress-label, var(--text-sm));
    font-weight: 800;
    color: var(--color-primary);
    display: flex;
    align-items: center;
    gap: var(--space-1);
    margin: 0;
    flex-wrap: wrap;
  }
}
</style>
