<script setup lang="ts">
/**
 * AppAudioController — renderless component mounted inside PixelAppShell.
 *
 * Responsibilities:
 *   1. Watches the current route's `audioTheme` meta and calls setMusicTheme().
 *   2. Listens for the first user interaction on the document and calls unlockAudio().
 *   3. After unlock, registers a delegated tap-SFX listener for interactive elements.
 *   4. Pauses music when the tab is hidden; resumes when visible.
 *   5. Exposes nothing to the template — purely a side-effect component.
 *
 * Global tap SFX rules:
 *   - Fires for: button, a, [role="button"], .pixel-button
 *   - Skipped for: disabled elements, range inputs, elements with data-sfx="none",
 *                  audio controls (data-audio-skip), and the audio settings panel itself.
 *   - Elements may override with data-sfx="tap" (explicit opt-in) or data-sfx="none" (opt-out).
 *   - Tap SFX has a 100ms cooldown (enforced in playSfx) to avoid spam on rapid clicks.
 */
import { watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { setMusicTheme, unlockAudio, pauseMusic, resumeMusic, playSfx } from '@/services/appAudioService'
import { useAudioStore } from '@/stores/audioStore'
import type { BioWiraMusicTheme } from '@/domain/appAudio'

const route = useRoute()
// Ensure the store (and its watchers) is initialised — this triggers the
// immediate watches that push stored preferences into appAudioService.
useAudioStore()

const DEFAULT_THEME: BioWiraMusicTheme = 'calm-jungle'

// ── Route theme watcher ───────────────────────────────────────────────────────

watch(
  () => route.meta.audioTheme as BioWiraMusicTheme | undefined,
  (theme) => {
    setMusicTheme(theme ?? DEFAULT_THEME)
  },
  { immediate: true },
)

// ── Interaction unlock ────────────────────────────────────────────────────────

let _audioUnlocked = false

function handleFirstInteraction() {
  if (_audioUnlocked) return
  _audioUnlocked = true
  unlockAudio()
  // After unlock, register delegated tap listener
  document.addEventListener('pointerup', handleGlobalTap, { capture: false, passive: true })
}

// ── Global delegated tap SFX ───────────────────────────────────────────────────
//
// Plays a soft tap sound when the user interacts with interactive elements.
// Skips: disabled elements, range inputs, audio controls (data-sfx="none"),
//        and elements inside .audio-ctrl panel (to avoid recursive SFX on settings).

const TAPPABLE_SELECTORS = [
  'button:not([disabled])',
  'a[href]',
  '[role="button"]:not([aria-disabled="true"])',
  '.pixel-button:not([disabled])',
]

function handleGlobalTap(e: Event) {
  const target = e.target as Element | null
  if (!target) return

  // Walk up the DOM to find a tappable element within 3 levels
  let el: Element | null = target
  for (let i = 0; i < 3; i++) {
    if (!el) break

    // Explicit opt-out
    if (el.getAttribute('data-sfx') === 'none') return
    // Skip audio settings panel (avoid recursive SFX)
    if (el.classList.contains('audio-ctrl') || el.closest('.audio-ctrl')) return
    // Skip range inputs
    if (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'range') return

    // Explicit opt-in
    if (el.getAttribute('data-sfx') === 'tap') {
      playSfx('tap')
      return
    }

    // Auto-detect tappable
    if (TAPPABLE_SELECTORS.some(sel => el!.matches(sel))) {
      playSfx('tap')
      return
    }

    el = el.parentElement
  }
}

// ── Tab visibility ─────────────────────────────────────────────────────────────

function handleVisibilityChange() {
  if (document.hidden) {
    pauseMusic()
  } else {
    resumeMusic()
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  // Use once:true — after first gesture, handleFirstInteraction registers its own listener
  document.addEventListener('pointerdown', handleFirstInteraction, { capture: true, once: true })
  document.addEventListener('keydown', handleFirstInteraction, { capture: true, once: true })
  document.addEventListener('touchstart', handleFirstInteraction, { capture: true, once: true })
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleFirstInteraction, { capture: true })
  document.removeEventListener('keydown', handleFirstInteraction, { capture: true })
  document.removeEventListener('touchstart', handleFirstInteraction, { capture: true })
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  document.removeEventListener('pointerup', handleGlobalTap, { capture: false })
})
</script>

<!-- eslint-disable vue/valid-template-root -->
<template>
  <!-- Renderless audio controller: manages music theme + global tap SFX. No DOM output. -->
</template>
