<script setup lang="ts">
/**
 * JournalActionBar — bottom navigation bar for journal stamp pages.
 * Shows 4 buttons: Back to Home, Back to Game Histories, Back to Games, category CTA.
 */
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/app/config'
import PixelButton from '@/components/ui/PixelButton.vue'

const props = withDefaults(
  defineProps<{
    /** Label for the category-specific CTA (e.g. "Go to Eco-Comic Path") */
    ctaLabel: string
    /** Route name for the CTA. If not provided, CTA is hidden. */
    ctaRouteName?: string
    /** Category ID for CTA route params if needed */
    ctaParams?: Record<string, string>
  }>(),
  {
    ctaRouteName: undefined,
    ctaParams: undefined,
  },
)

const router = useRouter()

function goHome() {
  router.push({ name: ROUTE_NAMES.home })
}

function goToHistories() {
  router.push({ name: ROUTE_NAMES.gameJournalMenu })
}

function goToGames() {
  router.push({ name: ROUTE_NAMES.games })
}

function goToCta() {
  if (!props.ctaRouteName) return
  router.push({ name: props.ctaRouteName, ...(props.ctaParams ? { params: props.ctaParams } : {}) })
}
</script>

<template>
  <div class="journal-action-bar" data-testid="journal-action-bar">
    <PixelButton
      variant="blue"
      size="md"
      aria-label="Back to Home"
      data-testid="journal-action-home-btn"
      @click="goHome"
    >
      🏠 Back to Home
    </PixelButton>

    <PixelButton
      variant="blue"
      size="md"
      aria-label="Back to Game Histories"
      data-testid="journal-back-to-menu-btn"
      @click="goToHistories"
    >
      📔 Back to Game Histories
    </PixelButton>

    <PixelButton
      variant="blue"
      size="md"
      aria-label="Back to Games"
      data-testid="journal-back-to-games-btn"
      @click="goToGames"
    >
      🎮 Back to Games
    </PixelButton>

    <PixelButton
      v-if="ctaRouteName"
      variant="green"
      size="md"
      :aria-label="ctaLabel"
      data-testid="journal-action-cta-btn"
      @click="goToCta"
    >
      {{ ctaLabel }}
    </PixelButton>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.journal-action-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
  width: 100%;

  @media (max-width: $bp-lg) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: $bp-sm) {
    grid-template-columns: 1fr;
  }
}
</style>
