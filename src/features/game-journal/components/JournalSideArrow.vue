<script setup lang="ts">
/**
 * JournalSideArrow — page-flip arrow button using WEBP sprites.
 * Uses journal_book_left_arrow.webp / journal_book_right_arrow.webp.
 */
import { GAME_JOURNAL_ASSETS } from '../data/gameJournalAssetRegistry'

defineProps<{
  direction: 'prev' | 'next'
  ariaLabel?: string
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    class="journal-side-arrow"
    :class="`journal-side-arrow--${direction}`"
    :aria-label="ariaLabel ?? (direction === 'prev' ? 'Previous journal page' : 'Next journal page')"
    :data-testid="direction === 'prev' ? 'journal-prev-btn' : 'journal-next-btn'"
    type="button"
    @click="emit('click')"
  >
    <img
      :src="direction === 'prev'
        ? GAME_JOURNAL_ASSETS.shared.leftArrow
        : GAME_JOURNAL_ASSETS.shared.rightArrow"
      :alt="direction === 'prev' ? 'Previous page' : 'Next page'"
      class="journal-side-arrow__img"
    />
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.journal-side-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform var(--transition-fast);
  align-self: center;

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  &__img {
    width: clamp(44px, 5vw, 64px);
    height: auto;
    object-fit: contain;
    display: block;
  }

  @media (max-width: $bp-md) {
    &__img {
      width: 44px;
    }
  }
}
</style>
