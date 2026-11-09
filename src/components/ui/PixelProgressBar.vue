<script setup lang="ts">
import { computed } from 'vue'
import GameplayIcon from './GameplayIcon.vue'

const props = defineProps<{
  value: number
  max?: number
  color?: string
  label?: string
  showPercent?: boolean
}>()

const fillStyle = computed(() => {
  const max = props.max ?? 100
  const pct = Math.min(100, Math.max(0, (props.value / max) * 100))
  const background = props.color ?? 'var(--color-primary)'
  // Leave space for trailing icon; % of track minus overlap must not go negative at 0%
  return {
    width: `max(0px, calc(${pct}% - 12px))`,
    background,
  }
})
</script>

<template>
  <div class="progress-bar">
    <div v-if="label || showPercent" class="progress-bar__header">
      <span v-if="label" class="progress-bar__label">{{ label }}</span>
      <span v-if="showPercent" class="progress-bar__percent">{{ Math.round((value / (max ?? 100)) * 100) }}%</span>
    </div>
    <div class="progress-bar__track">
      <div
        class="progress-bar__fill"
        :style="fillStyle"
      ></div>
      <div class="progress-bar__icon">
        <GameplayIcon type="leafLevel" size="20px" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.progress-bar {
  width: 100%;

  &__header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  &__label {
    font-family: var(--font-readable);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-light);
  }
  &__percent {
    font-family: var(--font-readable);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-primary);
  }

  &__track {
    position: relative;
    height: 20px;
    background: rgba(0,0,0,0.1);
    border-radius: var(--radius-sm);
    border: 2px solid var(--color-border);
    display: flex;
    align-items: center;
    padding-right: 4px; /* Ensure 100% doesn't jam right edge */
  }

  &__fill {
    height: 100%;
    border-radius: var(--radius-sm);
    transition: width 0.5s ease;
    min-width: 8px; /* minimum bubble size */
  }

  &__icon {
    margin-left: -8px; /* overlap fill slightly for anchoring */
    z-index: 2;
    display: inline-flex;
  }
}
</style>
