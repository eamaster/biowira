// ============================================================
// BioWira Audio Store (Pinia)
//
// Single reactive source of truth for audio preferences.
// Persists to localStorage via storageService.
// Syncs all changes into appAudioService so Vue state and
// the audio singleton always agree.
// ============================================================

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { BioWiraAudioPreferences } from '@/domain/appAudio'
import { DEFAULT_AUDIO_PREFS } from '@/domain/appAudio'
import { storageService } from '@/services/storageService'
import { STORAGE_KEYS } from '@/app/config'
import {
  setMusicEnabled,
  setSfxEnabled,
  setMusicVolume,
  setSfxVolume,
} from '@/services/appAudioService'

const AUDIO_PREFS_KEY = STORAGE_KEYS.audioPreferences

export const useAudioStore = defineStore('audio', () => {
  // ── Load persisted preferences ─────────────────────────────────────────────

  const stored = storageService.get<BioWiraAudioPreferences>(AUDIO_PREFS_KEY)
  const init: BioWiraAudioPreferences = stored
    ? {
        musicEnabled: stored.musicEnabled ?? DEFAULT_AUDIO_PREFS.musicEnabled,
        sfxEnabled: stored.sfxEnabled ?? DEFAULT_AUDIO_PREFS.sfxEnabled,
        musicVolume: stored.musicVolume ?? DEFAULT_AUDIO_PREFS.musicVolume,
        sfxVolume: stored.sfxVolume ?? DEFAULT_AUDIO_PREFS.sfxVolume,
      }
    : { ...DEFAULT_AUDIO_PREFS }

  // ── Reactive state ─────────────────────────────────────────────────────────

  const musicEnabled = ref(init.musicEnabled)
  const sfxEnabled = ref(init.sfxEnabled)
  const musicVolume = ref(init.musicVolume)
  const sfxVolume = ref(init.sfxVolume)

  // ── Sync reactive state → audio service ───────────────────────────────────
  // Runs immediately so the service matches stored prefs on startup.

  watch(musicEnabled, (v) => {
    setMusicEnabled(v)
    _persist()
  }, { immediate: true })

  watch(sfxEnabled, (v) => {
    setSfxEnabled(v)
    _persist()
  }, { immediate: true })

  watch(musicVolume, (v) => {
    setMusicVolume(v)
    _persist()
  }, { immediate: true })

  watch(sfxVolume, (v) => {
    setSfxVolume(v)
    _persist()
  }, { immediate: true })

  // ── Persistence ────────────────────────────────────────────────────────────

  function _persist(): void {
    storageService.set<BioWiraAudioPreferences>(AUDIO_PREFS_KEY, {
      musicEnabled: musicEnabled.value,
      sfxEnabled: sfxEnabled.value,
      musicVolume: musicVolume.value,
      sfxVolume: sfxVolume.value,
    })
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  function toggleMusic(): void {
    musicEnabled.value = !musicEnabled.value
  }

  function toggleSfx(): void {
    sfxEnabled.value = !sfxEnabled.value
  }

  function setMusicVol(vol: number): void {
    musicVolume.value = Math.max(0, Math.min(1, vol))
  }

  function setSfxVol(vol: number): void {
    sfxVolume.value = Math.max(0, Math.min(1, vol))
  }

  return {
    musicEnabled,
    sfxEnabled,
    musicVolume,
    sfxVolume,
    toggleMusic,
    toggleSfx,
    setMusicVol,
    setSfxVol,
  }
})
