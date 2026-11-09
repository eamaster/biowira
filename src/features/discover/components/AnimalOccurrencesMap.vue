<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Animal, AnimalOccurrence } from '@/domain/animal'
import { getMapboxToken, MAPBOX_CONFIG } from '@/app/config'
import { getDiscoveryAnimalIconUrl } from '@/app/discoveryAnimalIconRegistry'
import { escapeHtml } from '@/utils/htmlEscape'
import PixelEmptyState from '@/components/ui/PixelEmptyState.vue'
import PixelButton from '@/components/ui/PixelButton.vue'

const props = defineProps<{
  animal: Animal | null
}>()

const emit = defineEmits<{
  'close': []
}>()

const mapContainer = ref<HTMLElement | null>(null)
let mapInstance: mapboxgl.Map | null = null
const markers: mapboxgl.Marker[] = []

const token = getMapboxToken()

function close() {
  emit('close')
}

function cleanupMap() {
  markers.forEach((m) => m.remove())
  markers.length = 0
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
}

onMounted(() => {
  if (props.animal && token) {
    if (!mapContainer.value) return

    mapboxgl.accessToken = token
    const occurrences = props.animal.occurrences || []

    // Evaluate if we should fit bounds or use default
    const hasOccurrences = occurrences.length > 0
    const initialCenter = (hasOccurrences && occurrences[0])
      ? ([occurrences[0].longitude, occurrences[0].latitude] as [number, number])
      : MAPBOX_CONFIG.defaultCenter

    mapInstance = new mapboxgl.Map({
      container: mapContainer.value,
      style: MAPBOX_CONFIG.style,
      projection: MAPBOX_CONFIG.projection,
      center: initialCenter,
      zoom: hasOccurrences ? 6 : MAPBOX_CONFIG.defaultZoom,
      minZoom: MAPBOX_CONFIG.minZoom,
      maxZoom: MAPBOX_CONFIG.maxZoom,
      maxBounds: MAPBOX_CONFIG.maxBounds,
      pitchWithRotate: false,
      dragRotate: false,
      attributionControl: false // Keep it clean for pixel UI
    })

    // Fit bounds if occurrences span an area
    if (hasOccurrences && occurrences.length > 1 && mapInstance) {
      const bounds = new mapboxgl.LngLatBounds()
      occurrences.forEach((occ: AnimalOccurrence) => {
        bounds.extend([occ.longitude, occ.latitude])
      })
      mapInstance.fitBounds(bounds, { padding: MAPBOX_CONFIG.fitPadding, maxZoom: 10 })
    }

    mapInstance.addControl(new mapboxgl.NavigationControl({
      showCompass: false // Disabled rotation
    }), 'top-right')

    // Add custom pixel marker for each occurrence
    for (const occ of occurrences) {
      const el = document.createElement('div')
      el.className = 'pixel-marker'

      const iconUrl = getDiscoveryAnimalIconUrl({
        visualKey: props.animal.visualKey,
        commonName: props.animal.commonName,
      })

      if (iconUrl) {
        const img = document.createElement('img')
        img.src = iconUrl
        img.alt = props.animal.commonName
        img.style.width = '24px'
        img.style.height = '24px'
        img.style.imageRendering = 'pixelated'
        img.style.pointerEvents = 'none'

        el.appendChild(img)
        el.style.background = 'transparent'
        el.style.border = 'none'
        el.style.boxShadow = 'none'
      } else {
        el.innerText = props.animal.iconEmoji
      }

      const popupHtml = `
        <div class="pixel-popup-content">
          <strong>${escapeHtml(props.animal?.commonName ?? 'Animal')}</strong>
          <p>${occ.latitude.toFixed(4)}, ${occ.longitude.toFixed(4)}</p>
        </div>
      `

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtml)

      const marker = new mapboxgl.Marker(el)
        .setLngLat([occ.longitude, occ.latitude])
        .setPopup(popup)
        .addTo(mapInstance)

      markers.push(marker)
    }
  }
})

onBeforeUnmount(() => {
  cleanupMap()
})
</script>

<template>
  <div class="map-view">
    <div class="map-view__header">
      <PixelButton variant="gray" size="sm" @click="close">⬅ Back to Animal</PixelButton>
      <h2 class="map-view__title">{{ animal?.commonName }} Occurrences</h2>
    </div>

    <div class="map-view__content">
      <template v-if="!token">
        <PixelEmptyState
          emoji="🗺️"
          title="Map Unavailable"
          description="No Mapbox Access Token found. Please configure VITE_MAPBOX_ACCESS_TOKEN in your env file."
        />
      </template>
      <template v-else-if="!animal?.occurrences || animal.occurrences.length === 0">
        <PixelEmptyState
          emoji="📍"
          title="No Data"
          description="No occurrences recorded yet for this animal."
        />
      </template>
      <template v-else>
        <div ref="mapContainer" class="map-container"></div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.map-view {
  background: var(--color-bg);
  border: var(--pixel-border) solid var(--color-border);
  border-radius: var(--radius-lg);
  width: 100%;
  height: 80vh;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__header {
    background: var(--color-bg-nav);
    padding: var(--space-3) var(--space-4);
    display: flex;
    justify-content: flex-start;
    gap: var(--space-4);
    align-items: center;
    border-bottom: var(--pixel-border) solid var(--color-border);
  }

  &__title {
    font-family: var(--font-readable);
    font-weight: 800;
    color: var(--color-secondary);
    font-size: clamp(18px, 3vw, 24px);
    margin: 0;
  }



  &__content {
    flex: 1;
    position: relative;
    background: var(--color-bg-card);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.map-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>

<style lang="scss">
/* Unscoped global overrides for Mapbox injected elements */
.pixel-marker {
  width: 32px;
  height: 32px;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: var(--pixel-shadow);
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.15);
  }
}

.mapboxgl-popup-content {
  background: var(--color-bg-card) !important;
  border: 2px solid var(--color-border) !important;
  border-radius: var(--radius-sm) !important;
  font-family: var(--font-body) !important;
  color: var(--color-text) !important;
  box-shadow: var(--pixel-shadow) !important;
  padding: 12px 16px !important;
}

.mapboxgl-popup-tip {
  border-top-color: var(--color-border) !important;
}

.pixel-popup-content {
  strong {
    font-family: var(--font-readable);
    font-weight: 800;
    font-size: var(--text-base);
    display: block;
    margin-bottom: 8px;
    color: var(--color-primary);
  }
  p {
    margin: 4px 0;
    font-size: 13px;
  }
}
</style>
