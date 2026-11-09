<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FunFact } from '@/domain/funFact'
import AnimalIcon from '@/components/ui/AnimalIcon.vue'
import CitedImage from '@/components/ui/CitedImage.vue'
import { resolveFunFactAccessState } from '@/domain/funFactAccess'
import { getFunFactThemeCssVars } from '@/features/fun-facts/utils/funFactTheme'
import { useAppAudio } from '@/composables/useAppAudio'

const props = withDefaults(defineProps<{
  fact: FunFact
  variant?: 'default' | 'compact-profile'
}>(), {
  variant: 'default'
})

const emit = defineEmits<{
  'open-fact': [fact: FunFact]
}>()

// ── Access state ─────────────────────────────────────────────────────────────

const accessState = computed(() => resolveFunFactAccessState(props.fact))

const isLocked = computed(() => {
  const s = accessState.value
  // In mock mode (status === 'unknown') fall back to always unlocked
  return s.status !== 'unknown' ? !s.isUnlocked : false
})

const levelsNeeded = computed(() => accessState.value.levelsNeeded)

// ── Theme system (shared with FunFactModal via funFactTheme.ts) ───────────────

const cardStyle = computed(() => {
  if (isLocked.value) return {}
  return getFunFactThemeCssVars(props.fact)
})

const { sfx } = useAppAudio()

// ── Flip behaviour ────────────────────────────────────────────────────────────

const isFlipped = ref(false)

function handleCardClick() {
  if (!isLocked.value) {
    sfx('card-flip')
  }
  isFlipped.value = !isFlipped.value
}

function handleKeydown(e: KeyboardEvent) {
  // Prevent flipping if interacting with an inner element like a button
  if (e.target !== e.currentTarget) return
  
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    handleCardClick()
  }
}

function handleOpenFact() {
  if (!isLocked.value) {
    sfx('tap')
    emit('open-fact', props.fact)
  }
}

// ── Image source — explicit state, no fragile string comparison ───────────────

type ImageSource = 'fact' | 'animal' | 'icon'

const factImageError = ref(false)
const animalImageError = ref(false)

// Reset error flags when the fact changes
watch(
  () => props.fact.id,
  () => {
    factImageError.value = false
    animalImageError.value = false
    isFlipped.value = false
  },
)

const resolvedBackImage = computed<{ src: string | null; source: ImageSource }>(() => {
  if (props.fact.imageUrl && !factImageError.value) return { src: props.fact.imageUrl, source: 'fact' }
  if (props.fact.animalImageUrl && !animalImageError.value) return { src: props.fact.animalImageUrl, source: 'animal' }
  return { src: null, source: 'icon' }
})

const resolvedBackCaption = computed(() => {
  if (!resolvedBackImage.value.src) return undefined
  if (resolvedBackImage.value.source === 'fact') return props.fact.imageAttribution
  return props.fact.animalImageAttribution
})

function onBackImageError() {
  if (resolvedBackImage.value.source === 'fact') factImageError.value = true
  else if (resolvedBackImage.value.source === 'animal') animalImageError.value = true
}

const showCitedRealBackImage = computed(
  () => !!(resolvedBackImage.value.src && resolvedBackCaption.value && !isLocked.value),
)
</script>

<template>
  <div
    class="flip-card-container"
    :class="[
      { 'is-locked-card': isLocked },
      variant === 'compact-profile' ? 'flip-card-container--compact-profile' : ''
    ]"
    :style="cardStyle"
    data-testid="fun-fact-card"
    data-sfx="none"
    role="button"
    tabindex="0"
    :aria-label="isLocked
      ? `Locked fun fact about ${fact.animalName}. Reach level ${fact.unlockLevel} to unlock.`
      : `Fun fact about ${fact.animalName}. Click to flip.`"
    @click="handleCardClick"
    @keydown="handleKeydown"
  >
    <div class="flip-card" :class="{ 'is-flipped': isFlipped }">

      <!-- ── FRONT FACE ──────────────────────────────────────────────────────── -->
      <div class="flip-card__face flip-card__face--front">

        <!-- Lock badge for locked facts -->
        <div v-if="isLocked" class="front-level-badge is-locked" aria-hidden="true">
          🔒 Lvl {{ fact.unlockLevel }}
        </div>
        <!-- Level badge for unlocked facts -->
        <div v-else class="front-level-badge">
          Lvl {{ fact.unlockLevel }}
        </div>

        <div class="front-content" :class="{ 'front-content--locked': isLocked }">
          <div class="card-icon">
            <AnimalIcon
              :icon-key="fact.animalVisualKey"
              :fallback-emoji="fact.animalEmoji"
              :size="variant === 'compact-profile' ? 'clamp(72px, 8vw, 104px)' : '72px'"
              :class="{ 'card-icon--locked': isLocked }"
            />
          </div>

          <div class="card-animal-name">{{ fact.animalName }}</div>

          <div class="front-emoji-badge" aria-hidden="true">
            {{ fact.animalEmoji }}
          </div>

          <div v-if="!isLocked" class="card-hint">Tap to discover!</div>
          <div v-else class="card-hint card-hint--locked">🔒 Unlock at Lvl {{ fact.unlockLevel }}</div>
        </div>
      </div>

      <!-- ── BACK FACE ───────────────────────────────────────────────────────── -->
      <div class="flip-card__face flip-card__face--back">
        <div class="back-content">

          <!-- Locked state -->
          <div v-if="isLocked" class="back-locked">
            <div class="back-locked__icon">🔒</div>
            <p class="back-locked__level">Level {{ fact.unlockLevel }}</p>
            <p class="back-locked__msg">
              Reach Level {{ fact.unlockLevel }} to unlock!
              <span v-if="levelsNeeded > 0"> ({{ levelsNeeded }} more level{{ levelsNeeded > 1 ? 's' : '' }} to go)</span>
            </p>
            <AnimalIcon
              :icon-key="fact.animalVisualKey"
              :fallback-emoji="fact.animalEmoji"
              size="40px"
              class="back-locked__animal"
            />
          </div>

          <!-- Unlocked: fact content -->
          <template v-else>
            <!-- Header row: emoji + animal name + level chip -->
            <div class="back-header">
              <span class="back-header__emoji" aria-hidden="true">{{ fact.animalEmoji }}</span>
              <span class="back-header__name">{{ fact.animalName }}</span>
              <span class="back-header__level">Lvl {{ fact.unlockLevel }}</span>
            </div>

            <!-- Fact image with fallback chain -->
            <div class="back-image-wrapper">
              <CitedImage
                v-if="showCitedRealBackImage"
                class="back-cited"
                :src="resolvedBackImage.src!"
                :alt="`Illustration for ${fact.animalName} fun fact`"
                :attribution="resolvedBackCaption"
                object-fit="cover"
                attribution-compact
                attribution-align="center"
                attribution-entity="fun-fact-card"
                @error="onBackImageError"
              />
              <AnimalIcon
                v-else
                :icon-key="fact.animalVisualKey"
                :fallback-emoji="fact.animalEmoji"
                size="52px"
              />
            </div>

            <!-- Preview text -->
            <p class="back-preview-text">Tap More Info to read the full fact!</p>

            <!-- Details button -->
            <div class="back-actions">
              <button class="details-btn" @click.stop="handleOpenFact">
                MORE INFO 💬
              </button>
            </div>
          </template>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

// ── Card container & 3D flip ──────────────────────────────────────────────────

.flip-card-container {
  perspective: 1000px;
  width: 100%;
  aspect-ratio: 3 / 4;
  cursor: pointer;
  outline: none;

  &:focus-visible .flip-card__face--front {
    box-shadow: 0 0 0 3px var(--color-secondary);
  }

  // Locked cards are slightly muted but still fully visible
  &.is-locked-card {
    .flip-card__face--front {
      background: var(--color-bg-card) !important;
      border-color: var(--color-border) !important;
      opacity: 0.72;
      filter: grayscale(35%);
    }
  }

  &--compact-profile {
    .front-content {
      padding: var(--space-2) var(--space-3);
    }
    
    .card-animal-name {
      display: none; // Prefer letting the icon be the focus if we already know the animal
    }

    // No need to show level number on each card inside the profile
    .front-level-badge,
    .back-header__level {
      display: none !important;
    }
  }
}

.flip-card {
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;

  &.is-flipped {
    transform: rotateY(180deg);
  }

  &__face {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    background: var(--fact-theme-bg, var(--color-bg-card));
    border: 3px solid var(--fact-theme-border, var(--color-border));
    border-radius: var(--radius-md);
    box-shadow: var(--pixel-shadow);
    overflow: hidden;

    &--back {
      transform: rotateY(180deg);
      background: var(--fact-theme-bg, var(--color-bg));
      color: var(--color-text);
      border-color: var(--fact-theme-border, var(--color-secondary));
      // Flex so inner column can shrink (min-height chain) — avoids MORE INFO clipping past the frame on narrow cards
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
  }
}

// ── Front ─────────────────────────────────────────────────────────────────────

.front-level-badge {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  z-index: 1;
  font-family: var(--font-readable);
  font-weight: 800;
  font-size: var(--text-xs);
  background: var(--fact-theme-accent, var(--color-secondary));
  color: var(--color-bg-dark);
  border-radius: var(--radius-full);
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);

  &.is-locked {
    background: var(--color-text-muted);
    color: var(--color-text-on-dark);
  }
}

.front-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--space-4);
  gap: var(--space-1);

  &--locked {
    opacity: 0.8;
  }
}

.card-icon {
  flex-shrink: 0;
}

.card-icon--locked {
  opacity: 0.55;
  filter: grayscale(60%);
}

.card-animal-name {
  font-family: var(--font-readable);
  font-weight: 800;
  font-size: var(--text-md);
  color: var(--color-text);
  text-align: center;
  line-height: 1.3;
}

.front-emoji-badge {
  font-size: 18px;
  line-height: 1;
  margin-top: var(--space-1);
}

.card-hint {
  font-family: var(--font-body);
  font-size: clamp(12px, 2vw, 14px);
  font-weight: 700;
  color: var(--color-text-muted);
  text-align: center;
  margin-top: var(--space-1);

  &--locked {
    color: var(--color-text-muted);
    opacity: 0.75;
  }
}

// ── Back ──────────────────────────────────────────────────────────────────────

.back-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  padding: var(--space-2) var(--space-3) var(--space-4);
  gap: var(--space-1);
}

// Header row
.back-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--color-border-light);
  margin-bottom: var(--space-2);
  flex-shrink: 0;

  &__emoji {
    font-size: 16px;
    line-height: 1;
    flex-shrink: 0;
  }

  &__name {
    font-family: var(--font-readable);
    font-weight: 800;
    font-size: var(--text-sm);
    color: var(--color-text);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.3;
  }

  &__level {
    font-family: var(--font-readable);
    font-weight: 800;
    font-size: var(--text-xs);
    background: var(--fact-theme-accent, var(--color-secondary));
    color: var(--color-bg-dark);
    padding: 3px 7px;
    border-radius: var(--radius-full);
    white-space: nowrap;
    flex-shrink: 0;
  }
}

// Image area — basis % gives height; flex-shrink lets it yield space on tight mobile cards (was 0 0 38% and overflowed)
.back-image-wrapper {
  flex: 0 1 34%;
  min-height: 0;
  max-height: 40%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--fact-theme-soft, var(--color-border-light));
  border: 2px solid var(--fact-theme-border, var(--color-border));
}

.back-cited {
  width: 100%;

  :deep(.cited-image__media) {
    width: 100%;
    min-height: 0;
    flex: 1;
  }

  :deep(.cited-image__img) {
    max-height: 140px;
  }
}

// Preview text — absorbs free space but can shrink so the actions row stays inside the frame
.back-preview-text {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  font-family: var(--font-body);
  font-size: clamp(12px, 2.5vw, 14px);
  font-weight: 800;
  color: var(--fact-theme-accent, var(--color-text-muted));
  line-height: 1.4;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 var(--space-2);
}

// Details button — padding reserves space for pixel shadow so it does not sit on the card border
.back-actions {
  flex-shrink: 0;
  margin-top: auto;
  padding-bottom: 4px;
}

.details-btn {
  font-family: var(--font-readable);
  font-weight: 800;
  font-size: var(--text-sm);
  background: var(--fact-theme-accent, var(--color-secondary));
  color: var(--color-bg-dark);
  border: 2px solid var(--fact-theme-border, var(--color-border));
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  cursor: pointer;
  min-height: 40px;
  width: 100%;
  box-sizing: border-box;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.15);
  transition: transform var(--transition-fast);

  &:hover { transform: translateY(-2px); }
  &:active { transform: translateY(1px); box-shadow: none; }
}

// ── Locked back state ─────────────────────────────────────────────────────────

.back-locked {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  gap: var(--space-2);
  text-align: center;
  padding: var(--space-4);

  &__icon {
    font-size: 32px;
  }

  &__level {
    font-family: var(--font-readable);
    font-weight: 800;
    font-size: var(--text-sm);
    color: var(--color-secondary);
    margin: 0;
    background: rgba(232, 160, 32, 0.15);
    border: 2px solid var(--color-secondary);
    border-radius: var(--radius-full);
    padding: 4px 12px;
  }

  &__msg {
    font-family: var(--font-body);
    font-size: clamp(12px, 2.5vw, 14px);
    font-weight: 700;
    color: var(--color-text-muted);
    margin: 0;
    line-height: 1.4;
  }

  &__animal {
    opacity: 0.45;
    margin-top: var(--space-1);
  }
}
</style>
