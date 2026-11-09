<script setup lang="ts">
defineProps<{
  title: string
  iconSrc: string
  status: 'complete' | 'current' | 'upcoming'
  description?: string
}>()
</script>

<template>
  <div
    class="rescue-step-card"
    :class="`rescue-step-card--${status}`"
    role="listitem"
    :aria-label="`${title}: ${status}`"
  >
    <div class="rescue-step-card__icon-wrap">
      <img
        class="rescue-step-card__icon"
        :src="iconSrc"
        alt=""
        draggable="false"
      />
      <span
        v-if="status === 'complete'"
        class="rescue-step-card__check-badge"
        aria-hidden="true"
      >✓</span>
    </div>
    <div class="rescue-step-card__label">{{ title }}</div>
    <div v-if="description" class="rescue-step-card__desc">{{ description }}</div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.rescue-step-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-2);
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border-light);
  background: var(--color-bg-card);
  box-shadow: var(--pixel-shadow);
  min-width: 0;
  width: 100%;
  transition: box-shadow 0.2s, border-color 0.2s, background 0.2s;

  &--current {
    background: rgba(91, 138, 60, 0.13);
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(91, 138, 60, 0.25), var(--pixel-shadow);
  }

  &--complete {
    background: rgba(76, 175, 80, 0.08);
    border-color: #4CAF50;
  }

  &--upcoming {
    opacity: 0.6;
  }
}

.rescue-step-card__icon-wrap {
  position: relative;
  width: clamp(42px, 6vw, 64px);
  height: clamp(42px, 6vw, 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rescue-step-card__icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.rescue-step-card__check-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  background: #4CAF50;
  color: #fff;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  line-height: 1;
}

.rescue-step-card__label {
  font-family: var(--font-readable);
  font-size: var(--text-sm);
  font-weight: 800;
  color: var(--color-text);
  text-align: center;
  line-height: 1.3;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-word;
}

.rescue-step-card__desc {
  font-family: var(--font-readable);
  font-size: 11px;
  color: var(--color-text-muted);
  text-align: center;
  line-height: 1.3;
}
</style>
