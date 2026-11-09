<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PixelTopNav from './PixelTopNav.vue'
import PixelBottomNav from './PixelBottomNav.vue'
import PixelFooter from './PixelFooter.vue'
import AppAudioController from '@/components/audio/AppAudioController.vue'
import { useProgressStore } from '@/stores/progressStore'

const route = useRoute()
const hideFooter = computed(() => route.meta.hideFooter === true)

const progressStore = useProgressStore()
onMounted(() => progressStore.fetchProgress())
</script>

<template>
  <div class="app-shell">
    <!-- Renderless audio controller — switches music theme per route -->
    <AppAudioController />

    <PixelTopNav class="app-shell__top-nav" />

    <main
      id="main-content"
      class="app-shell__main"
      :class="{ 'app-shell__main--game-layout': route.meta.gameLayout === true }"
    >
      <div class="app-shell__content">
        <slot></slot>
      </div>
      <PixelFooter v-if="!hideFooter" class="app-shell__footer" />
    </main>

    <PixelBottomNav class="app-shell__bottom-nav" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.app-shell {
  min-height: 100dvh;
  overflow-x: clip;
  display: flex;
  flex-direction: column;

  &__top-nav {
    // Always visible on desktop
    @media (max-width: 767.98px) {
      display: none;
    }
  }

  &__bottom-nav {
    // Always visible on mobile
    @media (min-width: #{$bp-md}) {
      display: none;
    }
  }

  &__main {
    flex: 1;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;

    &--game-layout .app-shell__content {
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    // Desktop: push down from top nav
    @media (min-width: #{$bp-md}) {
      padding-top: 0;
    }

    // Mobile: push up from bottom nav
    @media (max-width: 767.98px) {
      padding-bottom: var(--nav-height-bottom);
    }
  }

  /**
   * Stretch routed views so BioWira scene pages can `flex-grow` instead of forcing
   * standalone `min-height: 100dvh` (+ footer scrolling). See `.route-shell` in `App.vue`.
   */
  &__content {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  &__footer {
    margin-top: auto;
  }
}
</style>
