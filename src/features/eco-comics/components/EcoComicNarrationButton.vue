<script setup lang="ts">
/**
 * EcoComicNarrationButton
 *
 * Child-friendly speaker control for the Eco-Comic reader.
 * Uses prepared MP3 clips from the story catalog when available; otherwise falls back
 * to `useNarrationAudio` (browser or backend TTS). No duplicated TTS implementation here.
 *
 * Props:
 *  - text: fallback narration string when no prepared audio exists (also used for accessibility).
 *  - audioSrcs: optional prepared MP3 URLs from `ecoComicAssetRegistry` (via panel data).
 *
 * Panel changes reset playback via composable watchers — no duplicate cleanup in the reader.
 * Audio is never auto-played; children must tap the speaker.
 */

import { computed, onUnmounted } from 'vue'
import { useNarrationAudio } from '@/composables/useNarrationAudio'
import { usePreparedNarrationAudio } from '@/composables/usePreparedNarrationAudio'

const props = defineProps<{
  /** Narration text for TTS fallback and screen-reader context. */
  text: string
  /** Prepared public MP3 sources; when non-empty, these replace dynamic TTS for this panel. */
  audioSrcs?: readonly string[]
}>()

const preparedSrcs = computed(() =>
  (props.audioSrcs ?? []).map((s) => s.trim()).filter((s) => s.length > 0),
)

const hasPreparedNarration = computed(() => preparedSrcs.value.length > 0)

const ttsTextSource = computed(() => (hasPreparedNarration.value ? '' : props.text))

const prepared = usePreparedNarrationAudio(() => preparedSrcs.value)
const ttsNarration = useNarrationAudio(ttsTextSource)

const canNarrate = computed(
  () => hasPreparedNarration.value || props.text.trim().length > 0,
)

const isPlaying = computed(() =>
  hasPreparedNarration.value ? prepared.isPlaying.value : ttsNarration.isPlaying.value,
)

const isLoading = computed(() =>
  hasPreparedNarration.value ? prepared.isLoading.value : ttsNarration.isLoading.value,
)

const errorMessage = computed(() =>
  hasPreparedNarration.value ? prepared.errorMessage.value : ttsNarration.errorMessage.value,
)

const ariaLabel = computed(() => {
  if (isLoading.value) return 'Narration is loading'
  if (isPlaying.value) return 'Pause narration'
  return 'Play narration'
})

async function toggle() {
  if (!canNarrate.value || isLoading.value) return

  if (hasPreparedNarration.value) {
    if (prepared.isPlaying.value) prepared.pause()
    else await prepared.play()
    return
  }

  if (ttsNarration.isPlaying.value) {
    ttsNarration.pause()
  } else {
    await ttsNarration.play()
  }
}

onUnmounted(() => {
  prepared.destroy()
  ttsNarration.destroy()
})
</script>

<template>
  <div class="narration-btn-wrap" data-testid="eco-comic-narration-btn-wrap">
    <!-- Error tooltip -->
    <p
      v-if="errorMessage"
      class="narration-btn__error"
      role="alert"
      aria-live="polite"
    >
      Narration is not ready yet. Please try again.
    </p>

    <button
      v-if="canNarrate"
      class="narration-btn"
      :class="{
        'narration-btn--playing': isPlaying,
        'narration-btn--loading': isLoading,
      }"
      :aria-label="ariaLabel"
      :disabled="isLoading"
      data-testid="eco-comic-narration-btn"
      data-sfx="none"
      type="button"
      @click="toggle"
    >
      <span aria-hidden="true" class="narration-btn__icon">
        <span v-if="isLoading">⏳</span>
        <span v-else-if="isPlaying">⏸</span>
        <span v-else>🔊</span>
      </span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.narration-btn-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
  /** ≥ `--eco-comic-overlay-btn-min-height` touch band while the circle matches overlay buttons visually */
  padding: max(
    var(--space-1),
    calc((var(--eco-comic-overlay-btn-min-height) - var(--eco-comic-narration-btn-size)) / 2)
  );
  box-sizing: border-box;
}

.narration-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--eco-comic-narration-btn-size);
  height: var(--eco-comic-narration-btn-size);
  border-radius: var(--radius-full);
  background: var(--btn-blue-bg);
  border: 2px solid var(--btn-blue-border);
  box-shadow: 0 2px 0 var(--btn-blue-border);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  flex-shrink: 0;

  min-width: var(--eco-comic-narration-btn-size);
  min-height: var(--eco-comic-narration-btn-size);

  &:hover:not(:disabled) {
    background: #1976D2;
    transform: translateY(-1px);
    box-shadow: 0 3px 0 var(--btn-blue-border);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  &--playing {
    background: #388E3C;
    border-color: #1B5E20;
    box-shadow: 0 2px 0 #1B5E20;

    &:hover:not(:disabled) {
      background: #2E7D32;
    }
  }

  &--loading {
    animation: narration-pulse 1s ease-in-out infinite;
  }

  &__icon {
    font-size: 15px;
    line-height: 1;
    user-select: none;
  }
}

.narration-btn__error {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 700;
  color: #B71C1C;
  text-align: center;
  max-width: 160px;
  margin: 0;
  line-height: 1.3;
}

@keyframes narration-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@media (prefers-reduced-motion: reduce) {
  .narration-btn--loading {
    animation: none;
  }
}
</style>
