// ============================================================
// BioWira App Audio Domain
// Centralised type definitions for the BioWira audio system.
// DO NOT confuse with narration / TTS — those live in
// useAudio.ts and useNarrationAudio.ts.
// ============================================================

/**
 * Background music themes available in BioWira.
 * - 'calm-jungle'      → soft ambient jungle music (all pages except Explorer gameplay)
 * - 'adventure-jungle' → upbeat jungle adventure track for Explorer Rescue Run gameplay
 * - 'none'             → silence (reserved; no route currently uses this)
 */
export type BioWiraMusicTheme = 'none' | 'calm-jungle' | 'adventure-jungle'

/**
 * Short sound-effect keys triggered by user interactions and game events.
 */
export type BioWiraSfxKey =
  | 'tap'
  | 'answer-correct'
  | 'answer-wrong'
  | 'achievement'
  | 'card-flip'
  | 'leaf-collect'
  | 'jump'
  | 'journal-flip'

/**
 * Persistent audio preferences saved to localStorage.
 */
export interface BioWiraAudioPreferences {
  musicEnabled: boolean
  sfxEnabled: boolean
  /** 0.0 – 1.0 */
  musicVolume: number
  /** 0.0 – 1.0 */
  sfxVolume: number
}

/**
 * Describes an audio asset managed by the service.
 */
export interface BioWiraAudioAsset {
  /** Stable identifier matching BioWiraMusicTheme or BioWiraSfxKey */
  key: string
  /** Ordered list of public-path audio file sources (first supported is used) */
  sources: string[]
  loop?: boolean
  /** Volume multiplier (0.0–1.0) applied on top of the user's volume setting */
  baseVolume?: number
}

/** Default audio preferences used before first localStorage read. */
export const DEFAULT_AUDIO_PREFS: BioWiraAudioPreferences = {
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.35,
  sfxVolume: 0.55,
}
