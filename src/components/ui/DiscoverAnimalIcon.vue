<script setup lang="ts">
/**
 * DiscoverAnimalIcon — renders a discovery WEBP animal icon from the centralized
 * discovery registry, with a safe emoji fallback chain.
 *
 * This component is EXCLUSIVELY for Discover feature surfaces.
 * It is SEPARATE from AnimalIcon.vue, which serves explorer/profile surfaces.
 *
 * Resolution order:
 *  1. WEBP URL from discoveryAnimalIconRegistry (getDiscoveryAnimalIconUrl)
 *     → resolved via visualKey, then normalised commonName slug, then aliases
 *  2. WEBP image fails to load (404 / network error)
 *     → @error handler silently switches to fallbackEmoji
 *  3. No matching discovery WEBP exists for this animal
 *     → fallbackEmoji immediately (iconEmoji from animal domain model)
 *
 * DO NOT use this component for:
 *   - Explorer/profile icon picker (AvatarPicker.vue)
 *   - Explorer profile card (ExplorerProfileCard.vue)
 *   - Home hero mascot / chip (HomeHeroBanner.vue)
 *   - Any welcome/session surface
 * Those surfaces must continue using AnimalIcon.vue via the SVG explorer registry.
 *
 * Usage:
 *   <DiscoverAnimalIcon
 *     :visual-key="animal.visualKey"
 *     :common-name="animal.commonName"
 *     fallback-emoji="🐒"
 *     size="64px"
 *   />
 *
 *   <!-- With accessible alt text when no surrounding label: -->
 *   <DiscoverAnimalIcon
 *     :visual-key="animal.visualKey"
 *     :common-name="animal.commonName"
 *     fallback-emoji="🐒"
 *     size="64px"
 *     :alt="animal.commonName"
 *   />
 */
import { ref, computed, watch } from 'vue'
import { getDiscoveryAnimalIconUrl } from '@/app/discoveryAnimalIconRegistry'

const props = withDefaults(
  defineProps<{
    /**
     * Decoupled visual asset key from the animal domain model (e.g. 'sun-bear').
     * Used as the first candidate in the discovery icon resolver.
     * Omitting is safe — the resolver will fall through to commonName slug.
     */
    visualKey?: string
    /**
     * Animal common name (e.g. 'Sunda Pangolin').
     * Used as a slug fallback when visualKey does not resolve a WEBP.
     * Always required — it is the final auto-resolution candidate before emoji.
     */
    commonName: string
    /**
     * Emoji string to display when no discovery WEBP is available or fails to load.
     * Should be animal.iconEmoji from the domain model.
     */
    fallbackEmoji: string
    /**
     * CSS size applied to both width and height of the icon.
     * Default: '40px'
     */
    size?: string
    /**
     * Accessible alt text for the image.
     * Leave empty (default) when a text label is already present alongside the
     * icon — aria-hidden is applied automatically in that case.
     */
    alt?: string
  }>(),
  {
    visualKey: undefined,
    size: '40px',
    alt: '',
  },
)

// ── Icon URL resolution ───────────────────────────────────────────────────────

const iconUrl = computed(() =>
  getDiscoveryAnimalIconUrl({
    visualKey: props.visualKey,
    commonName: props.commonName,
  }),
)

// useWebp is initialised based on whether a URL resolves at mount time.
// When the parent re-uses this component for a different animal, the watcher
// below resets useWebp so the img/emoji branch is re-evaluated cleanly.
const useWebp = ref(Boolean(iconUrl.value))

watch(
  () => [props.visualKey, props.commonName] as const,
  () => {
    useWebp.value = Boolean(
      getDiscoveryAnimalIconUrl({
        visualKey: props.visualKey,
        commonName: props.commonName,
      }),
    )
  },
)

// ── Event handlers ─────────────────────────────────────────────────────────────

function onWebpError(): void {
  // WEBP file failed to load (e.g. 404 in dev or broken asset).
  // Silently fall through to emoji — no visible flicker.
  useWebp.value = false
}

// ── Accessibility ──────────────────────────────────────────────────────────────

const hasAlt = computed(() => props.alt.length > 0)
</script>

<template>
  <!--
    WEBP branch — shown when the discovery registry has a URL for this animal
    and the image loads successfully.
  -->
  <img
    v-if="useWebp && iconUrl"
    class="discover-animal-icon"
    :src="iconUrl"
    :alt="hasAlt ? alt : ''"
    :aria-hidden="!hasAlt || undefined"
    :style="{ width: size, height: size }"
    draggable="false"
    @error="onWebpError"
  >
  <!--
    Emoji fallback — shown when:
      a) No discovery WEBP is registered for this animal, OR
      b) The WEBP image failed to load (onWebpError fired)
    This is always the final safety net so Discover remains fully functional
    for animals not yet covered by the WEBP asset pack.
  -->
  <span
    v-else
    class="discover-animal-icon discover-animal-icon--emoji"
    :aria-hidden="!hasAlt || undefined"
    :style="{ fontSize: `calc(${size} * 0.7)` }"
    role="img"
    :aria-label="hasAlt ? alt : undefined"
  >{{ fallbackEmoji }}</span>
</template>

<style scoped>
.discover-animal-icon {
  display: inline-block;
  object-fit: contain;
  /*
    Pixel-art rendering — the discovery WEBPs are designed as crisp pixel-art
    icons and must not be blurred by the browser's default bicubic scaling.
    Consistent with AnimalIcon.vue and the BioWira pixel-art design language.
  */
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  vertical-align: middle;
  flex-shrink: 0;
  user-select: none;
  pointer-events: none;
}

.discover-animal-icon--emoji {
  display: inline-block;
  line-height: 1;
  text-align: center;
  vertical-align: middle;
  flex-shrink: 0;
  user-select: none;
  pointer-events: none;
}
</style>
