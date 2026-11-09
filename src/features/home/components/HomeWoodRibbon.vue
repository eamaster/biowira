<script setup lang="ts">
import { HOME_PAGE_ASSETS } from '@/app/branding'

defineProps<{
  title: string
  icon?: string
  /** When true, ribbons sit on top of a dashboard pixel panel (overlap top edge). */
  overlap?: boolean
}>()

const ribbonSrc = HOME_PAGE_ASSETS.homeScene.ribbon
</script>

<template>
  <div
    class="wood-ribbon"
    :class="{ 'wood-ribbon--overlap': overlap }"
    :style="{ '--ribbon-bg': `url(${ribbonSrc})` }"
  >
    <span v-if="icon" class="wood-ribbon__icon" aria-hidden="true">{{ icon }}</span>
    <span class="wood-ribbon__title">{{ title }}</span>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.wood-ribbon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);

  /** Slightly below old max — keeps ribbon proportional to narrower pixel panels elsewhere */
  width: clamp(200px, 52%, 420px);
  max-width: 100%;

  // Intrinsic ratio of ribbon asset: 836×175
  aspect-ratio: 836 / 175;

  background-image: var(--ribbon-bg);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  image-rendering: crisp-edges;

  padding: 0 clamp(18px, 7%, 40px);
  user-select: none;

  @media (max-width: $bp-sm) {
    width: clamp(170px, 88%, 300px);
  }

  /** Sticks to top of parent panel — scaled so ribbons don’t dominate the card width */
  &--overlap {
    position: absolute;
    left: 50%;
    top: 0;
    z-index: 2;
    width: min(72%, clamp(200px, 52vw, 300px));
    transform: translate(-50%, var(--home-ribbon-offset, -42%));
    margin: 0;

    @media (max-width: $bp-sm) {
      width: min(84%, clamp(180px, 78vw, 260px));
    }
  }
}

.wood-ribbon__icon {
  font-size: var(--home-font-ribbon-icon, clamp(14px, 1.38vw + 10px, 19px));
  line-height: 1;
  flex-shrink: 0;
}

.wood-ribbon__title {
  font-family: var(--font-readable);
  font-size: var(--home-font-ribbon-title, clamp(13px, 1.12vw + 10px, 17px));
  font-weight: 900;
  color: var(--color-text-on-dark);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
