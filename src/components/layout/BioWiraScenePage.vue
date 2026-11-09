<script setup lang="ts">
import { computed, useId } from 'vue'
import { BIOWIRA_SCENE_ASSETS } from '@/app/branding'
import HomeWoodRibbon from '@/features/home/components/HomeWoodRibbon.vue'
import AnimalChatGuide from '@/components/animal-chat/AnimalChatGuide.vue'
import { useProgressStore } from '@/stores/progressStore'
import { useSessionStore } from '@/stores/sessionStore'

export type SceneTone = 'light' | 'panel' | 'play'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    tone?: SceneTone
    /** `standard`: ~1180px content; `wide`: ~1320px; `game`: wider gameplay column */
    contentWidth?: 'standard' | 'wide' | 'game'
    showDecor?: boolean
    density?: 'normal' | 'compact' | 'game'
    /**
     * When true, hides the wood ribbon header and subtitle slot — content fills from below top nav.
     * Use for immersive readers (e.g. Eco-Comic story). Keeps an sr-only `<h1>` for accessibility.
     */
    hideHeader?: boolean
    showAnimalChat?: boolean
    animalChatPlacement?: 'sky-left' | 'sky-right' | 'side-left' | 'side-right' | 'detail-safe'
  }>(),
  {
    subtitle: undefined,
    tone: 'light',
    contentWidth: 'standard',
    showDecor: true,
    density: 'normal',
    hideHeader: false,
    showAnimalChat: false,
    animalChatPlacement: 'sky-right',
  },
)

const progressStore = useProgressStore()
const sessionStore = useSessionStore()

const densityClass = computed(() => `scene-page--density-${props.density}`)
const immersiveClass = computed(() => (props.hideHeader ? 'scene-page--immersive' : ''))
const sceneAssets = BIOWIRA_SCENE_ASSETS

const sceneStyle = computed(
  () =>
    ({
      '--scene-bg': `url(${sceneAssets.rainforestBackground})`,
    }) as Record<string, string>,
)

const titleId = useId()
</script>

<template>
  <main
    class="scene-page"
    :class="[
      `scene-page--${props.tone}`,
      densityClass,
      immersiveClass,
      props.contentWidth === 'wide'
        ? 'scene-page--wide'
        : props.contentWidth === 'game'
          ? 'scene-page--game'
          : 'scene-page--standard',
    ]"
    :style="sceneStyle"
  >
    <header
      v-if="!hideHeader"
      class="scene-page__header"
      :aria-labelledby="titleId"
    >
      <HomeWoodRibbon :title="title" />
      <h1 :id="titleId" class="sr-only">{{ title }}</h1>
      <!-- Named slot merges tagline + story titles in one pill (e.g. Eco-Comics). -->
      <div
        v-if="$slots.subtitle"
        class="scene-page__subtitle scene-page__subtitle--stack"
      >
        <slot name="subtitle" />
      </div>
      <p v-else-if="subtitle" class="scene-page__subtitle">
        {{ subtitle }}
      </p>
    </header>

    <section class="scene-page__content">
      <h1 v-if="hideHeader" :id="titleId" class="sr-only">{{ title }}</h1>
      <slot></slot>
    </section>

    <div v-if="showDecor" class="scene-page__decor-layer" aria-hidden="true">
      <img class="scene-page__decor scene-page__decor--arrow" :src="sceneAssets.arrowBoard" alt="" draggable="false">
      <img class="scene-page__decor scene-page__decor--flower" :src="sceneAssets.flowerPlant" alt="" draggable="false">
    </div>

    <div v-if="showAnimalChat" class="scene-page__assistant-layer">
      <AnimalChatGuide
        :profile-id="sessionStore.activeProfile?.profileId"
        :animal-id="sessionStore.activeProfile?.animalId"
        :animal-visual-key="sessionStore.activeProfile?.animalVisualKey"
        :display-name="sessionStore.activeProfile?.displayNickname ?? progressStore.displayName"
        mode="scene"
        :placement="animalChatPlacement"
      />
    </div>

    <!-- Sky-rail slot: same inset tokens as `AnimalChatGuide` sky modes (see scoped `.scene-page__sky-rail-end`). -->
    <div v-if="$slots.skyRailEnd" class="scene-page__sky-rail-end">
      <slot name="skyRailEnd" />
    </div>
  </main>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.scene-page {
  box-sizing: border-box;
  position: relative;
  /** Matches `.scene-page__content` caps — used to pin corner art outside the readable band (see `HomePage`). */
  --scene-readable-span: min(100%, 1180px);
  display: flex;
  flex-direction: column;
  /**
   * Fills routed shell height from `App.vue` `.route-view-root` so body scroll matches real content +
   * footer (avoids stacking `min-height: 100dvh` against the footer).
   */
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  background-image:
    linear-gradient(
      to bottom,
      rgba(22, 61, 35, 0.08) 0%,
      rgba(245, 230, 200, 0.42) 58%,
      rgba(245, 230, 200, 0.86) 86%,
      var(--color-bg) 100%
    ),
    var(--scene-bg);
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
  background-attachment: scroll;
}

.scene-page--wide {
  --scene-readable-span: min(100%, 1320px);
}

/**
 * Immersive layout — no `HomeWoodRibbon` / subtitle stack; routed content fills below global nav.
 */
.scene-page.scene-page--immersive .scene-page__content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding-block-start: var(--space-2);
  padding-block-end: var(--space-2);
  padding-inline: clamp(var(--space-2), 2vw, var(--space-4));

  @media (min-width: $bp-md) {
    padding-block-start: var(--space-3);
    padding-block-end: var(--space-3);
  }
}

@media (min-width: $bp-md) {
  .scene-page {
    // Keep the rainforest art sized to the viewport on desktop so content
    // height changes do not make the scene scale up or down.
    background-attachment: fixed;
  }
}

.scene-page__header {
  position: relative;
  z-index: var(--z-scene-surface);
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  width: min(100%, 1320px);
  margin-inline: auto;
  padding:
    clamp(var(--space-6), 5vh, var(--space-10))
    var(--space-4)
    clamp(var(--space-4), 3vh, var(--space-6));
  text-align: center;

  // Larger, kid-friendly ribbon title for all scene-page headers.
  --home-font-ribbon-title: clamp(16px, 1.4vw + 11px, 22px);
  --home-font-ribbon-icon:  clamp(15px, 1.5vw + 10px, 20px);
}

.scene-page.scene-page--density-compact .scene-page__header {
  padding-block-start: clamp(var(--space-4), 3vh, var(--space-6));
  padding-block-end: clamp(var(--space-2), 1.8vh, var(--space-4));
}

.scene-page.scene-page--density-compact .scene-page__content {
  padding-block-start: clamp(var(--space-2), 1.5vh, var(--space-4));
}

.scene-page.scene-page--density-game .scene-page__header {
  padding-block-start: clamp(var(--space-2), 2vh, var(--space-4));
  padding-block-end: clamp(var(--space-1), 1vh, var(--space-2));
  --home-font-ribbon-title: clamp(14px, 1.15vw + 10px, 19px);
  --home-font-ribbon-icon:  clamp(13px, 1.1vw + 9px, 17px);
}

.scene-page.scene-page--density-game .scene-page__content {
  padding-block-start: clamp(var(--space-1), 1vh, var(--space-2));
  padding-block-end: calc(var(--nav-height-bottom, 0px) + var(--space-3));
}

@media (min-width: $bp-lg) {
  .scene-page.scene-page--density-game.scene-page--play {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .scene-page.scene-page--density-game.scene-page--play > .scene-page__content {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    width: 100%;
    padding-block-end: var(--space-2);
  }

  /** Immersive play: no ribbon — single padding profile (immersive + density-game both touch `.scene-page__content`). */
  .scene-page.scene-page--immersive.scene-page--density-game.scene-page--play > .scene-page__content {
    padding-block-start: var(--space-2);
    padding-block-end: var(--space-2);
    padding-inline: clamp(var(--space-2), 2vw, var(--space-4));
  }
}

.scene-page__subtitle {
  max-width: min(680px, 92vw);
  margin: 0;
  padding: var(--space-2) var(--space-4);
  border: var(--pixel-border) solid rgba(200, 168, 112, 0.55);
  border-radius: var(--radius-xl);
  background: rgba(255, 248, 231, 0.72);
  box-shadow:
    4px 4px 0 rgba(61, 43, 31, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
  font-family: var(--font-body);
  font-size: var(--scene-page-subtitle-font-size);
  font-weight: 800;
  line-height: var(--scene-page-subtitle-line-height);
  color: var(--color-text);

  &--stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    text-align: center;
    max-width: min(720px, 92vw);
  }
}

.scene-page__content {
  position: relative;
  z-index: var(--z-scene-surface);
  flex: 1 1 auto;
  min-height: 0;
  width: var(--scene-readable-span);
  margin-inline: auto;
  padding:
    clamp(var(--space-3), 2vh, var(--space-5))
    var(--space-4)
    calc(var(--nav-height-bottom, 0px) + var(--space-10));

  @media (min-width: $bp-md) {
    /* Desktop: top nav only; avoid double-reserving mobile bottom-nav band. */
    padding-block-end: clamp(var(--space-5), 2.4vh, var(--space-10));
  }
}

// Wider explorer / gameplay layouts — bounded by viewport, no screenshot-fixed widths.
.scene-page--game .scene-page__header,
.scene-page--game .scene-page__content {
  width: min(100%, clamp(1180px, 94vw, 1540px));
}

.scene-page__decor-layer {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: var(--z-scene-decor);
  overflow: hidden;
}

.scene-page__decor {
  position: absolute;
  bottom: var(--scene-deco-bottom, 0px);
  height: auto;
  object-fit: contain;
  transform-origin: bottom center;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.scene-page__assistant-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: var(--z-scene-surface, 10);

  /* On desktop, keep the guide inside the scene boundaries */
  @media (min-width: $bp-md) {
    width: var(--home-content-width, 1200px);
    margin: 0 auto;
  }
}

/**
 * Optional right-rail content aligned with `AnimalChatGuide` sky placement
 * (`--scene-animal-chat-sky-inset-*`), without estimating header height.
 */
.scene-page__sky-rail-end {
  pointer-events: none;

  @media (min-width: #{$bp-lg + 1px}) {
    position: absolute;
    z-index: calc(var(--z-scene-surface) + 1);
    top: var(--scene-animal-chat-sky-inset-block-start);
    left: 0;
    right: 0;
    /* Same band as `.scene-page__content` (standard / `scene-page--wide` / future consumers). */
    width: var(--scene-readable-span);
    max-width: 100%;
    margin-inline: auto;
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    padding-inline-end: var(--scene-animal-chat-sky-inset-inline-edge);
    box-sizing: border-box;

    :deep(*) {
      pointer-events: auto;
    }
  }

  @media (max-width: $bp-lg) {
    width: var(--scene-readable-span);
    max-width: 100%;
    margin-inline: auto;
    padding-inline: var(--space-4);
    margin-block-start: var(--space-5);
    box-sizing: border-box;
    pointer-events: auto;
  }
}

.scene-page__decor--arrow {
  --deco-w: clamp(3.25rem, 10vw, 7.5rem);
  --deco-max: max(
    2rem,
    calc((100% - var(--scene-readable-span)) * 0.5 - var(--home-deco-side-clearance, 16px))
  );
  --deco-visible: min(var(--deco-w), var(--deco-max));
  width: var(--deco-visible);
  left: max(
    var(--space-2),
    calc(
      (100% - var(--scene-readable-span)) * 0.5 - var(--home-deco-side-clearance, 16px) - var(--deco-visible)
    )
  );
}

.scene-page__decor--flower {
  --deco-w: clamp(3.5rem, 11vw, 8.125rem);
  --deco-max: max(
    2rem,
    calc((100% - var(--scene-readable-span)) * 0.5 - var(--home-deco-side-clearance, 16px))
  );
  --deco-visible: min(var(--deco-w), var(--deco-max));
  width: var(--deco-visible);
  right: max(
    var(--space-2),
    calc(
      (100% - var(--scene-readable-span)) * 0.5 - var(--home-deco-side-clearance, 16px) - var(--deco-visible)
    )
  );
}

@media (max-width: $bp-sm) {
  .scene-page__header {
    padding-block-start: var(--space-5);
    padding-inline: var(--space-3);
  }

  .scene-page__content {
    padding-inline: var(--space-3);
  }

  .scene-page--game .scene-page__header,
  .scene-page--game .scene-page__content {
    width: 100%;
  }

  .scene-page__subtitle {
    font-size: clamp(14px, 3.6vw, 16px);
  }

  .scene-page__decor-layer {
    display: none;
  }
}
</style>
