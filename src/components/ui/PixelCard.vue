<script setup lang="ts">
import type { ConservationStatus } from '@/domain/enums'
import { STATUS_COLORS } from '@/app/config'

const props = withDefaults(
  defineProps<{
    status?: ConservationStatus | string
    clickable?: boolean
    padding?: string
  }>(),
  {
    status: undefined,
    clickable: false,
    padding: 'var(--space-4)',
  },
)

const borderColor = props.status ? STATUS_COLORS[props.status] : 'var(--color-border)'
</script>

<template>
  <div
    :class="['pixel-card', { 'pixel-card--clickable': clickable }]"
    :style="{ '--card-border-color': borderColor, padding }"
    v-bind="$attrs"
  >
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.pixel-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  border: var(--pixel-border) solid var(--card-border-color, var(--color-border));
  box-shadow: 3px 3px 0 rgba(0,0,0,0.15);
  overflow: hidden;
  transition: transform var(--transition-base), box-shadow var(--transition-base);

  &--clickable {
    cursor: pointer;
    &:hover {
      transform: translateY(-2px);
      box-shadow: 4px 6px 0 rgba(0,0,0,0.2);
    }
    &:active {
      transform: translateY(0);
      box-shadow: 2px 2px 0 rgba(0,0,0,0.15);
    }
  }
}
</style>
