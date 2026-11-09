<script setup lang="ts">
/**
 * AudioSettingsControl — compact music + SFX toggle panel.
 *
 * Designed to live as a flyout/popover from the TopNav (desktop) or
 * BottomNav (mobile). Shows:
 *   - Music On/Off toggle
 *   - SFX On/Off toggle
 *   - Music volume slider
 *   - SFX volume slider
 */
import { ref } from 'vue'
import { useAudioStore } from '@/stores/audioStore'
import { unlockAudio } from '@/services/appAudioService'

const audioStore = useAudioStore()
const open = ref(false)

function toggle() {
  // Unlock audio on first manual interaction with the control
  unlockAudio()
  open.value = !open.value
}

function close() {
  open.value = false
}

function handleMusicToggle() {
  unlockAudio()
  audioStore.toggleMusic()
}

function handleSfxToggle() {
  unlockAudio()
  audioStore.toggleSfx()
}

function handleMusicVolume(e: Event) {
  audioStore.setMusicVol(Number((e.target as HTMLInputElement).value) / 100)
}

function handleSfxVolume(e: Event) {
  audioStore.setSfxVol(Number((e.target as HTMLInputElement).value) / 100)
}
</script>

<template>
  <div class="audio-ctrl" @keydown.escape="close">
    <!-- Trigger button -->
    <button
      id="audio-settings-btn"
      type="button"
      class="audio-ctrl__btn"
      :aria-expanded="open"
      aria-controls="audio-settings-panel"
      :aria-label="open ? 'Close audio settings' : 'Open audio settings'"
      :title="open ? 'Close audio settings' : 'Audio settings'"
      data-sfx="none"
      @click="toggle"
    >
      <span class="audio-ctrl__icon" aria-hidden="true">
        {{ audioStore.musicEnabled || audioStore.sfxEnabled ? '🔊' : '🔇' }}
      </span>
    </button>

    <!-- Flyout panel -->
    <Transition name="audio-panel">
      <div
        v-if="open"
        id="audio-settings-panel"
        class="audio-ctrl__panel"
        role="dialog"
        aria-modal="false"
        aria-label="Audio settings"
      >
        <div class="audio-ctrl__panel-inner">
          <p class="audio-ctrl__heading">Sound Settings</p>

          <!-- Music row -->
          <div class="audio-ctrl__row">
            <button
              type="button"
              class="audio-ctrl__toggle"
              :class="{ 'audio-ctrl__toggle--on': audioStore.musicEnabled }"
              :aria-pressed="audioStore.musicEnabled"
              aria-label="Toggle background music"
              @click="handleMusicToggle"
            >
              {{ audioStore.musicEnabled ? '🎵' : '🔕' }}
            </button>
            <label class="audio-ctrl__label" for="music-vol">Music</label>
            <input
              id="music-vol"
              type="range"
              class="audio-ctrl__slider"
              min="0"
              max="100"
              step="5"
              :value="Math.round(audioStore.musicVolume * 100)"
              :disabled="!audioStore.musicEnabled"
              aria-label="Music volume"
              @input="handleMusicVolume"
            >
            <span class="audio-ctrl__pct" aria-hidden="true">
              {{ Math.round(audioStore.musicVolume * 100) }}%
            </span>
          </div>

          <!-- SFX row -->
          <div class="audio-ctrl__row">
            <button
              type="button"
              class="audio-ctrl__toggle"
              :class="{ 'audio-ctrl__toggle--on': audioStore.sfxEnabled }"
              :aria-pressed="audioStore.sfxEnabled"
              aria-label="Toggle sound effects"
              @click="handleSfxToggle"
            >
              {{ audioStore.sfxEnabled ? '🔔' : '🔕' }}
            </button>
            <label class="audio-ctrl__label" for="sfx-vol">SFX</label>
            <input
              id="sfx-vol"
              type="range"
              class="audio-ctrl__slider"
              min="0"
              max="100"
              step="5"
              :value="Math.round(audioStore.sfxVolume * 100)"
              :disabled="!audioStore.sfxEnabled"
              aria-label="Sound effects volume"
              @input="handleSfxVolume"
            >
            <span class="audio-ctrl__pct" aria-hidden="true">
              {{ Math.round(audioStore.sfxVolume * 100) }}%
            </span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Click-outside overlay to close panel -->
    <div
      v-if="open"
      class="audio-ctrl__backdrop"
      aria-hidden="true"
      @click="close"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.audio-ctrl {
  position: relative;
  display: flex;
  align-items: center;

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    border: 2px solid transparent;
    background: rgba(255, 255, 255, 0.08);
    cursor: pointer;
    transition: background var(--transition-fast), border-color var(--transition-fast);
    padding: 0;

    &:hover {
      background: rgba(255, 255, 255, 0.18);
      border-color: rgba(255, 255, 255, 0.25);
    }

    &:focus-visible {
      outline: 3px solid var(--color-secondary);
      outline-offset: 2px;
    }
  }

  &__icon {
    font-size: 18px;
    line-height: 1;
  }

  // ── Flyout panel ──────────────────────────────────────────────────────────

  &__panel {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: calc(var(--z-nav) + 10);
    min-width: 240px;
    background: var(--color-bg-nav);
    border: 3px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    overflow: hidden;

    @media (max-width: 767.98px) {
      // On mobile it opens upward from the bottom nav
      top: auto;
      bottom: calc(100% + 8px);
    }
  }

  &__panel-inner {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__heading {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 800;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 var(--space-1);
  }

  // ── Row (toggle + label + slider + pct) ───────────────────────────────────

  &__row {
    display: grid;
    grid-template-columns: 36px 44px 1fr 36px;
    align-items: center;
    gap: var(--space-2);
  }

  &__toggle {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    border: 2px solid rgba(255, 255, 255, 0.18);
    background: rgba(255, 255, 255, 0.06);
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--transition-fast), border-color var(--transition-fast);
    padding: 0;

    &--on {
      background: rgba(91, 138, 60, 0.25);
      border-color: var(--color-primary);
    }

    &:hover {
      background: rgba(255, 255, 255, 0.14);
    }

    &:focus-visible {
      outline: 3px solid var(--color-secondary);
      outline-offset: 2px;
    }
  }

  &__label {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 700;
    color: rgba(255, 255, 255, 0.85);
    white-space: nowrap;
  }

  &__slider {
    width: 100%;
    accent-color: var(--color-primary);
    cursor: pointer;
    height: 4px;

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  &__pct {
    font-family: var(--font-readable);
    font-size: 11px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.55);
    text-align: right;
    white-space: nowrap;
  }

  // ── Click-outside backdrop ────────────────────────────────────────────────

  &__backdrop {
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-nav) + 9);
  }
}

// ── Flyout transition ─────────────────────────────────────────────────────────

.audio-panel-enter-active,
.audio-panel-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.audio-panel-enter-from,
.audio-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);

  @media (max-width: 767.98px) {
    transform: translateY(6px) scale(0.97);
  }
}
</style>
