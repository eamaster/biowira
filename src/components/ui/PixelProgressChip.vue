<script setup lang="ts">
import { LEAF_POINTS_GAMEPLAY_ICON_KEY, formatLeafPointsCount } from '@/domain/pointsCurrency'
import GameplayIcon from './GameplayIcon.vue'

defineProps<{
  level: number
  points: number
  compact?: boolean
}>()
</script>

<template>
  <div
    :class="['progress-chip', { 'progress-chip--compact': compact }]"
    :aria-label="`Level ${level} · ${formatLeafPointsCount(points)} Leaf Points`"
  >
    <GameplayIcon :type="LEAF_POINTS_GAMEPLAY_ICON_KEY" size="20px" class="progress-chip__leaf-icon" />
    <span class="progress-chip__level">LEVEL {{ level }}</span>
    <span class="progress-chip__points">{{ formatLeafPointsCount(points) }} Leaf Points</span>
  </div>
</template>

<style scoped lang="scss">
.progress-chip {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-bg-card);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-full);
  padding: 8px 16px;
  box-shadow: 2px 2px 0 var(--color-primary-dark);

  &__leaf-icon {
    flex-shrink: 0;
  }

  &__level {
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-weight: 800;
    color: var(--color-primary);
    white-space: nowrap;
  }

  &__points {
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 700;
    color: var(--color-secondary);
    white-space: nowrap;
  }

  &--compact {
    padding: 5px 12px;
    .progress-chip__level  { font-size: var(--text-base); }
    .progress-chip__points { font-size: 14px; }
  }
}
</style>
