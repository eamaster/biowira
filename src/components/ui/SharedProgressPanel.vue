<script setup lang="ts">
import PixelProgressBar from './PixelProgressBar.vue'
import GameplayIcon from './GameplayIcon.vue'
import { LEAF_POINTS_GAMEPLAY_ICON_KEY, LEAF_POINTS_LABEL, formatLeafPointsCount } from '@/domain/pointsCurrency'

defineProps<{
  points: number
  level: number
  levelTitle: string
  levelProgressPercent: number
  /** Optional: points earned in the most recent activity (shown as +N PTS) */
  pointsEarned?: number
  /** Compact layout for nav chips / inline display */
  compact?: boolean
  /** Enlarged styling for result pages; 'mission' is readable on Nature Missions */
  variant?: 'default' | 'result' | 'mission'
}>()
</script>

<template>
  <div 
    class="shared-progress" 
    :class="{ 
      'shared-progress--compact': compact,
      'shared-progress--result': variant === 'result',
      'shared-progress--mission': variant === 'mission'
    }"
  >
    <!-- Points earned this session (quiz result, etc.) -->
    <div v-if="pointsEarned !== undefined && pointsEarned > 0" class="shared-progress__earned">
      <div class="shared-progress__earned-icon" aria-hidden="true">
        <GameplayIcon
          :type="LEAF_POINTS_GAMEPLAY_ICON_KEY"
          :size="variant === 'result' ? '48px' : '32px'"
        />
      </div>
      <div>
        <div class="shared-progress__earned-label">{{ LEAF_POINTS_LABEL }} earned</div>
        <div class="shared-progress__earned-value">+{{ formatLeafPointsCount(pointsEarned) }}</div>
      </div>
    </div>

    <!-- Cumulative total -->
    <div class="shared-progress__total">
      <div class="shared-progress__total-label">Total {{ LEAF_POINTS_LABEL }}</div>
      <div class="shared-progress__total-points">
        <GameplayIcon
          :type="LEAF_POINTS_GAMEPLAY_ICON_KEY"
          :size="variant === 'mission' ? '22px' : '16px'"
          class="shared-progress__inline-icon"
        />
        {{ formatLeafPointsCount(points) }}
      </div>
    </div>

    <!-- Level progress -->
    <div class="shared-progress__level">
      <div class="shared-progress__level-label">LEVEL PROGRESS</div>
      <PixelProgressBar
        :value="levelProgressPercent"
        :max="100"
        color="var(--color-primary)"
      />
      <div class="shared-progress__level-name">
        <GameplayIcon
          :type="LEAF_POINTS_GAMEPLAY_ICON_KEY"
          :size="variant === 'mission' ? '16px' : '12px'"
          class="shared-progress__inline-icon"
        />
        LEVEL {{ level }} — {{ levelTitle }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.shared-progress {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }

  &--compact {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-2);
  }

  > * {
    background: var(--color-bg);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    text-align: center;
    box-shadow: 2px 2px 0 var(--color-border);
  }

  /* Nature Missions: one column, larger type — avoids cramped 3-up grid on that page */
  &--mission {
    grid-template-columns: 1fr;
    gap: var(--space-4);

    @media (min-width: 640px) {
      grid-template-columns: 1fr 1fr;
      gap: var(--space-5);
    }

    > * {
      padding: var(--space-5);
    }

    .shared-progress__total-label,
    .shared-progress__level-label {
      font-size: 13px;
      color: var(--color-text);
      font-weight: 800;
    }

    .shared-progress__total-points {
      font-size: 18px;
    }

    .shared-progress__level-name {
      font-size: 13px;
      line-height: 1.35;
      flex-wrap: wrap;
      text-align: center;
      max-width: 100%;
    }

    :deep(.progress-bar__track) {
      height: 26px;
    }

    :deep(.progress-bar__fill) {
      min-width: 12px;
    }
  }

  /* Result Variant Overrides (Strictly isolated to Quiz Result Page) */
  &--result {
    gap: var(--space-6);

    @media (max-width: 600px) {
      gap: var(--space-4);
    }

    > * {
      padding: var(--space-6);
      border-width: 3px;
    }

    .shared-progress__earned-label,
    .shared-progress__total-label,
    .shared-progress__level-label {
      font-size: 12px; /* Kids text sizing */
      color: var(--color-text); /* Higher contrast */
      font-weight: 800;
    }

    .shared-progress__earned-value {
      font-size: 20px;
    }

    .shared-progress__total-points {
      font-size: 14px;
    }

    .shared-progress__level-name {
      font-size: 12px;
    }
  }

  &__earned-icon { display: flex; align-items: center; justify-content: center; }
  &__earned-label,
  &__total-label,
  &__level-label {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 800;
    color: var(--color-text-muted);
    text-transform: uppercase;
  }
  &__earned-value {
    font-family: var(--font-readable);
    font-size: var(--text-lg);
    color: var(--color-primary);
    font-weight: 900;
  }
  &__total-points {
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-weight: 800;
    color: var(--color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__inline-icon {
    vertical-align: middle;
    flex-shrink: 0;
  }
  &__level-name {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 800;
    color: var(--color-primary);
    margin-top: var(--space-1);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
