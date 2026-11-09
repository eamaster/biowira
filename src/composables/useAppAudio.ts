// ============================================================
// useAppAudio composable
//
// Thin Vue composable exposing the BioWira audio system to
// components.  Components call `sfx()` to trigger SFX and
// read `audioStore` refs for reactive UI.
//
// DO NOT rename this to `useAudio` — that name is already
// used for the narration / Web Speech API composable.
// ============================================================

import { useAudioStore } from '@/stores/audioStore'
import { playSfx, unlockAudio } from '@/services/appAudioService'
import type { BioWiraSfxKey } from '@/domain/appAudio'

export function useAppAudio() {
  const audioStore = useAudioStore()

  /**
   * Play a BioWira sound effect.
   * Also unlocks audio on first call (satisfies browser autoplay policy).
   */
  function sfx(key: BioWiraSfxKey): void {
    unlockAudio()
    playSfx(key)
  }

  /**
   * Call this from any user-interaction handler to unlock audio.
   * Safe to call multiple times — idempotent.
   */
  function ensureUnlocked(): void {
    unlockAudio()
  }

  return {
    audioStore,
    sfx,
    ensureUnlocked,
  }
}
