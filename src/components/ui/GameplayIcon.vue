<script setup lang="ts">
/**
 * GameplayIcon — asset-backed icon for all gameplay/progress/reward surfaces.
 *
 * Uses uploaded SVG files from public/icons/rewards/ via the centralized
 * getGameplayIconUrl() helper in iconRegistry.ts.
 *
 * Supported type keys: leafLevel · trophy · missions · habitatForest · journalPassport · pawTrail · legacy coin/coins
 * Inline SVG quiz feedback (correct / wrong) stays in RewardIcon.vue — no asset for those.
 */
import { computed } from 'vue'
import { getGameplayIconUrl } from '@/app/iconRegistry'

const props = withDefaults(
  defineProps<{
    type: string
    size?: string
    alt?: string
  }>(),
  {
    size: '24px',
    alt: '',
  },
)

const url = computed(() => getGameplayIconUrl(props.type))

const wrapperStyle = computed(() => ({
  width: props.size,
  height: props.size,
  minWidth: props.size,
}))
</script>

<template>
  <span class="gameplay-icon" :style="wrapperStyle" aria-hidden="true">
    <img
      v-if="url"
      :src="url"
      :alt="alt"
      class="gameplay-icon__img"
      draggable="false"
    >
    <!-- Fallback: render nothing visible but keep the space so layout holds -->
    <span v-else class="gameplay-icon__fallback" aria-hidden="true"></span>
  </span>
</template>

<style scoped>
.gameplay-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  pointer-events: none;
  user-select: none;
  line-height: 0;
}

.gameplay-icon__img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  /* Preserve crisp pixel-art rendering */
  image-rendering: auto;
}

.gameplay-icon__fallback {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
