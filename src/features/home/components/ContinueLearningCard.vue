<script setup lang="ts">
import { computed } from 'vue'
import AnimalIcon from '@/components/ui/AnimalIcon.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { HOME_PAGE_ASSETS } from '@/app/branding'

const props = defineProps<{
  label: string
  /** Dynamic value line (animal name, quiz title, etc.) */
  name?: string
  /** Fallback text when name is absent or blank */
  nameFallback: string
  /** Action link text */
  action: string
  /** For animal cards: the animal domain ID used by AnimalIcon */
  animalIconKey?: string
  /**
   * Optional pixel-art raster (same assets as HomeFeatureCard icons), e.g. quiz-card-icon.webp —
   * takes precedence over `navIconKey` when set.
   */
  pixelIconSrc?: string
  /** For non-animal cards: nav icon key used by AppIcon (e.g. 'quiz') */
  navIconKey?: string
  /** Fallback emoji shown when animalIconKey has no registered SVG */
  fallbackEmoji?: string
  /**
   * Fills paired grid rows on homepage dashboard: drop fixed aspect-ratio so columns
   * can align with sibling progress panel.
   */
  compact?: boolean
}>()

const emit = defineEmits<{ click: [] }>()

/** Show real name only when non-empty after trim; empty string falls back like undefined. */
const displayName = computed(() => props.name?.trim() || props.nameFallback)
const isRealName = computed(() => Boolean(props.name?.trim()))

function onActivate() {
  emit('click')
}

const subCardSrc = HOME_PAGE_ASSETS.dashboard.subCard
</script>

<template>
  <button
    type="button"
    class="clc"
    :class="{ 'clc--compact': compact }"
    :style="{ '--clc-bg': `url(${subCardSrc})` }"
    @click="onActivate"
  >
    <!-- Icon area -->
    <span class="clc__icon" aria-hidden="true">
      <AnimalIcon
        v-if="animalIconKey !== undefined || fallbackEmoji !== undefined"
        :icon-key="animalIconKey"
        :fallback-emoji="fallbackEmoji ?? '🐾'"
        size="40px"
      />
      <img
        v-else-if="pixelIconSrc"
        class="clc__icon-img"
        :src="pixelIconSrc"
        alt=""
        draggable="false"
      >
      <AppIcon
        v-else-if="navIconKey"
        :icon-key="navIconKey"
        fallback-text="📋"
        size="40px"
      />
      <span v-else class="clc__icon-placeholder" aria-hidden="true">📋</span>
    </span>

    <!-- Text area -->
    <span class="clc__body">
      <span class="clc__label">{{ label }}</span>
      <span class="clc__name" :class="{ 'clc__name--fallback': !isRealName }">
        {{ displayName }}
      </span>
      <span class="clc__action">{{ action }}</span>
    </span>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.clc {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: 88px;
  text-align: left;

  // Pixel-art subcard background
  background-image: var(--clc-bg);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  image-rendering: crisp-edges;

  // Intrinsic ratio of progress-subcard.webp: 708×280
  aspect-ratio: 708 / 280;

  border: none;
  border-radius: 0;
  padding: clamp(10px, 4%, 16px) clamp(12px, 5%, 20px);
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    filter var(--transition-fast);
  font: inherit;
  color: inherit;

  @media (hover: hover) {
    &:hover {
      transform: translateY(-2px);
      filter: brightness(1.05);
    }

    &:active {
      transform: translateY(1px);
      filter: brightness(0.97);
    }
  }

  &:focus-visible {
    outline: 3px solid var(--color-secondary);
    outline-offset: 3px;
    border-radius: var(--radius-sm);
  }

  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: var(--radius-sm);
  }

  &__icon-placeholder {
    font-size: 28px;
    line-height: 1;
  }

  &__icon-img {
    width: min(42px, 100%);
    height: auto;
    max-height: 48px;
    object-fit: contain;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    display: block;
    user-select: none;
    pointer-events: none;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
    flex: 1;
  }

  &__label {
    font-family: var(--font-body);
    font-size: var(--home-font-dash-caps, clamp(12px, 1vw + 9px, 14px));
    font-weight: 700;
    color: var(--color-text-muted);
    line-height: 1.3;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  &__name {
    font-family: var(--font-readable);
    font-size: var(--home-font-dash-value, var(--text-base));
    font-weight: 800;
    color: var(--color-text);
    line-height: 1.2;
    word-break: break-word;
    white-space: normal;
    overflow-wrap: anywhere;

    &--fallback {
      color: var(--color-text-muted);
      font-style: italic;
    }
  }

  &__action {
    font-family: var(--font-body);
    font-size: var(--home-font-dash-action, clamp(13px, 1.05vw + 10px, 15px));
    color: var(--color-primary);
    font-weight: 800;
    margin-top: var(--space-1);
  }

  /** Homepage dashboard paired row: align with sibling progress panel height */
  &--compact {
    aspect-ratio: unset;
    height: 100%;
    align-self: stretch;
    min-height: 88px;

    @media (max-width: $bp-sm) {
      height: auto;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .clc {
    &:hover,
    &:active {
      transform: none;
      filter: none;
    }
  }
}
</style>
