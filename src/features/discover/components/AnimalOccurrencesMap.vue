<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Animal, AnimalOccurrence } from '@/domain/animal'
import { getMapboxToken, resolveMapboxToken, MAPBOX_CONFIG } from '@/app/config'
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
let leafletInstance: L.Map | null = null
const markers: mapboxgl.Marker[] = []

const token = ref<string | undefined>(getMapboxToken())
const isLoadingToken = ref(false)
const activeEngine = ref<'mapbox' | 'leaflet' | null>(null)

function close() {
  emit('close')
}

function cleanupMap() {
  markers.forEach((m) => m.remove())
  markers.length = 0
  if (mapInstance) {
    try {
      mapInstance.remove()
    } catch {
      // Ignore cleanup error if context already destroyed
    }
    mapInstance = null
  }
  if (leafletInstance) {
    try {
      leafletInstance.remove()
    } catch {
      // Ignore cleanup error
    }
    leafletInstance = null
  }
  activeEngine.value = null
}

/**
 * Check whether WebGL can actually be acquired on the client without throwing.
 * This prevents Mapbox GL's _setupPainter from calling this.fire(new ErrorEvent('Failed to initialize WebGL'))
 * and flooding the console on systems with disabled/faulty hardware acceleration.
 */
function isWebGLSupported(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('experimental-webgl')
    if (!gl) return false
    if (typeof (gl as WebGLRenderingContext).createProgram !== 'function') return false
    const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')
    if (ext) ext.loseContext()
    return true
  } catch {
    return false
  }
}

/**
 * Leaflet 2D OpenStreetMap raster map engine.
 * Requires ZERO WebGL and runs smoothly on 100% of devices and browsers.
 */
function renderLeafletMap() {
  cleanupMap()
  if (!mapContainer.value || !props.animal) return

  const occurrences = props.animal.occurrences || []
  const hasOccurrences = occurrences.length > 0
  const initialCenter: [number, number] = (hasOccurrences && occurrences[0])
    ? [occurrences[0].latitude, occurrences[0].longitude]
    : [MAPBOX_CONFIG.defaultCenter[1], MAPBOX_CONFIG.defaultCenter[0]]

  try {
    const map = L.map(mapContainer.value, {
      center: initialCenter,
      zoom: hasOccurrences ? 6 : MAPBOX_CONFIG.defaultZoom,
      minZoom: 4,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false,
    })

    L.control.zoom({ position: 'topright' }).addTo(map)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    const iconUrl = getDiscoveryAnimalIconUrl({
      visualKey: props.animal.visualKey,
      commonName: props.animal.commonName,
    })

    const customIcon = L.divIcon({
      className: 'pixel-leaflet-marker',
      html: iconUrl
        ? `<div class="pixel-marker"><img src="${iconUrl}" style="width:24px;height:24px;image-rendering:pixelated;pointer-events:none;" alt="${escapeHtml(props.animal.commonName)}"/></div>`
        : `<div class="pixel-marker">${props.animal.iconEmoji || '🐾'}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    })

    const points: [number, number][] = []
    for (const occ of occurrences) {
      points.push([occ.latitude, occ.longitude])
      const popupHtml = `
        <div class="pixel-popup-content">
          <strong>${escapeHtml(props.animal.commonName)}</strong>
          <p>${occ.latitude.toFixed(4)}, ${occ.longitude.toFixed(4)}</p>
        </div>
      `
      L.marker([occ.latitude, occ.longitude], { icon: customIcon })
        .bindPopup(popupHtml, { offset: [0, -10] })
        .addTo(map)
    }

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 10 })
    }

    leafletInstance = map
    activeEngine.value = 'leaflet'
  } catch (err) {
    console.warn('[BioWira map] Leaflet 2D map fallback error:', err)
  }
}

/**
 * Mapbox GL WebGL vector map engine.
 */
function renderMapboxMap(authToken: string) {
  cleanupMap()
  if (!mapContainer.value || !props.animal) return

  mapboxgl.accessToken = authToken
  const occurrences = props.animal.occurrences || []
  const hasOccurrences = occurrences.length > 0
  const initialCenter = (hasOccurrences && occurrences[0])
    ? ([occurrences[0].longitude, occurrences[0].latitude] as [number, number])
    : MAPBOX_CONFIG.defaultCenter

  try {
    const map = new mapboxgl.Map({
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
      attributionControl: false,
    })

    map.on('webglcontextlost', () => {
      // GPU context lost -> cleanly swap to 2D Leaflet without crashing
      renderLeafletMap()
    })

    if (hasOccurrences && occurrences.length > 1) {
      const bounds = new mapboxgl.LngLatBounds()
      occurrences.forEach((occ: AnimalOccurrence) => {
        bounds.extend([occ.longitude, occ.latitude])
      })
      map.fitBounds(bounds, { padding: MAPBOX_CONFIG.fitPadding, maxZoom: 10 })
    }

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

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
        .addTo(map)

      markers.push(marker)
    }

    mapInstance = map
    activeEngine.value = 'mapbox'
  } catch {
    // If Mapbox GL painter throws, immediately fallback to Leaflet 2D map
    renderLeafletMap()
  }
}

/**
 * Intelligent map entry point:
 * Uses WebGL Mapbox GL if hardware acceleration is functional and token is available.
 * Seamlessly uses Leaflet 2D raster engine if WebGL is disabled, unsupported, or fails.
 */
function initMap() {
  if (!mapContainer.value || !props.animal) return

  if (isWebGLSupported() && token.value) {
    renderMapboxMap(token.value)
  } else {
    renderLeafletMap()
  }
}

onMounted(async () => {
  if (!token.value) {
    isLoadingToken.value = true
    try {
      token.value = await resolveMapboxToken()
    } finally {
      isLoadingToken.value = false
    }
  }

  if (props.animal) {
    await nextTick()
    initMap()
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
      <template v-if="isLoadingToken">
        <PixelEmptyState
          emoji="🗺️"
          title="Loading Map..."
          description="Connecting to occurrence map services."
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
/* Unscoped global overrides for Mapbox & Leaflet elements */
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

.pixel-leaflet-marker {
  background: transparent !important;
  border: none !important;
}

.mapboxgl-popup-content,
.leaflet-popup-content-wrapper {
  background: var(--color-bg-card) !important;
  border: 2px solid var(--color-border) !important;
  border-radius: var(--radius-sm) !important;
  font-family: var(--font-body) !important;
  color: var(--color-text) !important;
  box-shadow: var(--pixel-shadow) !important;
  padding: 12px 16px !important;
}

.mapboxgl-popup-tip,
.leaflet-popup-tip {
  border-top-color: var(--color-border) !important;
  background: var(--color-bg-card) !important;
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

/* Leaflet zoom controls styled with pixel theme */
.leaflet-control-zoom {
  border: 2px solid var(--color-border) !important;
  box-shadow: var(--pixel-shadow) !important;
  border-radius: var(--radius-sm) !important;
  overflow: hidden;

  a {
    background: var(--color-bg-card) !important;
    color: var(--color-text) !important;
    font-family: var(--font-readable) !important;
    font-weight: 800 !important;
    border-bottom: 1px solid var(--color-border) !important;

    &:hover {
      background: var(--color-bg-hover) !important;
    }
  }
}
</style>
