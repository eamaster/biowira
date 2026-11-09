/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USE_MOCK: string
  readonly VITE_APP_VERSION: string
  readonly VITE_SESSION_ENABLED?: string
  readonly VITE_MAPBOX_ACCESS_TOKEN?: string
  readonly VITE_WEATHER_API_BASE_URL?: string
  // Per-domain repository source overrides (optional — defaults are in src/app/config.ts)
  // Valid values: 'api' | 'mock'  (invalid values fall back to the safe default)
  readonly VITE_REPO_ANIMALS?: string
  readonly VITE_REPO_SESSION?: string
  readonly VITE_REPO_PROFILE?: string
  readonly VITE_REPO_USER?: string
  readonly VITE_REPO_FUN_FACTS?: string
  readonly VITE_REPO_QUIZZES?: string
  readonly VITE_REPO_MISSIONS?: string
  readonly VITE_REPO_BADGES?: string
  // Narration source: 'api' (BioWira backend ElevenLabs TTS, default) | 'browser' (Web Speech API fallback)
  // Never add ElevenLabs or any third-party API credentials here.
  readonly VITE_NARRATION_SOURCE?: string
  // ElevenLabs TTS parameters (resolved in src/app/config.ts; safe defaults applied if missing)
  readonly VITE_TTS_VOICE_ID?: string
  readonly VITE_TTS_MODEL_ID?: string
  readonly VITE_TTS_SPEED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
