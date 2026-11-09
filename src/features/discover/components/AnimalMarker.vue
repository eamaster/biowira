<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Animal } from '@/domain/animal'
import { STATUS_COLORS } from '@/app/config'
import { getMarkerSpriteUrl } from '@/app/config'
import { getDiscoveryAnimalIconUrl } from '@/app/discoveryAnimalIconRegistry'

const props = defineProps<{
  animal: Animal
}>()

const emit = defineEmits<{
  select: [animal: Animal]
}>()

// ── Conservation status glow colour ────────────────────────────────────────────
const glowColor = computed(() => STATUS_COLORS[props.animal.conservationStatus] ?? '#888')

// ── Icon fallback chain (discovery-first) ──────────────────────────────────────
// Priority order:
//   1. Discovery WEBP icon (from discoveryAnimalIconRegistry)
//   2. Legacy pixel-art sprite PNG (public/sprites/<key>.png)
//   3. iconEmoji — always present, final safe fallback
//
// Explorer SVG icons (iconRegistry.ts) are intentionally NOT used here;
// discovery surfaces use the separate WEBP icon family.

// Level 1 — discovery WEBP
const discoveryIconUrl = computed(() =>
  getDiscoveryAnimalIconUrl({
    visualKey: props.animal.visualKey,
    commonName: props.animal.commonName,
  }),
)
const useDiscovery = ref(Boolean(discoveryIconUrl.value))

// Level 2 — legacy sprite PNG (only attempted when no WEBP is available)
const spriteUrl = computed(() => getMarkerSpriteUrl(props.animal.markerSpriteKey))
const useSprite = ref(!discoveryIconUrl.value && Boolean(spriteUrl.value))

// Re-evaluate both levels when the displayed animal changes
watch(
  () => props.animal,
  (newAnimal) => {
    const hasWebp = Boolean(
      getDiscoveryAnimalIconUrl({
        visualKey: newAnimal.visualKey,
        commonName: newAnimal.commonName,
      }),
    )
    useDiscovery.value = hasWebp
    useSprite.value = !hasWebp && Boolean(getMarkerSpriteUrl(newAnimal.markerSpriteKey))
  },
)

function onDiscoveryError(): void {
  // Discovery WEBP failed to load — fall through to sprite / emoji.
  useDiscovery.value = false
  // If a sprite exists, try it now
  useSprite.value = Boolean(spriteUrl.value)
}

function onSpriteError(): void {
  // Sprite file is missing or failed to load — fall back to emoji silently.
  useSprite.value = false
}
</script>

<template>
  <button
    class="animal-marker"
    data-testid="animal-marker"
    :aria-label="`View ${animal.commonName} — ${animal.conservationStatus}`"
    :style="{ '--glow': glowColor }"
    @click="emit('select', animal)"
  >
    <span class="animal-marker__bubble">
      <!--
        Level 1: Discovery WEBP icon (from discoveryAnimalIconRegistry).
        Uses the new WEBP icon family — separate from the explorer SVG registry.
        @error silently falls through to sprite / emoji without a visible flicker.
      -->
      <img
        v-if="useDiscovery && discoveryIconUrl"
        class="animal-marker__sprite"
        :src="discoveryIconUrl"
        :alt="animal.commonName"
        draggable="false"
        @error="onDiscoveryError"
      >
      <!--
        Level 2: Legacy pixel-art sprite PNG (when no WEBP is registered).
        @error silently switches to emoji fallback without any visible flicker.
      -->
      <img
        v-else-if="useSprite && spriteUrl"
        class="animal-marker__sprite"
        :src="spriteUrl"
        :alt="animal.commonName"
        draggable="false"
        @error="onSpriteError"
      >
      <!--
        Level 3: Emoji fallback — when no WEBP and no sprite / both failed to load.
        This is always the final safety net.
      -->
      <span
        v-else
        class="animal-marker__emoji"
        aria-hidden="true"
      >{{ animal.iconEmoji }}</span>
    </span>

    <span class="animal-marker__name">{{ animal.commonName }}</span>
  </button>
</template>

<style scoped lang="scss">
.animal-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  z-index: 2;
  transition: transform var(--transition-bounce);

  // Invisible expanded tap target — keeps hit area large on mobile
  // without changing the visual footprint of the marker.
  &::before {
    content: '';
    position: absolute;
    inset: -10px;
  }

  &:hover,
  &:focus-visible {
    transform: translate(-50%, -60%) scale(1.2);
    z-index: 3;

    .animal-marker__bubble {
      box-shadow:
        0 0 16px 6px var(--glow),
        2px 2px 0 rgba(0, 0, 0, 0.3);
    }
  }

  &:focus-visible {
    outline: none;
    .animal-marker__bubble {
      outline: 3px solid var(--color-secondary);
      outline-offset: 3px;
    }
  }

  // ── Bubble container ─────────────────────────────────────────────────────────
  // The circular ring carries the conservation-status colour as a glow border.
  &__bubble {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-bg-card);
    border: 3px solid var(--glow);
    box-shadow: 0 0 8px 3px var(--glow), 2px 2px 0 rgba(0, 0, 0, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: box-shadow var(--transition-fast);
    animation: glow-pulse 3s ease-in-out infinite;
  }

  // ── Sprite (pixel-art image) ──────────────────────────────────────────────────
  &__sprite {
    width: 38px;
    height: 38px;
    object-fit: contain;
    // Crisp pixel-art rendering — critical for pixel-art assets
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    pointer-events: none;
    user-select: none;
  }

  // ── Emoji fallback ───────────────────────────────────────────────────────────
  &__emoji {
    font-size: 26px;
    line-height: 1;
    image-rendering: pixelated;
  }

  // ── Name label ───────────────────────────────────────────────────────────────
  &__name {
    font-family: var(--font-readable);
    font-size: var(--text-xs);
    font-weight: 700;
    color: #fff;
    text-shadow:
      1px 1px 0 #000,
      -1px -1px 0 #000,
      1px -1px 0 #000,
      -1px 1px 0 #000;
    white-space: nowrap;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.45);
    border-radius: 3px;
    padding: 2px 6px;
  }
}

// ── Glow pulse animation ───────────────────────────────────────────────────────
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 8px 3px var(--glow), 2px 2px 0 rgba(0, 0, 0, 0.25); }
  50%       { box-shadow: 0 0 16px 5px var(--glow), 2px 2px 0 rgba(0, 0, 0, 0.25); }
}

// ── Reduced motion ─────────────────────────────────────────────────────────────
@media (prefers-reduced-motion: reduce) {
  .animal-marker {
    transition: none;
    &:hover, &:focus-visible { transform: translate(-50%, -50%); }
  }
  .animal-marker__bubble {
    animation: none;
    transition: none;
  }
}
</style>
