<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isPlaying: boolean
  currentTimeMs: number
  durationMs: number
  isAvailable?: boolean
  isLoading?: boolean
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  play: []
  pause: []
  seek: [ms: number]
}>()

const progressPercent = computed(() =>
  props.durationMs > 0 ? Math.min(100, (props.currentTimeMs / props.durationMs) * 100) : 0,
)

const isDisabled = computed(() => props.isLoading === true || props.isAvailable === false)

function formatSeconds(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${s}s`
}

function onRangeInput(e: Event) {
  const pct = Number((e.target as HTMLInputElement).value)
  emit('seek', (pct / 100) * props.durationMs)
}

function toggle() {
  if (isDisabled.value) return
  if (props.isPlaying) emit('pause')
  else emit('play')
}
</script>

<template>
  <div class="narration-player" aria-label="Audio narration player">

    <div v-if="isAvailable === false" class="narration-player__unavailable" role="status">
      Audio not available in this browser
    </div>

    <div v-else class="narration-player__controls">
      <button
        class="narration-player__play-btn"
        :aria-label="isPlaying ? 'Pause narration' : 'Play narration'"
        :disabled="isDisabled"
        :class="{ 'narration-player__play-btn--disabled': isDisabled }"
        @click="toggle"
      >
        <span aria-hidden="true">{{ isLoading ? '⏳' : isPlaying ? '⏸' : '▶' }}</span>
      </button>

      <div class="narration-player__track">
        <span class="narration-player__time" aria-label="Current time">
          {{ formatSeconds(currentTimeMs) }}
        </span>
        <div class="narration-player__bar-wrap">
          <input
            type="range"
            :value="progressPercent"
            min="0"
            max="100"
            step="1"
            class="narration-player__slider"
            aria-label="Seek narration"
            @input="onRangeInput"
          >
          <div
            class="narration-player__fill"
            :style="{ width: `${progressPercent}%` }"
            aria-hidden="true"
          ></div>
        </div>
        <span class="narration-player__duration" aria-label="Total duration">
          {{ formatSeconds(durationMs) }}
        </span>
      </div>
    </div>

    <div v-if="isLoading" class="narration-player__status" role="status" aria-live="polite">
      Preparing narration...
    </div>

    <div v-if="errorMessage" class="narration-player__error" role="alert">
      {{ errorMessage }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.narration-player {
  background: var(--color-bg);
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: var(--space-4);

  &__unavailable {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    font-style: italic;
    padding: var(--space-2);
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  &__play-btn {
    font-size: 24px;
    width: 52px;
    height: 52px;
    min-width: 52px; // large tap target
    border-radius: 50%;
    border: 3px solid var(--color-primary);
    background: var(--color-primary);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform var(--transition-fast), background var(--transition-fast);

    &:hover { background: var(--color-primary-light); }
    &:active { transform: scale(0.9); }
    &:focus-visible {
      outline: 3px solid var(--color-secondary);
      outline-offset: 2px;
    }

    &--disabled,
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      &:hover { background: var(--color-primary); }
      &:active { transform: none; }
    }
  }

  &__status {
    margin-top: var(--space-2);
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    font-style: italic;
  }

  &__error {
    margin-top: var(--space-2);
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    color: var(--status-critically-endangered, #e53935);
  }

  &__track {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  &__bar-wrap {
    flex: 1;
    position: relative;
    height: 8px;
    min-width: 0;
  }

  &__slider {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 2;
    // Larger tap target via padding (doesn't affect layout)
    padding: 12px 0;
    margin: -12px 0;
    box-sizing: content-box;
  }

  &__fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--radius-full);
    pointer-events: none;
    transition: width 0.1s linear;
    min-width: 6px;
  }

  // visible track
  &__bar-wrap::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--color-border-light);
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
  }

  &__time,
  &__duration {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }
}
</style>
