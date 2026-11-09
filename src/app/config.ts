import type { AppConfig, NarrationSource, RepoSource, RepoSources } from '@/domain'

/** Strip trailing slashes so `${base}/animals` never becomes `//animals`. */
export function normalizeApiBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

/**
 * Same-origin API prefix including the version segment.
 * Production: CloudFront routes `https://biowira.dpdns.org/api/*` → backend, so `/api/v1/...` resolves.
 * Local dev: Vite dev server proxies `/api` → backend origin (see vite.config.ts), so `/api/v1/...` also resolves.
 * All backend endpoints live under `/api/v1/` per the Swagger contract.
 * Centralised here — repositories use clean relative paths like `/animals`, `/profiles`, etc.
 */
const DEFAULT_API_BASE_URL = '/api/v1'

function resolveApiBaseUrl(): string {
  const raw = import.meta.env['VITE_API_BASE_URL']
  if (raw == null || String(raw).trim() === '') return DEFAULT_API_BASE_URL
  return String(raw).trim()
}

// ── Per-domain repository source resolution ───────────────────────────────────
// Reads an optional VITE_REPO_<DOMAIN> env var and validates it as RepoSource.
// Unset / invalid values fall back to the provided safe default so a .env typo
// never accidentally enables a non-existent API route.
function resolveRepoSource(raw: string | undefined, defaultValue: RepoSource): RepoSource {
  const value = raw?.trim()
  if (value === 'api' || value === 'mock') return value
  return defaultValue
}

function resolveRepoSources(): RepoSources {
  return {
    animals:  resolveRepoSource(import.meta.env['VITE_REPO_ANIMALS'],   'api'),
    session:  resolveRepoSource(import.meta.env['VITE_REPO_SESSION'],   'api'),
    profile:  resolveRepoSource(import.meta.env['VITE_REPO_PROFILE'],   'api'),
    user:     resolveRepoSource(import.meta.env['VITE_REPO_USER'],      'mock'),
    funFacts: resolveRepoSource(import.meta.env['VITE_REPO_FUN_FACTS'], 'api'),
    quizzes:  resolveRepoSource(import.meta.env['VITE_REPO_QUIZZES'],   'api'),
    missions: resolveRepoSource(import.meta.env['VITE_REPO_MISSIONS'],  'api'),
    badges:   resolveRepoSource(import.meta.env['VITE_REPO_BADGES'],    'api'),
  }
}

// ── Narration source resolution ────────────────────────────────────────────
// Default is 'api' — BioWira backend ElevenLabs cached TTS endpoint.
// Set VITE_NARRATION_SOURCE=browser to explicitly use Web Speech API fallback.
// Never put ElevenLabs credentials in frontend env files.
function resolveNarrationSource(raw: string | undefined): NarrationSource {
  const value = raw?.trim()
  if (value === 'browser') return 'browser'
  return 'api'
}

// ── TTS configuration resolution ──────────────────────────────────────────
const DEFAULT_TTS_VOICE_ID = 'rCmVtv8cYU60uhlsOo1M'
const DEFAULT_TTS_MODEL_ID = 'eleven_v3'
const DEFAULT_TTS_SPEED = 1

function resolveTtsSpeed(raw: string | undefined): number {
  const parsed = parseFloat(raw ?? '')
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TTS_SPEED
  return parsed
}

export const appConfig: AppConfig = {
  /** Centralised REST base (e.g. `/api`). Never set full production hostnames in components. */
  apiBaseUrl: normalizeApiBaseUrl(resolveApiBaseUrl()),
  useMock: import.meta.env['VITE_USE_MOCK'] === 'true',
  appVersion: import.meta.env['VITE_APP_VERSION'] ?? '0.1.0',
  pointsPerQuizCorrect: 20,
  bonusForPerfectQuiz: 20,
  maxRetries: 1,
  /** When false, the session guard is bypassed (useful for unit tests / CI) */
  sessionEnabled: import.meta.env['VITE_SESSION_ENABLED'] !== 'false',
  /**
   * Per-domain repository source selection.
   * Each domain independently chooses 'api' or 'mock'.
   * `user` stays `mock` — no `/api/user/*` exists in the backend contract.
   * `missions` and `badges` default to `api` (live backend endpoints exist).
   * Override per-domain via optional VITE_REPO_* env vars (see .env.example).
   */
  repoSources: resolveRepoSources(),
  /**
   * Narration source: 'api' (default) or 'browser'.
   * Default is 'api' — BioWira backend ElevenLabs cached TTS endpoint /api/v1/tts/generate.
   * Set VITE_NARRATION_SOURCE=browser to use Web Speech API as explicit dev fallback.
   * Never put ElevenLabs credentials in frontend env files.
   */
  narrationSource: resolveNarrationSource(import.meta.env['VITE_NARRATION_SOURCE']),
  /**
   * ElevenLabs TTS parameters, resolved from VITE_TTS_* env vars.
   * Defaults are safe for immediate use if env vars are missing.
   * Never hardcode voice/model IDs in components — always read from appConfig.tts.
   */
  tts: {
    voiceId: import.meta.env['VITE_TTS_VOICE_ID']?.trim() || DEFAULT_TTS_VOICE_ID,
    modelId: import.meta.env['VITE_TTS_MODEL_ID']?.trim() || DEFAULT_TTS_MODEL_ID,
    speed: resolveTtsSpeed(import.meta.env['VITE_TTS_SPEED']),
  },
}

if (import.meta.env.DEV) {
  console.info('[BioWira narration config]', {
    narrationSource: appConfig.narrationSource,
    apiBaseUrl: appConfig.apiBaseUrl,
    modelId: appConfig.tts.modelId,
    voiceIdConfigured: Boolean(import.meta.env['VITE_TTS_VOICE_ID']),
  })
}

// ── Storage keys ──────────────────────────────────────────────────────────────
// All localStorage keys are centralised here. Never use raw strings elsewhere.
export const STORAGE_KEYS = {
  PROFILES: 'bw_profiles',
  ACTIVE_SESSION: 'bw_active_session',
  SESSION_TOKEN: 'bw_session_token',
  audioPreferences: 'bw_audio_preferences',
  seenUnlockKey: (profileId: string) => `bw_seen_unlocks_${profileId}`,
  missionState: (profileId: string) => `bw_mission_${profileId}`,
  explorerRescueProgress: (profileId: string) => `bw_explorer_rescue_${profileId}`,
  demoUnlockedFunFactAnimals: (profileId: string) => `bw_demo_unlocked_fun_fact_animals_${profileId}`,
  animalChatSession: (profileId: string, animalType: string) => `bw_animal_chat_${profileId}_${animalType}`,
  gameJournalState: (profileId: string) => `bw_game_journal_${profileId}`,
  ecoComicProgress: (profileId: string) => `bw_eco_comic_${profileId}`,
} as const

// ── Session options ────────────────────────────────────────────────────────────
export const SESSION_OPTIONS = {
  autoRestoreOnSameDevice: true,
  maxProfilesPerDevice: 5,
} as const

// ── Safe nickname presets ──────────────────────────────────────────────────────
// Centralised here so UI components never contain hardcoded word lists.
export const SAFE_NICKNAME_ADJECTIVES = [
  'Brave',
  'Happy',
  'Gentle',
  'Swift',
  'Sunny',
  'Bold',
  'Clever',
  'Curious',
  'Bright',
  'Loyal',
  'Mighty',
  'Calm',
  'Wild',
  'Zesty',
  'Fuzzy',
  'Daring',
  'Noble',
  'Jolly',
  'Speedy',
  'Cosmic',
] as const

export const SAFE_NICKNAME_NOUNS = [
  'Panda',
  'Fern',
  'Cloud',
  'River',
  'Tiger',
  'Leaf',
  'Storm',
  'Hawk',
  'Stone',
  'Coral',
  'Forest',
  'Breeze',
  'Dawn',
  'Echo',
  'Blaze',
  'Finch',
  'Grove',
  'Maple',
  'Cedar',
  'Sage',
] as const

/** Generate a random safe nickname from adjective + noun combination */
export function generateSafeNickname(): string {
  const adj =
    SAFE_NICKNAME_ADJECTIVES[Math.floor(Math.random() * SAFE_NICKNAME_ADJECTIVES.length)]!
  const noun = SAFE_NICKNAME_NOUNS[Math.floor(Math.random() * SAFE_NICKNAME_NOUNS.length)]!
  return `${adj} ${noun}`
}

// ── Route names ────────────────────────────────────────────────────────────────
export const ROUTE_NAMES = {
  home: 'home',
  discover: 'discover',
  games: 'games',
  quiz: 'quiz',
  quizResult: 'quiz-result',
  welcome: 'welcome',
  missions: 'missions',
  missionResult: 'mission-result',
  ecoComics: 'eco-comics',
  ecoComicReader: 'eco-comic-reader',
  explorerRescue: 'explorer-rescue',
  explorerRescuePlay: 'explorer-rescue-play',
  explorerRescueResult: 'explorer-rescue-result',
  explorerRescueJournal: 'explorer-rescue-journal',
  gameJournalMenu: 'game-journal-menu',
  gameJournalCategory: 'game-journal-category',
} as const

// ── Status colors & labels ─────────────────────────────────────────────────────
export const STATUS_COLORS: Record<string, string> = {
  extinct: 'var(--status-extinct)',
  extinct_in_the_wild: 'var(--status-extinct-in-the-wild)',
  critically_endangered: 'var(--status-critically-endangered)',
  endangered: 'var(--status-endangered)',
  vulnerable: 'var(--status-vulnerable)',
  near_threatened: 'var(--status-near-threatened)',
  least_concern: 'var(--status-least-concern)',
  data_deficient: 'var(--status-data-deficient)',
  not_evaluated: 'var(--status-not-evaluated)',
}

export const STATUS_LABELS: Record<string, string> = {
  extinct: 'Extinct',
  extinct_in_the_wild: 'Extinct in the Wild',
  critically_endangered: 'Critically Endangered',
  endangered: 'Endangered',
  vulnerable: 'Vulnerable',
  near_threatened: 'Near Threatened',
  least_concern: 'Least Concern',
  data_deficient: 'Data Deficient',
  not_evaluated: 'Not Evaluated',
}

export const CATEGORY_EMOJI: Record<string, string> = {
  all: '🌿',
  mammals: '🐯',
  birds: '🦅',
  reptiles: '🦎',
  marine_freshwater: '🐢',
  amphibians: '🐸',
  insects: '🦋',
}

export const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  mammals: 'Mammals',
  birds: 'Birds',
  reptiles: 'Reptiles',
  marine_freshwater: 'Marine & Freshwater',
  amphibians: 'Amphibians',
  insects: 'Insects',
}

// ── Navigation item type ──────────────────────────────────────────────────────
export interface NavItem {
  label: string
  path: string
  iconKey: string
  fallbackIcon: string
  /**
   * Extra path prefixes that also activate this nav item (in addition to `path`).
   * Example: Games is active for `/missions` even though that route is not under `/games`.
   */
  activePathPrefixes?: readonly string[]
}

// ── Navigation items ───────────────────────────────────────────────────────────
// `iconKey` must match a key registered in src/app/iconRegistry.ts NAV_ICON_MAP.
// Nav components use AppIcon to resolve the SVG; if the key is unknown,
// AppIcon renders `fallbackText` (the emoji string below) instead.
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home',     path: '/',        iconKey: 'home',     fallbackIcon: '🏠' },
  { label: 'Discover', path: '/discover', iconKey: 'discover', fallbackIcon: '🔍' },
  { label: 'Quiz',     path: '/quiz',    iconKey: 'quiz',     fallbackIcon: '🧠' },
  { label: 'Games',    path: '/games',   iconKey: 'games',    fallbackIcon: '🎮', activePathPrefixes: ['/missions'] },
]

export const HABITAT_LABELS: Record<string, string> = {
  rainforest: 'Rainforest',
  mountain: 'Mountain',
  river: 'River',
  coastal_area: 'Coastal Area',
  mangrove: 'Mangrove',
  marine_reserve: 'Marine Reserve',
}

// ── Discover map assets ────────────────────────────────────────────────────────
// All paths and intrinsic aspect ratios for the pixel-art Malaysia map.
// Change the asset paths here when the art team ships new files — no template
// changes are needed.
//
// desktopAspectRatio / mobileAspectRatio:
//   Used as a CSS aspect-ratio fallback on the container during image load,
//   preventing layout-shift. Values are set from visual inspection:
//   desktop ≈ 16/9 (landscape), mobile ≈ 9/16 (portrait).
//   To get the exact ratio: imageWidth / imageHeight.
//
// mobileBreakpoint:
//   Below this width (px) the mobile map asset is served via <source media>.
//
export const DISCOVER_MAP_CONFIG = {
  desktopAsset: '/maps/malaysia-discover-desktop.png',
  mobileAsset: '/maps/malaysia-discover-mobile.png',
  /** CSS aspect-ratio string for the layout skeleton while desktop image loads */
  desktopAspectRatio: '16 / 9',
  /** CSS aspect-ratio string for the layout skeleton while mobile image loads */
  mobileAspectRatio: '9 / 16',
  /** Viewport width (px) below which the mobile asset is used */
  mobileBreakpoint: 768,
} as const

// ── Animal marker sprites ──────────────────────────────────────────────────────
// Sprites live in public/sprites/<key>.png.
// getMarkerSpriteUrl returns a URL when the key is present, or undefined when
// it is not — callers should fall back to iconEmoji in that case.
//
// When the art team ships sprite files, simply drop them into public/sprites/
// using the same key as markerSpriteKey on the Animal object. No code changes
// required.
//
export function getMarkerSpriteUrl(key: string | undefined): string | undefined {
  if (!key) return undefined
  return `/sprites/${key}.png`
}

// ── Mapbox Access Token ───────────────────────────────────────────────────────
// Get Mapbox token for rendering occurrence markers
export function getMapboxToken(): string | undefined {
  return import.meta.env['VITE_MAPBOX_ACCESS_TOKEN']
}

// ── Mapbox Occurrence Map Config ──────────────────────────────────────────────
export const MAPBOX_CONFIG = {
  style: 'mapbox://styles/mapbox/outdoors-v12',
  /** Force a flat map display (prevent globe/3D view) */
  projection: 'mercator' as const,
  /**
   * Bounding box restricting panning to Malaysia and immediate surrounding waters.
   * [SW lng, SW lat], [NE lng, NE lat]
   */
  maxBounds: [
    [98.5, 0.5],   // Southwest (below Peninsular)
    [120.5, 8.5],  // Northeast (above Sabah)
  ] as [[number, number], [number, number]],
  /** Center between Peninsular and East Malaysia */
  defaultCenter: [109.5, 4.5] as [number, number],
  defaultZoom: 5,
  minZoom: 4.5,
  maxZoom: 12,
  fitPadding: 60,
} as const
