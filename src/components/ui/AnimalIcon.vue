<script setup lang="ts">
/**
 * AnimalIcon — renders explorer SVG or discovery spirit art in one consistent chain:
 *
 * Resolution order:
 *   1. SVG from explorer registry (getAnimalIconUrl)
 *   2. Discovery spirit WEBP (getDiscoveryAnimalIconUrl) via {@link resolveExplorerAnimalIconUrl}
 *   3. Image load error                        → fallbackEmoji
 *   4. No URL resolvable                       → fallbackEmoji immediately
 *
 * Mirrors {@link explorerAnimalIconResolver} (also used by explorer picker + rescue Phaser preload).
 *
 * Usage (decorative — aria-hidden by default):
 *   <AnimalIcon icon-key="malayan-tiger" fallback-emoji="🐯" size="52px" />
 *
 * Prefer passing commonName when the key has no explorer SVG so discovery resolves reliably:
 *   <AnimalIcon icon-key="larut-torrent-frog" common-name="Larut Torrent Frog" fallback-emoji="🐸" />
 *
 * Explorer Rescue HUD: set use-rescue-runner-icon so URLs match {@link resolveRescueExplorerPlayerIconUrl}
 * (discovery spirit before explorer SVG — same preload chain as Phaser).
 */
import { ref, computed, watch } from 'vue'
import { resolveExplorerAnimalIconUrl } from '@/features/welcome/data/explorerAnimalIconResolver'
import { resolveRescueExplorerPlayerIconUrl } from '@/features/explorer-rescue-run/utils/explorerRescueSprites'

const props = withDefaults(
  defineProps<{
    /** Domain visual key (registry + discovery resolver). Omitting yields emoji fallback only. */
    iconKey?: string
    /** Optional common name — strengthens discovery slug resolution when no explorer SVG exists. */
    commonName?: string
    /**
     * When true (Explorer Rescue HUD/result summary), resolve via dedicated gameplay sprite → discovery WEBP → SVG,
     * matching the Phaser runner — not Welcome's SVG-first picker chain.
     */
    useRescueRunnerIcon?: boolean
    /** Emoji string to display when no SVG is available or the SVG fails to load */
    fallbackEmoji: string
    /** CSS dimension applied to both width and height. Default: '40px' */
    size?: string
    /**
     * Alt text for the image. Leave empty when a text label is already present
     * alongside the icon — aria-hidden is applied automatically.
     */
    alt?: string
  }>(),
  {
    iconKey: undefined,
    commonName: '',
    size: '40px',
    alt: '',
    useRescueRunnerIcon: false,
  },
)

const imageUrl = computed(() => {
  if (!props.iconKey) return undefined
  if (props.useRescueRunnerIcon) {
    const u = resolveRescueExplorerPlayerIconUrl(props.iconKey, props.commonName?.trim() ?? '')
    return u || undefined
  }
  return resolveExplorerAnimalIconUrl({
    visualKey: props.iconKey,
    commonName: props.commonName?.trim() ?? '',
  })
})

// Track whether we should render an <img> (reset when URLs change; clear on network failure).
const useImage = ref(Boolean(imageUrl.value))

watch(
  () => [props.iconKey, props.commonName, props.useRescueRunnerIcon] as const,
  () => {
    useImage.value = Boolean(imageUrl.value)
  },
)

function onImageError() {
  useImage.value = false
}

const hasAlt = computed(() => props.alt.length > 0)
</script>

<template>
  <!-- Explorer SVG or discovery spirit URL -->
  <img
    v-if="useImage && imageUrl"
    class="animal-icon"
    :src="imageUrl"
    :alt="hasAlt ? alt : ''"
    :aria-hidden="!hasAlt || undefined"
    :style="{ width: size, height: size }"
    draggable="false"
    @error="onImageError"
  >
  <!-- Emoji fallback -->
  <span
    v-else
    class="animal-icon animal-icon--emoji"
    :aria-hidden="!hasAlt || undefined"
    :style="{ fontSize: `calc(${size} * 0.7)` }"
    role="img"
    :aria-label="hasAlt ? alt : undefined"
  >{{ fallbackEmoji }}</span>
</template>

<style scoped>
.animal-icon {
  display: inline-block;
  object-fit: contain;
  /* Crisp pixel-art rendering — consistent with map sprite style */
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  vertical-align: middle;
  flex-shrink: 0;
  user-select: none;
  pointer-events: none;
}

.animal-icon--emoji {
  line-height: 1;
  text-align: center;
}
</style>
