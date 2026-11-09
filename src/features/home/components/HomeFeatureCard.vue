<script setup lang="ts">
export type HomeFeatureCardId = 'discover' | 'comics' | 'quiz' | 'missions' | 'rescue'

const props = withDefaults(
  defineProps<{
    id: HomeFeatureCardId
    title: string
    description: string
    buttonLabel: string
    panelSrc: string
    iconSrc: string
    buttonSrc: string
    variant?: 'home' | 'games'
    /** Default keeps homepage test ids (`home-feature-card-*`). */
    testIdPrefix?: string
  }>(),
  {
    variant: 'home',
    testIdPrefix: 'home-feature-card',
  },
)

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="hfc"
    :class="[`hfc--${props.id}`, `hfc--${props.variant}`]"
    :data-testid="`${props.testIdPrefix}-${props.id}`"
    :aria-label="`${props.title}: ${props.description}`"
    :style="{ '--hfc-panel': `url(${props.panelSrc})` }"
    @click="emit('click')"
  >
    <!-- Zone 1: icon -->
    <span class="hfc__icon" aria-hidden="true">
      <img
        :src="props.iconSrc"
        :alt="``"
        aria-hidden="true"
        class="hfc__icon-img"
        draggable="false"
      >
    </span>

    <!-- Zone 2: title -->
    <span class="hfc__title-wrap">
      <span class="hfc__title">{{ props.title }}</span>
    </span>

    <!-- Zone 3: description -->
    <span class="hfc__desc-wrap">
      <span class="hfc__desc">{{ props.description }}</span>
    </span>

    <!-- Zone 4: button -->
    <span
      class="hfc__btn"
      :style="{ '--hfc-btn': `url(${props.buttonSrc})` }"
      aria-hidden="true"
    >
      <span class="hfc__btn-label">{{ props.buttonLabel }}</span>
    </span>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.hfc {
  // ── Grid row size variables ──────────────────────────────────────────────────
  // Fixed rows guarantee every card's title and description share the same
  // vertical baseline regardless of icon shape or text wrapping.
  /** Tightened so sprites stay inside painted panel borders (avoid overflow clipping). */
  --hfc-icon-row:    clamp(58px, 6.2vw, 78px);
  --hfc-title-row:   clamp(50px, 4.6vw, 64px);
  --hfc-desc-row:    clamp(44px, 4.2vw, 56px);
  /** Room for CTA sprite + gap above panel bottom inset (align-self: start leaves space under the button). */
  --hfc-button-row:  clamp(66px, 6vw, 82px);
  --hfc-button-width: 86%;
  --hfc-text-inline:  clamp(10px, 5%, 18px);

  box-sizing: border-box;
  display: grid;
  grid-template-rows:
    var(--hfc-icon-row)
    var(--hfc-title-row)
    var(--hfc-desc-row)
    var(--hfc-button-row);
  align-items: stretch;
  width: 100%;
  min-width: 0;
  overflow: clip;

  padding:
    clamp(10px, 2.5vw, 14px)
    clamp(8px,  2.5vw, 14px)
    var(--home-feature-card-padding-block-end);

  background-image: var(--hfc-panel);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  image-rendering: crisp-edges;

  border: none;
  border-radius: 0;
  cursor: pointer;
  color: inherit;
  font: inherit;

  &:focus-visible {
    outline: 3px solid var(--color-secondary);
    outline-offset: 4px;
    border-radius: var(--radius-sm);
  }

  @media (hover: hover) {
    &:hover {
      transform: translateY(-3px);
      filter: brightness(1.04);
    }

    &:active {
      transform: translateY(1px);
      filter: brightness(0.98);
    }
  }
}

// ── Games hub: fewer / wider columns — bigger tap targets & type scale ─────────

.hfc--games {
  --hfc-icon-row:    clamp(82px, 7vw, 116px);
  --hfc-title-row:   clamp(54px, 4vw, 70px);
  --hfc-desc-row:    clamp(48px, 3.6vw, 62px);
  --hfc-button-row:  clamp(62px, 4.4vw, 78px);
  --hfc-button-width: 82%;
  --hfc-text-inline: clamp(16px, 6%, 28px);

  min-block-size: clamp(300px, 25vw, 380px);
  padding:
    clamp(18px, 2vw, 28px)
    clamp(14px, 2vw, 24px)
    clamp(16px, 2vw, 24px);

  .hfc__title {
    font-size: clamp(20px, 1.2vw + 14px, 28px);
    font-weight: 900;
    line-height: 1.1;
  }

  .hfc__desc {
    font-size: clamp(15px, 0.8vw + 12px, 20px);
    font-weight: 700;
    line-height: 1.25;
  }

  .hfc__btn-label {
    font-size: clamp(16px, 0.9vw + 12px, 20px);
    font-weight: 900;
  }

  .hfc__btn {
    align-self: center;
    margin-block-start: 0;
  }
}

// Home: lift CTA slightly within the grid row so nine-slice lip + corner art stay clear of the button.
.hfc--home .hfc__btn {
  align-self: start;
  margin-block-start: clamp(2px, 0.8vw, 8px);
}

// ── Zone 1: icon ──────────────────────────────────────────────────────────────

.hfc__icon {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  align-self: stretch;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  inline-size: min(44%, 80px);
  max-inline-size: 100%;
}

.hfc__icon-img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: center;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  display: block;
  user-select: none;
  pointer-events: none;
}

// ── Zone 2: title ─────────────────────────────────────────────────────────────

.hfc__title-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: stretch;
  min-width: 0;
  min-height: 0;
  text-align: center;
  padding-inline: var(--hfc-text-inline);
}

.hfc__title {
  font-family: var(--font-readable);
  font-size: var(--home-font-feature-title, clamp(18px, 1vw + 12px, 24px));
  font-weight: 900;
  line-height: 1.1;
  color: var(--color-text);
  text-wrap: balance;
  overflow-wrap: normal;
  word-break: normal;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

// ── Zone 3: description ───────────────────────────────────────────────────────

.hfc__desc-wrap {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  justify-self: stretch;
  min-width: 0;
  min-height: 0;
  text-align: center;
  padding-inline: var(--hfc-text-inline);
}

.hfc__desc {
  font-family: var(--font-body);
  font-size: var(--home-font-feature-body, clamp(14px, 0.72vw + 11px, 18px));
  font-weight: 700;
  line-height: 1.22;
  color: var(--color-text-light);
  text-wrap: balance;
  overflow-wrap: normal;
  word-break: normal;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

// ── Zone 4: button ────────────────────────────────────────────────────────────

.hfc__btn {
  justify-self: center;
  align-self: center;
  inline-size: min(var(--hfc-button-width), 240px);
  min-block-size: 44px;
  aspect-ratio: 445 / 111;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: var(--hfc-btn);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  padding-inline: clamp(14px, 8%, 24px);
}

.hfc__btn-label {
  font-family: var(--font-readable);
  font-size: var(--home-font-feature-cta, clamp(15px, 0.75vw + 11px, 18px));
  font-weight: 900;
  color: #fff;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.4);
  line-height: 1.08;
  pointer-events: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .hfc {
    &:hover,
    &:active {
      transform: none;
      filter: none;
    }
  }
}
</style>
