<script setup lang="ts">
/**
 * AppIcon — renders a nav/feature icon resolved through the central registry.
 *
 * Resolution order:
 *  1. Asset from registry (getNavIconUrl)        → <img> with object-fit contain
 *  2. `fallbackText` prop if provided          → plain text (emoji or label)
 *  3. Nothing rendered                         → component outputs empty
 *
 * The `fallbackText` safety net ensures nav items never go visually blank if
 * an icon key is added but its asset is forgotten in the registry.
 *
 * Usage (decorative, text label present elsewhere):
 *   <AppIcon icon-key="home" size="20px" />
 *
 * Usage (with explicit fallback):
 *   <AppIcon icon-key="home" size="20px" fallback-text="🏠" />
 *
 * Usage (with accessible alt text):
 *   <AppIcon icon-key="home" size="20px" alt="Home" />
 */
import { computed } from 'vue'
import { getNavIconUrl } from '@/app/iconRegistry'

const props = withDefaults(
  defineProps<{
    /** Logical icon key — must be registered in iconRegistry.ts */
    iconKey: string
    /** CSS dimension applied to both width and height. Default: '24px' */
    size?: string
    /**
     * Alt text for screen readers.
     * Leave empty when a text label is already present alongside the icon
     * (aria-hidden will be applied automatically).
     */
    alt?: string
    /**
     * Fallback content (emoji string or short label) shown when the registry
     * has no URL for `iconKey`. Prevents a completely blank UI slot.
     * Example: fallback-text="🏠"
     */
    fallbackText?: string
  }>(),
  {
    size: '24px',
    alt: '',
    fallbackText: '',
  },
)

const iconUrl = computed(() => getNavIconUrl(props.iconKey))

/** True when there is no accessible text label next to this icon */
const hasAlt = computed(() => props.alt.length > 0)
</script>

<template>
  <!-- Icon resolved from registry (WebP/SVG/PNG) -->
  <img
    v-if="iconUrl"
    class="app-icon"
    :src="iconUrl"
    :alt="hasAlt ? alt : ''"
    :aria-hidden="!hasAlt || undefined"
    :style="{ width: size, height: size }"
    draggable="false"
  >
  <!-- Fallback text (emoji or label) when registry has no entry -->
  <span
    v-else-if="fallbackText"
    class="app-icon app-icon--fallback"
    :aria-hidden="!hasAlt || undefined"
    :style="{ fontSize: size }"
  >{{ fallbackText }}</span>
  <!-- Otherwise: nothing rendered intentionally -->
</template>

<style scoped>
.app-icon {
  display: inline-block;
  object-fit: contain;
  /* Preserve crisp rendering for pixel-art WebP / SVG */
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  vertical-align: middle;
  flex-shrink: 0;
  user-select: none;
  pointer-events: none;
}

.app-icon--fallback {
  line-height: 1;
}
</style>
