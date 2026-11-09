<script setup lang="ts">
/**
 * JournalBookFrame — shared open-book visual wrapper.
 *
 * Uses journal_book_2.webp as the decorative background layer.
 * Content is overlaid using CSS grid on top of the book sprite.
 *
 * Slots:
 *   left   — left page content (animal card / polaroid)
 *   center — center page content (stamp card / main visual)
 *   right  — right page content (description / stats)
 */
import { GAME_JOURNAL_ASSETS } from '../data/gameJournalAssetRegistry'
</script>

<template>
  <div class="journal-book" data-testid="journal-book-frame">
    <!-- Book background sprite (wide frame) -->
    <img
      :src="GAME_JOURNAL_ASSETS.shared.bookFrameWide"
      alt=""
      aria-hidden="true"
      class="journal-book__bg"
    />

    <!-- Content overlay — three page columns -->
    <div class="journal-book__content">
      <div class="journal-book__page journal-book__left">
        <slot name="left"></slot>
      </div>

      <div class="journal-book__page journal-book__center">
        <slot name="center"></slot>
      </div>

      <div class="journal-book__page journal-book__right">
        <slot name="right"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;
@use '@/features/game-journal/styles/journalBook2Sprite' as book2;

.journal-book {
  position: relative;
  width: 100%;
  @include book2.aspect-box;
  max-height: 560px;

  &__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    pointer-events: none;
    user-select: none;
    border-radius: var(--radius-lg);
  }

  // Content overlay sits on top of the book background
  &__content {
    @include book2.inner-inset;
    display: grid;
    grid-template-columns: 1fr 1.2fr 1fr;
    gap: 0 2%;
  }

  &__page {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
    background: transparent;
  }

  &__left   { align-items: center; justify-content: center; }
  &__center { align-items: center; justify-content: center; }
  &__right  {
    padding-left: var(--space-1);
    /** Content must fit the fixed book page — no inner scroll on desktop spread. */
    overflow: hidden;

    /** Let stamp content (e.g. Explorer Rescue) fill column height so section spacing can use the full page. */
    > * {
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
      max-width: 100%;
    }
  }

  // ── Mobile: switch to stacked card layout ────────────────────
  @media (max-width: $bp-md) {
    aspect-ratio: unset;
    max-height: unset;
    height: auto;
    background: #f5ead0;
    border: 4px solid #3d2b1f;
    border-radius: var(--radius-lg);
    box-shadow: 6px 6px 0 #2a1d13;

    &__bg {
      display: none;
    }

    &__content {
      position: static;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-4);
    }

    &__page {
      align-items: center;
      justify-content: center;
    }

    &__right {
      overflow: visible;
    }
  }
}
</style>
