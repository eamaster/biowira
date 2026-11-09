<script setup lang="ts">
import { computed } from 'vue'
import { STATUS_COLORS, STATUS_LABELS } from '@/app/config'

const props = defineProps<{
  status: string
  /** When set (e.g. API-provided label), overrides STATUS_LABELS[status] */
  labelOverride?: string
  size?: 'sm' | 'md'
}>()

const color = computed(() => STATUS_COLORS[props.status] ?? 'var(--color-border)')
const label = computed(
  () => props.labelOverride ?? STATUS_LABELS[props.status] ?? props.status,
)
</script>

<template>
  <span
    class="status-badge"
    :class="`status-badge--${size ?? 'md'}`"
    :style="{ background: color, borderColor: color }"
  >
    {{ label }}
  </span>
</template>

<style scoped lang="scss">
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 2px solid;
  border-radius: var(--radius-sm);
  color: #fff;
  font-family: var(--font-readable);
  font-weight: 700;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.3);

  &--sm { font-size: 12px; padding: 4px 8px; }
  &--md { font-size: var(--text-sm); padding: 6px 12px; }
}
</style>
