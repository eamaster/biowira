<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Animal } from '@/domain/animal'
import type { AnimalMapPosition } from '@/domain/animal'
import AnimalMarker from './AnimalMarker.vue'
import { DISCOVER_MAP_CONFIG } from '@/app/config'

const props = defineProps<{
  animals: Animal[]
}>()

const emit = defineEmits<{
  selectAnimal: [animal: Animal]
}>()

// ── Responsive breakpoint tracking ─────────────────────────────────────────────
// We track isMobile reactively so marker positions switch between desktop and
// mobile calibrations at the same breakpoint as the <picture> source swap.
const isMobile = ref(false)

function updateBreakpoint() {
  isMobile.value = window.innerWidth < DISCOVER_MAP_CONFIG.mobileBreakpoint
}

onMounted(() => {
  updateBreakpoint()
  window.addEventListener('resize', updateBreakpoint)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateBreakpoint)
})

// ── Per-animal resolved position ───────────────────────────────────────────────
// Returns the correct x/y for the current viewport.
// Mobile falls back to desktop when mobile coords are absent.
function resolvePosition(pos: AnimalMapPosition): { x: number; y: number } {
  if (isMobile.value && pos.mobile) return pos.mobile
  return pos.desktop
}

// ── Map container aspect ratio ─────────────────────────────────────────────────
// Used as a CSS fallback while the image loads (prevents layout shift).
// The <img> itself drives the final rendered dimensions via width:100%;height:auto.
const aspectRatio = computed(() =>
  isMobile.value
    ? DISCOVER_MAP_CONFIG.mobileAspectRatio
    : DISCOVER_MAP_CONFIG.desktopAspectRatio,
)

// ── Habitat zone metadata ──────────────────────────────────────────────────────
// These zones no longer render as colored rectangles.
// Kept here as structured metadata for future logic:
//   - marker placement validation
//   - accessible zone labels
//   - filtering / routing extensions (Epic 4+)
// Do not delete — use this when adding zone-aware features.
const HABITAT_ZONE_METADATA = [
  { id: 'rainforest',     label: 'Rainforest',    desktopBounds: { x: 3,  y: 10, w: 39, h: 85 }, mobileBounds: { x: 5,  y: 5,  w: 70, h: 45 } },
  { id: 'mountain',      label: 'Mountain',       desktopBounds: { x: 8,  y: 15, w: 25, h: 50 }, mobileBounds: { x: 12, y: 10, w: 35, h: 30 } },
  { id: 'river',         label: 'River',          desktopBounds: { x: 5,  y: 30, w: 30, h: 10 }, mobileBounds: { x: 8,  y: 20, w: 50, h: 8  } },
  { id: 'coastal_area',  label: 'Coastal Area',   desktopBounds: { x: 53, y: 65, w: 40, h: 20 }, mobileBounds: { x: 15, y: 40, w: 65, h: 10 } },
  { id: 'mangrove',      label: 'Mangrove',       desktopBounds: { x: 55, y: 60, w: 20, h: 20 }, mobileBounds: { x: 30, y: 72, w: 25, h: 15 } },
  { id: 'marine_reserve',label: 'Marine Reserve', desktopBounds: { x: 40, y: 75, w: 55, h: 20 }, mobileBounds: { x: 10, y: 48, w: 80, h: 18 } },
] as const

// Suppress unused-variable lint while keeping metadata in scope
void HABITAT_ZONE_METADATA
</script>

<template>
  <div
    class="habitat-map"
    role="region"
    aria-label="Pixel-art habitat map of Malaysian animals"
    :style="{ aspectRatio }"
  >
    <!--
      ── Pixel-art map background ───────────────────────────────────────────────
      <picture> swaps the source at the mobileBreakpoint.
      The img drives the container height via width:100%; height:auto —
      so marker percentages are always relative to the actual rendered image.
    -->
    <picture class="habitat-map__bg" aria-hidden="true">
      <source
        :media="`(max-width: ${DISCOVER_MAP_CONFIG.mobileBreakpoint - 1}px)`"
        :srcset="DISCOVER_MAP_CONFIG.mobileAsset"
      >
      <img
        class="habitat-map__img"
        :src="DISCOVER_MAP_CONFIG.desktopAsset"
        alt=""
        draggable="false"
      >
    </picture>

    <!-- ── Marker overlay ────────────────────────────────────────────────────── -->
    <div class="habitat-map__overlay" aria-hidden="false">
      <AnimalMarker
        v-for="animal in animals"
        :key="animal.id"
        :animal="animal"
        :style="{
          left: `${resolvePosition(animal.mapPosition).x}%`,
          top: `${resolvePosition(animal.mapPosition).y}%`,
        }"
        @select="emit('selectAnimal', $event)"
      />
    </div>

    <!-- ── Empty state ───────────────────────────────────────────────────────── -->
    <div v-if="animals.length === 0" class="habitat-map__empty" role="status">
      <span aria-hidden="true">🔍</span>
      <p>No animals found in this category</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.habitat-map {
  position: relative;
  width: 100%;
  // aspect-ratio is set dynamically above as a load-skeleton fallback.
  // Once the <img> loads, it drives its own intrinsic dimensions.
  border-radius: var(--radius-lg);
  border: var(--pixel-border-thick) solid var(--color-border);
  overflow: hidden;
  // Deep-ocean blue — matches the pixel-art sea colour exactly
  background: #1a6fa8;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.25);

  // ── Background image ────────────────────────────────────────────────────────
  &__bg {
    display: block;
    width: 100%;
    line-height: 0; // collapse whitespace
  }

  &__img {
    display: block;
    width: 100%;
    height: auto;
    // Crisp pixel-art rendering — no blurry interpolation
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    user-select: none;
    pointer-events: none;
  }

  // ── Marker overlay ──────────────────────────────────────────────────────────
  // Sits on top of the image, inset:0 so percentage-based left/top on each
  // marker child is relative to the exact same box as the rendered image.
  &__overlay {
    position: absolute;
    inset: 0;
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  &__empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    background: rgba(0, 0, 0, 0.55);
    border-radius: var(--radius-lg);

    span { font-size: 40px; }

    p {
      font-family: var(--font-readable);
      font-size: var(--text-base);
      font-weight: 800;
      color: #fff;
      text-align: center;
      padding: 0 var(--space-4);
      text-shadow: 1px 1px 0 rgba(0,0,0,0.8);
    }
  }
}
</style>
