<script setup lang="ts">
/**
 * ExplorerAnimalIcon — renders an explorer animal icon using the multi-step resolver.
 *
 * Resolution order:
 *  1. SVG from explorer registry (getAnimalIconUrl)
 *  2. Discovery WEBP (getDiscoveryAnimalIconUrl) — covers Leatherback Sea Turtle etc.
 *  3. fallbackEmoji — always available from the catalog
 *
 * Use this instead of AnimalIcon for all explorer-facing UI surfaces so that
 * Leatherback Sea Turtle (and any future explorer without an SVG) renders correctly.
 */
import { ref, computed, watch } from 'vue'
import { resolveExplorerAnimalIconUrl } from '@/features/welcome/data/explorerAnimalIconResolver'

const props = withDefaults(
  defineProps<{
    /** Canonical visual key from the explorer catalog (e.g. 'leatherback-sea-turtle') */
    visualKey: string
    /** Human-readable common name from the catalog (used as icon resolver fallback) */
    commonName: string
    /** Emoji string shown when no icon image is available */
    fallbackEmoji: string
    /** CSS dimension applied to both width and height. Default: '40px' */
    size?: string
    /** Alt text for the image. Leave empty when a surrounding label is already present. */
    alt?: string
  }>(),
  {
    size: '40px',
    alt: '',
  },
)

const iconUrl = computed(() =>
  resolveExplorerAnimalIconUrl({ visualKey: props.visualKey, commonName: props.commonName }),
)

const useImage = ref(Boolean(iconUrl.value))

watch(
  () => props.visualKey,
  () => {
    useImage.value = Boolean(
      resolveExplorerAnimalIconUrl({ visualKey: props.visualKey, commonName: props.commonName }),
    )
  },
)

function onImageError() {
  useImage.value = false
}

const hasAlt = computed(() => props.alt.length > 0)
</script>

<template>
  <img
    v-if="useImage && iconUrl"
    class="explorer-animal-icon"
    :src="iconUrl"
    :alt="hasAlt ? alt : ''"
    :aria-hidden="!hasAlt || undefined"
    :style="{ width: size, height: size }"
    draggable="false"
    @error="onImageError"
  >
  <span
    v-else
    class="explorer-animal-icon explorer-animal-icon--emoji"
    :aria-hidden="!hasAlt || undefined"
    :style="{ fontSize: `calc(${size} * 0.7)` }"
    role="img"
    :aria-label="hasAlt ? alt : undefined"
  >{{ fallbackEmoji }}</span>
</template>

<style scoped>
.explorer-animal-icon {
  display: inline-block;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  vertical-align: middle;
  flex-shrink: 0;
  user-select: none;
  pointer-events: none;
}

.explorer-animal-icon--emoji {
  line-height: 1;
  text-align: center;
}
</style>
