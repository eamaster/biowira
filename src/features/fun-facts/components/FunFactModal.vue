<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { FunFact } from '@/domain/funFact'
import AnimalIcon from '@/components/ui/AnimalIcon.vue'
import CitedImage from '@/components/ui/CitedImage.vue'
import { getFunFactThemeCssVars } from '@/features/fun-facts/utils/funFactTheme'

const props = defineProps<{
  fact: FunFact | null
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// ── Close handlers ─────────────────────────────────────────────────────────────

function close() {
  emit('update:modelValue', false)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

// Lock / unlock body scroll when sheet is open
watch(
  () => props.modelValue,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  },
)

// ── Image source — explicit state tracking ─────────────────────────────────────
// Priority: fact.imageUrl (factImageUrl from API) → fact.animalImageUrl → AnimalIcon

type ImageSource = 'fact' | 'animal' | 'icon'

const factImageFailed = ref(false)
const animalImageFailed = ref(false)

// Reset when a different fact is opened
watch(
  () => props.fact?.id,
  () => {
    factImageFailed.value = false
    animalImageFailed.value = false
  },
)

const resolvedImage = computed<{ src: string | null; source: ImageSource }>(() => {
  const f = props.fact
  if (!f) return { src: null, source: 'icon' }
  if (f.imageUrl && !factImageFailed.value) return { src: f.imageUrl, source: 'fact' }
  if (f.animalImageUrl && !animalImageFailed.value) return { src: f.animalImageUrl, source: 'animal' }
  return { src: null, source: 'icon' }
})

function onImageError() {
  if (resolvedImage.value.source === 'fact') factImageFailed.value = true
  else if (resolvedImage.value.source === 'animal') animalImageFailed.value = true
}

const resolvedCaption = computed(() => {
  const f = props.fact
  if (!f || !resolvedImage.value.src) return undefined
  if (resolvedImage.value.source === 'fact') return f.imageAttribution
  return f.animalImageAttribution
})

const showCitedImage = computed(
  () => !!(props.modelValue && props.fact && resolvedImage.value.src && resolvedCaption.value),
)

// Theme vars on the sheet root (Teleport — variables must live on the modal card, not parent)
const sheetThemeStyle = computed(() =>
  props.fact ? getFunFactThemeCssVars(props.fact) : {},
)
</script>

<template>
  <Teleport to="body">
    <Transition name="fact-overlay">
      <div
        v-if="modelValue && fact"
        class="fact-overlay"
        role="presentation"
        @click.self="close"
      >
        <Transition name="fact-sheet">
          <div
            v-if="modelValue && fact"
            class="fact-sheet"
            :style="sheetThemeStyle"
            role="dialog"
            aria-modal="true"
            :aria-label="`Fun fact about ${fact.animalName}`"
            data-testid="fun-fact-modal"
          >
            <!-- Close button — large tap target -->
            <button class="fact-sheet__close" aria-label="Close" @click="close">✕</button>

            <!-- Image area — cited wildlife illustration when attribution exists -->
            <div class="fact-sheet__image-wrap">
              <CitedImage
                v-if="showCitedImage"
                class="fact-sheet__cited"
                :src="resolvedImage.src!"
                :alt="`Illustration for ${fact.animalName} fun fact`"
                :attribution="resolvedCaption"
                object-fit="contain"
                loading="eager"
                attribution-entity="fun-fact-modal"
                @error="onImageError"
              />
              <div v-else class="fact-sheet__image-fallback">
                <AnimalIcon
                  :icon-key="fact.animalVisualKey"
                  :fallback-emoji="fact.animalEmoji"
                  size="80px"
                />
              </div>
            </div>

            <!-- Animal identity row -->
            <div class="fact-sheet__identity">
              <span class="fact-sheet__emoji" aria-hidden="true">{{ fact.animalEmoji }}</span>
              <span class="fact-sheet__animal-name">{{ fact.animalName }}</span>
              <span class="fact-sheet__level">Lvl {{ fact.unlockLevel }}</span>
            </div>

            <!-- Optional title (mock data only) -->
            <h2 v-if="fact.title" class="fact-sheet__title">{{ fact.title }}</h2>

            <!-- Fact body -->
            <p class="fact-sheet__text">{{ fact.factText }}</p>

            <!-- Footer -->
            <p class="fact-sheet__footer" role="note">
              🌿 Keep exploring to unlock more fun facts!
            </p>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

// ── Overlay (backdrop) ────────────────────────────────────────────────────────

.fact-overlay {
  position: fixed;
  inset: 0;
  // Reserve space for the fixed bottom nav on mobile so the sheet isn't hidden behind it
  padding-bottom: var(--nav-height-bottom);
  background: rgba(0, 0, 0, 0.6);
  z-index: var(--z-modal);
  display: flex;
  // Mobile-first: push sheet to top of reserved space (above the nav)
  align-items: flex-end;
  justify-content: center;

  @media (min-width: $bp-sm) {
    // Larger screens: no bottom nav overlay, centre the dialog
    padding-bottom: 0;
    align-items: center;
  }

  // Match PixelAppShell: top nav only from $bp-md — keep backdrop + dialog below it so nothing overlaps the bar
  @media (min-width: $bp-md) {
    top: var(--nav-height-top);
  }
}

// Backdrop fade
.fact-overlay-enter-active,
.fact-overlay-leave-active {
  transition: opacity 0.2s ease;
}
.fact-overlay-enter-from,
.fact-overlay-leave-to {
  opacity: 0;
}

// ── Sheet / dialog ────────────────────────────────────────────────────────────

.fact-sheet {
  position: relative;
  background: var(--fact-theme-bg, var(--color-bg-card));
  border: 3px solid var(--fact-theme-border, var(--color-border));
  width: 100%;
  // Leave room for bottom nav — use calc so sheet stops just above the nav
  max-height: calc(90dvh - var(--nav-height-bottom));
  overflow-y: auto;
  // Tighter padding and gap on mobile so all content fits in view
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  // Mobile: bottom sheet with rounded top corners
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  border-bottom: none;

  @media (min-width: $bp-sm) {
    // Desktop: centred dialog with full border radius
    max-width: 520px;
    border-radius: var(--radius-xl);
    border-bottom: 3px solid var(--fact-theme-border, var(--color-border));
    max-height: 85dvh;
    padding: var(--space-5);
    gap: var(--space-4);
  }

  // Overlay top inset matches top nav from this breakpoint — tighten max height to the usable region
  @media (min-width: $bp-md) {
    max-height: min(85dvh, calc(100dvh - var(--nav-height-top) - var(--space-6)));
  }
}

// Sheet slide-up animation (works for both mobile and desktop)
.fact-sheet-enter-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
}
.fact-sheet-leave-active {
  transition: transform 0.25s ease, opacity 0.2s ease;
}
.fact-sheet-enter-from,
.fact-sheet-leave-to {
  transform: translateY(48px);
  opacity: 0;
}

// ── Close button ──────────────────────────────────────────────────────────────

.fact-sheet__close {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  background: var(--fact-theme-soft, var(--color-border-light));
  border: 2px solid var(--fact-theme-border, var(--color-border));
  border-radius: var(--radius-sm);
  font-size: 16px;
  color: var(--color-text);
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast), border-color var(--transition-fast);
  z-index: 1;

  &:hover {
    background: var(--fact-theme-bg, var(--color-border));
    border-color: var(--fact-theme-accent, var(--color-border));
  }
  &:focus-visible {
    outline: 3px solid var(--fact-theme-accent, var(--color-secondary));
    outline-offset: 2px;
  }
}

// ── Image ─────────────────────────────────────────────────────────────────────

.fact-sheet__image-wrap {
  width: 100%;
  max-height: min(42vh, 280px);
  min-height: 100px;
  border-radius: var(--radius-md);
  border: 3px solid var(--fact-theme-border, var(--color-border));
  overflow: hidden;
  background: var(--fact-theme-soft, var(--color-border-light));
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2);
  box-sizing: border-box;
}

.fact-sheet__cited {
  width: 100%;

  :deep(.cited-image__img) {
    max-height: min(40vh, 260px);
  }
}

.fact-sheet__image-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

// ── Identity row ──────────────────────────────────────────────────────────────

.fact-sheet__identity {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.fact-sheet__emoji {
  font-size: 26px;
  line-height: 1;
  flex-shrink: 0;
}

.fact-sheet__animal-name {
  font-family: var(--font-readable);
  font-size: var(--text-base);
  font-weight: 800;
  color: var(--fact-theme-accent, var(--color-secondary));
  flex: 1;
  line-height: 1.4;
}

.fact-sheet__level {
  font-family: var(--font-readable);
  font-size: var(--text-sm);
  font-weight: 800;
  background: var(--fact-theme-accent, var(--color-secondary));
  color: var(--color-bg-dark);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  white-space: nowrap;
  flex-shrink: 0;
}

// ── Text content ──────────────────────────────────────────────────────────────

.fact-sheet__title {
  font-family: var(--font-readable);
  font-size: clamp(18px, 3vw, 24px);
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.6;
  margin: 0;
}

.fact-sheet__text {
  font-family: var(--font-body);
  // 22px per AC 2.2 — readable for age 6–13 on desktop; scales down on small cards
  font-size: clamp(16px, 4vw, 22px);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.5;
  margin: 0;
}

.fact-sheet__footer {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0;
  padding-top: var(--space-2);
  border-top: 2px solid var(--color-border-light);
}
</style>
