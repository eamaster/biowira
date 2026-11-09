<script setup lang="ts">
/**
 * RescueChoiceIcon — choice-card animal icon with a two-level fallback chain.
 *
 * Resolution order (best quality first):
 *  1. Discovery WEBP (src/assets/discovery-animals/*.webp via getDiscoveryAnimalIconUrl)
 *  2. Explorer SVG  (public/icons/animals/*.svg via getAnimalIconUrl)
 *  3. fallbackEmoji prop
 *
 * This handles animals that have a discovery WEBP (e.g. Sun Bear, Rhinoceros Hornbill) as
 * well as animals that only have an explorer SVG (e.g. Saltwater Crocodile).
 *
 * Do NOT use this component outside of the Explorer Rescue Run choosing overlay.
 * Discover-page surfaces should continue using DiscoverAnimalIcon.vue.
 *
 * Local discovery WebP + explorer SVG are BioWira UI artwork (no per-photo Commons caption).
 * Choice `imageUrl` / `avatarPath` from the API are not rendered here or in Phaser scenes—
 * real wildlife photos stay on Discover detail with `CitedImage` + attribution.
 */
import { ref, computed } from 'vue'
import { getDiscoveryAnimalIconUrl } from '@/app/discoveryAnimalIconRegistry'
import { getAnimalIconUrl } from '@/app/iconRegistry'

const props = withDefaults(
  defineProps<{
    visualKey: string
    commonName: string
    fallbackEmoji?: string
    size?: string
    alt?: string
    /** Use `--game-choice-animal-size` from an ancestor instead of `size` */
    useCssVars?: boolean
  }>(),
  {
    fallbackEmoji: '❓',
    size: '64px',
    alt: '',
    useCssVars: false,
  },
)

const dims = computed(() =>
  props.useCssVars
    ? { width: 'var(--game-choice-animal-size, 80px)', height: 'var(--game-choice-animal-size, 80px)' }
    : { width: props.size, height: props.size },
)

const emojiFont = computed(() =>
  props.useCssVars ? 'calc(var(--game-choice-animal-size, 80px) * 0.7)' : `calc(${props.size} * 0.7)`,
)

// Resolve discovery WEBP first, then SVG fallback
const discoveryUrl = computed(() =>
  getDiscoveryAnimalIconUrl({ visualKey: props.visualKey, commonName: props.commonName }),
)

const svgUrl = computed(() => getAnimalIconUrl(props.visualKey))

// Track image-load failures for each level
const discoveryFailed = ref(false)
const svgFailed = ref(false)

function onDiscoveryError() { discoveryFailed.value = true }
function onSvgError() { svgFailed.value = true }

const showDiscovery = computed(() => Boolean(discoveryUrl.value) && !discoveryFailed.value)
const showSvg = computed(() => !showDiscovery.value && Boolean(svgUrl.value) && !svgFailed.value)
</script>

<template>
  <!-- Level 1: Discovery WEBP -->
  <img
    v-if="showDiscovery"
    :src="discoveryUrl!"
    :alt="props.alt || props.commonName"
    class="rescue-choice-icon rescue-choice-icon--webp"
    :style="dims"
    draggable="false"
    @error="onDiscoveryError"
  >

  <!-- Level 2: Explorer SVG -->
  <img
    v-else-if="showSvg"
    :src="svgUrl!"
    :alt="props.alt || props.commonName"
    class="rescue-choice-icon rescue-choice-icon--svg"
    :style="dims"
    draggable="false"
    @error="onSvgError"
  >

  <!-- Level 3: Emoji fallback (no discovery WebP and no explorer SVG available) -->
  <span
    v-else
    class="rescue-choice-icon rescue-choice-icon--emoji"
    :aria-label="props.alt || props.commonName"
    :style="{ fontSize: emojiFont, ...dims }"
    role="img"
  >{{ props.fallbackEmoji }}</span>
</template>

<style scoped>
.rescue-choice-icon {
  display: inline-block;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  vertical-align: middle;
  flex-shrink: 0;
  user-select: none;
  pointer-events: none;
}

.rescue-choice-icon--emoji {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  text-align: center;
}
</style>
