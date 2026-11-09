<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps<{
  /**
   * Logical icon key resolved through iconRegistry.ts NAV_ICON_MAP —
   * omitted when `pixelIconSrc` is set (games hub / branding WebP).
   */
  iconKey?: string
  /** Rendered when the SVG is not in the registry — prevents blank card icon */
  fallbackIcon?: string
  /** Pixel-art raster from `HOME_PAGE_ASSETS.featureCards.*.icon` — takes precedence over AppIcon */
  pixelIconSrc?: string
  title: string
  description: string
  buttonLabel: string
  buttonVariant?: 'green' | 'orange' | 'red' | 'blue'
  colorScheme?: 'yellow' | 'blue' | 'green' | 'red' | 'orange' | 'purple'
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <div
    class="action-card"
    :class="`action-card--${colorScheme ?? 'yellow'}`"
    role="button"
    :tabindex="0"
    :aria-label="title"
    @click="emit('click')"
    @keydown.enter="emit('click')"
    @keydown.space.prevent="emit('click')"
  >
    <div class="action-card__icon" aria-hidden="true">
      <img
        v-if="pixelIconSrc"
        class="action-card__icon-img"
        :src="pixelIconSrc"
        alt=""
        draggable="false"
      >
      <AppIcon
        v-else-if="iconKey"
        :icon-key="iconKey"
        :fallback-text="fallbackIcon ?? ''"
        size="48px"
      />
    </div>
    <div class="action-card__body">
      <div class="action-card__title">{{ title }}</div>
      <div class="action-card__desc">{{ description }}</div>
    </div>
    <button
      class="action-card__btn"
      :class="`action-card__btn--${buttonVariant ?? 'green'}`"
      tabindex="-1"
      aria-hidden="true"
    >
      {{ buttonLabel }}
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.action-card {
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  border: var(--pixel-border-thick) solid;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.18);

  @media (max-width: $bp-md) {
    flex-direction: row;
    align-items: center;
    padding: var(--space-4);
  }

  &:hover { transform: translateY(-3px); box-shadow: 6px 7px 0 rgba(0, 0, 0, 0.22); }
  &:active { transform: translateY(1px); box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.18); }
  &:focus-visible {
    outline: 3px solid var(--color-secondary);
    outline-offset: 3px;
  }

  &--yellow { background: #FFF3C0; border-color: #E8A020; }
  &--blue   { background: #C8E8F8; border-color: #2196F3; }
  &--green  { background: #D4EDD4; border-color: #4CAF50; }
  &--red    { background: #FFCDD2; border-color: #F44336; }
  &--orange { background: #FFE0B2; border-color: #FF9800; }
  &--purple { background: #E1BEE7; border-color: #9C27B0; }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    flex-shrink: 0;
    line-height: 1;
    @media (max-width: $bp-md) { width: 40px; height: 40px; }
  }

  &__icon-img {
    width: 100%;
    height: 100%;
    max-width: 56px;
    max-height: 56px;
    object-fit: contain;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    display: block;
    user-select: none;
    pointer-events: none;
    @media (max-width: $bp-md) {
      max-width: 40px;
      max-height: 40px;
    }
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__title {
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-weight: 800;
    color: var(--color-text);
    line-height: 1.2;
  }

  &__desc {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--color-text-light);
    @media (max-width: $bp-md) { display: none; }
  }

  &__btn {
    font-family: var(--font-readable);
    font-weight: 800;
    font-size: var(--text-base); // Larger font
    padding: 12px 20px; // Bigger padding for tappability
    border-radius: var(--radius-sm);
    border: 4px solid; // Chunkier border
    color: #fff;
    cursor: pointer;
    box-shadow: 0 4px 0; // Taller shadow
    pointer-events: none; // Card handles click

    &--green {
      background: var(--btn-green-bg);
      border-color: var(--btn-green-border);
      box-shadow: 0 4px 0 var(--btn-green-border);
    }
    &--orange {
      background: var(--btn-orange-bg);
      border-color: var(--btn-orange-border);
      box-shadow: 0 4px 0 var(--btn-orange-border);
    }
    &--red {
      background: var(--btn-red-bg);
      border-color: var(--btn-red-border);
      box-shadow: 0 4px 0 var(--btn-red-border);
    }
    &--blue {
      background: #2196F3;
      border-color: #1976D2;
      box-shadow: 0 4px 0 #1976D2;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .action-card {
    transition: none;
    &:hover, &:active { transform: none; }
  }
}
</style>
