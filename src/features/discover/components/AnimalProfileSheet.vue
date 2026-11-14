<script setup lang="ts">
import { computed, watch, onUnmounted, ref } from 'vue'
import type { Animal } from '@/domain/animal'
import { buildAnimalNarrationText } from '@/domain/buildAnimalNarrationText'
import { useNarrationAudio } from '@/composables/useNarrationAudio'
import { STATUS_COLORS, HABITAT_LABELS, CATEGORY_LABELS } from '@/app/config'
import PixelButton from '@/components/ui/PixelButton.vue'
import PixelStatusBadge from '@/components/ui/PixelStatusBadge.vue'
import NarrationPlayer from '@/components/ui/NarrationPlayer.vue'
import ReadAlongText from '@/components/ui/ReadAlongText.vue'
import { useProgressStore } from '@/stores/progressStore'
import { useDrawingStore } from '@/stores/drawingStore'
import { useRouter } from 'vue-router'
import DiscoverAnimalIcon from '@/components/ui/DiscoverAnimalIcon.vue'
import { resolveAnimalPhoto } from '@/domain/mediaUrl'
import CitedImage from '@/components/ui/CitedImage.vue'
import DiscoverStatIcon from '@/components/ui/DiscoverStatIcon.vue'
import { getDiscoverStatIcon } from '@/app/discoverStatIconRegistry'
import AnimalFunFactsPanel from './AnimalFunFactsPanel.vue'
import AnimalDrawingCanvas from './AnimalDrawingCanvas.vue'
import { resolveDemoFunFactUnlockAnimal } from '@/domain/demoFunFactUnlocks'

const props = defineProps<{
  animal: Animal | null
}>()

const emit = defineEmits<{
  'close': []
  'view-on-map': []
}>()

const progressStore = useProgressStore()
const drawingStore = useDrawingStore()
const router = useRouter()
// Reset drawing view when animal changes
watch(
  () => props.animal?.id,
  () => { drawingStore.reset() },
)

watch(
  () => drawingStore.isActive,
  () => { window.scrollTo({ top: 0 }) },
)

// ── Audio ────────────────────────────────────────────────────────────────────
// Pass a computed ref — useAudio watches it and rebuilds automatically
// when the animal changes (fixes the reactivity bug from the previous version).
const audioText = computed(() =>
  props.animal ? buildAnimalNarrationText(props.animal) : '',
)

const {
  isPlaying,
  currentTimeMs,
  durationMs,
  highlightedWordIndex,
  words,
  isAvailable,
  isLoading,
  errorMessage,
  play,
  pause,
  seek,
  destroy,
} = useNarrationAudio(audioText)

// Duck background music while narration plays — handled inside useNarrationAudio
onUnmounted(() => {
  destroy()
})

// Record animal visit progress when a new animal is shown.
// `immediate: true` ensures the visit is recorded when the sheet first opens,
// not only when switching between animals (the component always mounts with
// store.selectedAnimal already set, so the watcher would otherwise miss the first view).
watch(
  () => props.animal?.id,
  (id) => {
    if (id && props.animal) {
      progressStore.recordAnimalVisit(id, props.animal.commonName)
    }
  },
  { immediate: true },
)

// ── Derived ──────────────────────────────────────────────────────────────────
const statusColor = computed(
  () => (props.animal ? (STATUS_COLORS[props.animal.conservationStatus] ?? '#888') : '#888'),
)

const habitatLabel = computed(() =>
  props.animal
    ? (props.animal.habitatDisplay ?? HABITAT_LABELS[props.animal.habitat] ?? props.animal.habitat)
    : '',
)

const categoryLabel = computed(
  () => (props.animal ? (CATEGORY_LABELS[props.animal.category] ?? props.animal.category) : ''),
)

const hasSafeStatus = computed(
  () => props.animal?.conservationStatus === 'least_concern' || props.animal?.conservationStatus === 'near_threatened',
)

// ── Hero photo vs spirit (strictly pair caption to actual wildlife photo; never on spirit fallback) ──
const failedPhotoUrls = ref<Set<string>>(new Set())

watch(
  () => props.animal?.id,
  () => {
    failedPhotoUrls.value = new Set()
  },
)

const resolvedPhoto = computed(() => resolveAnimalPhoto(props.animal, failedPhotoUrls.value))

/** URL for wildlife photograph, or null when only the spirit hero should render. */
const wildlifePhotoSrc = computed(() => resolvedPhoto.value.src)

const wildlifePhotoAttribution = computed(() => resolvedPhoto.value.attribution)

function onWildlifePhotoError() {
  const currentSrc = resolvedPhoto.value.src
  if (!currentSrc || failedPhotoUrls.value.has(currentSrc)) return
  const next = new Set(failedPhotoUrls.value)
  next.add(currentSrc)
  failedPhotoUrls.value = next
}

// ── Stat icons (from centralized registry) ────────────────────────────────────
const groupIcon     = computed(() => props.animal ? getDiscoverStatIcon('group',    props.animal) : null)
const habitatIcon   = computed(() => props.animal ? getDiscoverStatIcon('habitat',  props.animal) : null)
const dietIcon      = computed(() => props.animal ? getDiscoverStatIcon('diet',     props.animal) : null)
const lifespanIcon  = computed(() => props.animal ? getDiscoverStatIcon('lifespan', props.animal) : null)

// ── Actions ───────────────────────────────────────────────────────────────────
function close() {
  emit('close')
}

function goToQuiz() {
  if (!props.animal) return
  close()
  const isDemoAnimal = resolveDemoFunFactUnlockAnimal({
    animalVisualKey: props.animal.visualKey,
    animalId: props.animal.id,
    animalName: props.animal.commonName,
    scientificName: props.animal.scientificName,
  }) !== null

  router.push({
    path: '/quiz',
    query: {
      animal: props.animal.id,
      animalName: props.animal.commonName,
      animalSci: props.animal.scientificName,
      animalVisualKey: props.animal.visualKey ?? '',
      ...(isDemoAnimal ? { unlockFacts: '1' } : {}),
    },
  })
}
</script>

<template>
  <div v-if="animal" class="profile">
    <!-- ── Drawing View ──────────────────────────────────────────────── -->
    <AnimalDrawingCanvas v-if="drawingStore.isActive" />

    <!-- ── Info View ─────────────────────────────────────────────────── -->
    <div v-if="!drawingStore.isActive" class="profile__layout">
      
      <!-- Toolbar -->
      <div class="profile__toolbar">
        <PixelButton variant="gray" size="sm" class="profile__back-btn" @click="close">⬅ Back</PixelButton>
        <div class="profile__toolbar-actions">
          <PixelButton variant="green" size="sm" @click="drawingStore.open()">✏️ Sketch</PixelButton>
          <PixelButton variant="orange" size="sm" @click="$emit('view-on-map')">🗺️ Map</PixelButton>
          <PixelButton variant="blue" size="sm" @click="goToQuiz">🎮 Take Quiz</PixelButton>
        </div>
      </div>

      <!-- Hero Card -->
      <div class="profile__hero-card">
        <div class="profile__media-column">
          <div class="profile__photo-frame">
            <CitedImage
              v-if="wildlifePhotoSrc"
              class="profile__photo"
              data-testid="animal-profile-wildlife"
              :src="wildlifePhotoSrc"
              :alt="`Photo of ${animal.commonName}`"
              :attribution="wildlifePhotoAttribution"
              object-fit="cover"
              loading="eager"
              attribution-align="center"
              attribution-entity="discover-detail"
              @error="onWildlifePhotoError"
            />
            <div v-else class="profile__spirit-hero profile__spirit-hero--large">
              <DiscoverAnimalIcon
                :visual-key="animal.visualKey"
                :common-name="animal.commonName"
                :fallback-emoji="animal.iconEmoji"
                size="112px"
                :alt="`${animal.commonName} spirit icon`"
              />
            </div>
            <!-- BioWira spirit badge -->
            <div class="profile__spirit-badge" aria-hidden="true">
              <DiscoverAnimalIcon
                :visual-key="animal.visualKey"
                :common-name="animal.commonName"
                :fallback-emoji="animal.iconEmoji"
                size="40px"
                :alt="`${animal.commonName} spirit icon`"
              />
            </div>
          </div>
        </div>

        <div class="profile__summary-column">
          <div class="profile__identity">
            <p class="profile__subtitle">Animal Profile</p>
            <h2 class="profile__name">{{ animal.commonName }}</h2>
            <p class="profile__sci">{{ animal.scientificName }}</p>
            <div class="profile__status-wrap">
              <PixelStatusBadge
                :status="animal.conservationStatus"
                :label-override="animal.conservationStatusLabel"
                size="md"
              />
            </div>
          </div>

          <div class="profile__stats-grid" role="list" aria-label="Animal stats">
            <div class="profile__stat" role="listitem">
              <DiscoverStatIcon
                v-if="groupIcon"
                :src="groupIcon.src"
                :fallback-text="groupIcon.fallbackText"
                :label="groupIcon.label"
                size="32px"
                class="profile__stat-icon"
              />
              <span class="profile__stat-label">Group</span>
              <span class="profile__stat-value">{{ categoryLabel }}</span>
            </div>
            <div class="profile__stat" role="listitem">
              <DiscoverStatIcon
                v-if="habitatIcon"
                :src="habitatIcon.src"
                :fallback-text="habitatIcon.fallbackText"
                :label="habitatIcon.label"
                size="32px"
                class="profile__stat-icon"
              />
              <span class="profile__stat-label">Habitat</span>
              <span class="profile__stat-value">{{ habitatLabel }}</span>
            </div>
            <div class="profile__stat" role="listitem">
              <DiscoverStatIcon
                v-if="dietIcon"
                :src="dietIcon.src"
                :fallback-text="dietIcon.fallbackText"
                :label="dietIcon.label"
                size="32px"
                class="profile__stat-icon"
              />
              <span class="profile__stat-label">Diet</span>
              <span class="profile__stat-value">{{ animal.diet }}</span>
            </div>
            <div class="profile__stat" role="listitem">
              <DiscoverStatIcon
                v-if="lifespanIcon"
                :src="lifespanIcon.src"
                :fallback-text="lifespanIcon.fallbackText"
                :label="lifespanIcon.label"
                size="32px"
                class="profile__stat-icon"
              />
              <span class="profile__stat-label">Lifespan</span>
              <span class="profile__stat-value">{{ animal.lifespan }}</span>
            </div>
          </div>

          <!-- Why it matters -->
          <div
            v-if="animal.conservationExplanation"
            class="profile__conservation-card"
            :class="{ 'profile__conservation-card--safe': hasSafeStatus }"
            :style="{ borderColor: hasSafeStatus ? 'var(--status-living)' : statusColor }"
            role="note"
            :aria-label="`Conservation status: ${animal.conservationStatus}`"
          >
            <h3 class="profile__section-title profile__section-title--small">
              <span v-if="!hasSafeStatus" aria-hidden="true">⚠️</span> Why it matters
            </h3>
            <p class="profile__conservation-text">{{ animal.conservationExplanation }}</p>
          </div>
        </div>
      </div>

      <!-- Listen & Learn (Full width) -->
      <div class="profile__listen-card">
        <h3 class="profile__section-title">🔊 Listen & Learn</h3>
        <NarrationPlayer
          :is-playing="isPlaying"
          :current-time-ms="currentTimeMs"
          :duration-ms="durationMs"
          :is-available="isAvailable"
          :is-loading="isLoading"
          :error-message="errorMessage"
          class="profile__narration"
          @play="play"
          @pause="pause"
          @seek="seek"
        />
        <ReadAlongText
          :words="words"
          :highlighted-index="highlightedWordIndex"
          size="md"
          class="profile__read-along"
        />
      </div>

      <!-- Fun Facts (Full width) -->
      <div class="profile__full-width-facts">
        <AnimalFunFactsPanel :animal="animal" />
      </div>

    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.profile {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  &__layout {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  // ── Toolbar ───────────────────────────────────────────────────────────────
  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-3);
    padding-bottom: var(--space-2);

    @media (max-width: 600px) {
      flex-direction: column;
      align-items: stretch;
    }
  }

  &__toolbar-actions {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;

    @media (max-width: 600px) {
      > * {
        flex: 1;
      }
    }
  }

  // ── Hero Card ─────────────────────────────────────────────────────────────
  &__hero-card {
    display: grid;
    gap: var(--space-4);
    padding: var(--space-4);
    background: var(--color-bg);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-lg);

    @media (min-width: $bp-md) {
      grid-template-columns: minmax(0, 380px) 1fr;
      align-items: stretch;
    }
  }

  &__media-column {
    width: 100%;
    height: 100%;
  }

  &__photo-frame {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: var(--radius-lg);
    overflow: visible;

    :deep(.cited-image) {
      height: 100%;
    }

    :deep(.cited-image__media) {
      flex: 1 1 auto;
      min-height: 200px;
      object-fit: cover;
    }
  }

  &__spirit-hero {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    height: 100%;
    background: var(--color-bg-card);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-lg);

    &--large {
      padding: var(--space-8);
    }
  }

  &__spirit-badge {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg);
    border: 3px solid var(--color-secondary);
    border-radius: var(--radius-md);
    box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.12);
    z-index: 2;
  }

  &__summary-column {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  &__identity {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  &__subtitle {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-muted);
    margin: 0 0 2px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__name {
    font-family: var(--font-readable);
    font-size: clamp(24px, 4vw, 32px);
    font-weight: 800;
    color: var(--color-text);
    margin: 0 0 4px 0;
    line-height: 1.2;
  }

  &__sci {
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-style: italic;
    color: var(--color-text-muted);
    margin: 0 0 var(--space-3) 0;
  }

  &__status-wrap {
    display: inline-block;
  }

  // ── Stats Grid ────────────────────────────────────────────────────────────
  &__stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-2);
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    background: var(--color-bg-card);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    position: relative;
    padding-left: calc(32px + var(--space-3) + var(--space-2));
    min-height: 60px;
  }

  &__stat-icon {
    position: absolute;
    left: var(--space-2);
    top: 50%;
    transform: translateY(-50%);
  }

  &__stat-label {
    font-family: var(--font-readable);
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
  }

  &__stat-value {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.2;
  }

  // ── Listen & Learn ────────────────────────────────────────────────────────
  &__listen-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    background: var(--color-bg);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }

  &__section-title {
    font-family: var(--font-readable);
    font-size: var(--text-lg);
    font-weight: 800;
    color: var(--color-text);
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--space-2);

    &--small {
      font-size: var(--text-md);
    }
  }

  &__read-along {
    background: var(--color-bg-card);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }

  &__conservation-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    border: 2px solid;
    border-radius: var(--radius-md);
    padding: var(--space-3);
    background: var(--color-bg);

    &--safe {
      background: rgba(76, 175, 80, 0.07);
    }
  }

  &__conservation-text {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
    line-height: 1.5;
  }

  &__facts-card {
    background: var(--color-bg);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }

  &__full-width-facts {
    background: var(--color-bg);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }
}
</style>
