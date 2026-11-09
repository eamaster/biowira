<script setup lang="ts">
/**
 * ReadAlongText — renders an array of words with one highlighted at a time.
 * Compatible with the useAudio composable's highlightedWordIndex.
 *
 * Accessible: uses aria-live="polite" so screen readers announce
 * highlighted words without being intrusive.
 */
defineProps<{
  words: string[]
  highlightedIndex: number
  /** Controls base font size of the text */
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <p
    class="read-along"
    :class="`read-along--${size ?? 'md'}`"
    aria-live="polite"
    aria-atomic="false"
  >
    <span
      v-for="(word, idx) in words"
      :key="idx"
      :class="['read-along__word', { 'read-along__word--active': idx === highlightedIndex }]"
      :aria-current="idx === highlightedIndex ? 'true' : undefined"
    >{{ word }}{{ idx < words.length - 1 ? ' ' : '' }}</span>
  </p>
</template>

<style scoped lang="scss">
.read-along {
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.75;

  &--sm { font-size: var(--text-base); }
  &--md { font-size: var(--text-lg); }
  &--lg { font-size: var(--text-2xl); }

  &__word {
    display: inline;
    border-radius: 3px;
    padding: 1px 2px;
    transition: background-color 0.15s ease;

    &--active {
      background: #FFD54F;
      color: var(--color-text);
    }
  }
}

// Respect prefers-reduced-motion
@media (prefers-reduced-motion: reduce) {
  .read-along__word {
    transition: none;
  }
}
</style>
