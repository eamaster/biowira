<script setup lang="ts">
import PixelButton from '@/components/ui/PixelButton.vue'

const props = withDefaults(
  defineProps<{
    currentIndex: number
    total: number
  }>(),
  {},
)

const emit = defineEmits<{
  prev: []
  next: []
}>()

const canGoPrev = computed(() => props.currentIndex > 0)
const canGoNext = computed(() => props.currentIndex < props.total - 1)
const showControls = computed(() => props.total > 1)

import { computed } from 'vue'
</script>

<template>
  <div v-if="showControls" class="journal-page-controls" aria-label="Journal page navigation">
    <PixelButton
      v-if="canGoPrev"
      variant="blue"
      size="sm"
      aria-label="Previous journal page"
      data-testid="journal-prev-btn"
      @click="emit('prev')"
    >
      ◀ BACK
    </PixelButton>
    <div v-else class="journal-page-controls__spacer" aria-hidden="true"></div>

    <span class="journal-page-controls__indicator" aria-live="polite">
      {{ currentIndex + 1 }} / {{ total }}
    </span>

    <PixelButton
      v-if="canGoNext"
      variant="blue"
      size="sm"
      aria-label="Next journal page"
      data-testid="journal-next-btn"
      @click="emit('next')"
    >
      NEXT ▶
    </PixelButton>
    <div v-else class="journal-page-controls__spacer" aria-hidden="true"></div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.journal-page-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;

  &__spacer {
    // Reserve space so the indicator stays centered even when one arrow is hidden
    min-width: 80px;
  }

  &__indicator {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 800;
    color: var(--color-text-muted);
    flex: 1;
    text-align: center;
  }
}
</style>
