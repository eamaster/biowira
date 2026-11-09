<script setup lang="ts">
/**
 * JournalStamp — collectible stamp/ticket visual component.
 *
 * Supports image/icon-based stamps. Locked state uses grey card + padlock.
 * Unlocked state uses a collectible stamp/ticket style.
 */
withDefaults(
  defineProps<{
    stampId: string
    title: string
    description?: string
    isUnlocked: boolean
    size?: 'sm' | 'md' | 'lg'
    /** Optional visual URL (image or SVG) for the stamp */
    visualUrl?: string
    /** Emoji fallback shown when no visualUrl is provided */
    visualEmoji?: string
    /** Category theme for color tinting */
    categoryTheme?: 'eco-comic' | 'nature-mission' | 'explorer-rescue'
  }>(),
  {
    description: '',
    size: 'md',
    visualUrl: undefined,
    visualEmoji: '🏅',
    categoryTheme: undefined,
  },
)
</script>

<template>
  <div
    class="journal-stamp"
    :class="[
      `journal-stamp--${size}`,
      isUnlocked ? 'journal-stamp--unlocked' : 'journal-stamp--locked',
      categoryTheme ? `journal-stamp--theme-${categoryTheme}` : '',
    ]"
    :aria-label="`${title} stamp — ${isUnlocked ? 'unlocked' : 'locked'}`"
  >
    <!-- Visual area -->
    <div class="journal-stamp__visual" aria-hidden="true">
      <template v-if="isUnlocked">
        <img
          v-if="visualUrl"
          :src="visualUrl"
          :alt="title"
          class="journal-stamp__img"
        />
        <span v-else class="journal-stamp__emoji">{{ visualEmoji }}</span>
      </template>
      <template v-else>
        <!-- Locked: grey card with padlock -->
        <span class="journal-stamp__lock">🔒</span>
      </template>
    </div>

    <span class="journal-stamp__title">{{ title }}</span>
    <span v-if="description && isUnlocked" class="journal-stamp__desc">{{ description }}</span>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.journal-stamp {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  text-align: center;
  border: 2px dashed var(--color-border);
  transition: opacity 0.2s;
  background: #fdf5e6;

  &--unlocked {
    background: rgba(232, 200, 80, 0.1);
    border-color: var(--color-secondary);
    border-style: solid;
    box-shadow: 0 2px 8px rgba(232, 160, 32, 0.2);
  }

  &--locked {
    background: #e8e0d0;
    border-color: #a09070;
    opacity: 0.6;
    filter: grayscale(0.6);
  }

  // Theme overrides for unlocked state
  &--theme-eco-comic.journal-stamp--unlocked {
    border-color: var(--color-secondary);
    background: rgba(232, 200, 80, 0.12);
  }

  &--theme-nature-mission.journal-stamp--unlocked {
    border-color: var(--color-primary);
    background: rgba(90, 170, 60, 0.08);
  }

  &--theme-explorer-rescue.journal-stamp--unlocked {
    border-color: #8b4c2a;
    background: rgba(139, 76, 42, 0.07);
  }

  &__visual {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(200, 160, 40, 0.1);
    border-radius: var(--radius-sm);
  }

  // Size variants
  &--sm &__visual { width: 32px; height: 32px; }
  &--md &__visual { width: 44px; height: 44px; }
  &--lg &__visual { width: 64px; height: 64px; }

  &__img {
    width: 80%;
    height: 80%;
    object-fit: contain;
  }

  &__emoji {
    font-size: 24px;
    line-height: 1;
  }

  &--sm &__emoji { font-size: 18px; }
  &--lg &__emoji { font-size: 36px; }

  &__lock {
    font-size: 20px;
    line-height: 1;
    opacity: 0.55;
  }

  &--sm &__lock { font-size: 14px; }
  &--lg &__lock { font-size: 28px; }

  &__title {
    font-family: var(--font-readable);
    font-size: var(--text-xs);
    font-weight: 900;
    color: var(--color-text);
    line-height: 1.3;
  }

  &--sm &__title { font-size: 10px; }
  &--lg &__title { font-size: var(--text-sm); }

  &--locked &__title { color: var(--color-text-muted); }

  &__desc {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-muted);
    line-height: 1.4;
  }
}
</style>
