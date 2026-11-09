<script setup lang="ts">
import { STATUS_COLORS, STATUS_LABELS } from '@/app/config'
import { ConservationStatus } from '@/domain/enums'

const entries = Object.values(ConservationStatus).map((s) => ({
  status: s,
  color: STATUS_COLORS[s] ?? '#888',
  label: STATUS_LABELS[s] ?? s,
}))
</script>

<template>
  <div class="pixel-legend">
    <div v-for="entry in entries" :key="entry.status" class="pixel-legend__item">
      <span class="pixel-legend__dot" :style="{ background: entry.color }"></span>
      <span class="pixel-legend__label">{{ entry.label }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pixel-legend {
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  box-shadow: 2px 2px 0 var(--color-border);

  &__item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
    border: 1px solid rgba(0,0,0,0.2);
  }

  &__label {
    font-family: var(--font-readable);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text);
    white-space: nowrap;
  }
}
</style>
