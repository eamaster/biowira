<script setup lang="ts">
import { computed } from 'vue'
import { ECO_COMICS_RIBBON_TAGLINE } from '../data/ecoComicStoryCatalog'

const props = withDefaults(
  defineProps<{
    /** Story titles for `reader` variant (accent line). */
    storyTitles?: string[]
    /**
     * `library`: Eco-Comics hub — ribbon shows shared tagline only (`ECO_COMICS_RIBBON_TAGLINE`).
     * `reader`: In-story — ribbon shows story title(s) only (accent line).
     * `result`: Result surfaces — story title(s) only; inherits `.scene-page__subtitle` color/typography (matches Mission/Quiz results).
     */
    variant?: 'library' | 'reader' | 'result'
  }>(),
  { variant: 'library' },
)

const titleLine = computed(() => (props.storyTitles ?? []).filter(Boolean).join(' · '))

const showTagline = computed(() => props.variant === 'library')
const showAccentTitles = computed(
  () => props.variant === 'reader' && Boolean(titleLine.value),
)
const showResultTitle = computed(() => props.variant === 'result' && Boolean(titleLine.value))

const tagline = ECO_COMICS_RIBBON_TAGLINE
</script>

<template>
  <div class="eco-comics-ribbon-lines" data-testid="eco-comics-ribbon-subtitle">
    <span v-if="showTagline" class="eco-comics-ribbon-lines__lead">{{ tagline }}</span>
    <span v-if="showAccentTitles" class="eco-comics-ribbon-lines__titles">{{ titleLine }}</span>
    <span v-if="showResultTitle" class="eco-comics-ribbon-lines__result-line">{{ titleLine }}</span>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.eco-comics-ribbon-lines {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  min-width: 0;
}

.eco-comics-ribbon-lines__lead {
  font-weight: 800;
  line-height: 1.35;
  color: inherit;
}

.eco-comics-ribbon-lines__titles {
  font-family: var(--font-readable);
  font-weight: 900;
  font-size: clamp(16px, 1.3vw + 12px, 22px);
  line-height: 1.25;
  color: var(--color-secondary);
  text-shadow: 1px 1px 0 rgba(61, 43, 31, 0.12);
}

/** Match parent `BioWiraScenePage` `.scene-page__subtitle` (result pages). */
.eco-comics-ribbon-lines__result-line {
  color: inherit;
  font: inherit;
  font-weight: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  margin: 0;
}
</style>
