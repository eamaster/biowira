// ============================================================
// BioWira App Audio Service
//
// Singleton service that manages:
//   - Background music (one HTMLAudioElement per theme; outgoing track stops immediately on change)
//   - SFX playback via a reusable pool of HTMLAudioElements
//
// Rules:
//   - No audio plays until the user has interacted (browser autoplay policy).
//   - All volume levels are controlled here; components never touch HTMLAudioElement directly.
//   - When narration is playing (indicated via setNarrationActive), music is ducked to 15%.
//   - This file is the ONLY place that owns HTMLAudioElement for background music.
// ============================================================

import type { BioWiraMusicTheme, BioWiraSfxKey, BioWiraAudioAsset } from '@/domain/appAudio'

// ── Asset registry ─────────────────────────────────────────────────────────────

/** All background music tracks served from /audio/music/. MP3 only — no OGG files exist in public/audio/. */
const MUSIC_ASSETS: Record<BioWiraMusicTheme, BioWiraAudioAsset | null> = {
  none: null,
  'calm-jungle': {
    key: 'calm-jungle',
    sources: ['/audio/music/calm-jungle-loop.mp3'],
    loop: true,
    baseVolume: 1.0,
  },
  'adventure-jungle': {
    key: 'adventure-jungle',
    sources: ['/audio/music/adventure-jungle-loop.mp3'],
    loop: true,
    baseVolume: 1.0,
  },
}

/** All SFX clips served from /audio/sfx/. MP3 only — no OGG files exist in public/audio/. */
const SFX_ASSETS: Record<BioWiraSfxKey, BioWiraAudioAsset> = {
  tap: {
    key: 'tap',
    sources: ['/audio/sfx/tap-soft.mp3'],
    baseVolume: 0.6,
  },
  'answer-correct': {
    key: 'answer-correct',
    sources: ['/audio/sfx/answer-correct-soft.mp3'],
    baseVolume: 0.8,
  },
  'answer-wrong': {
    key: 'answer-wrong',
    sources: ['/audio/sfx/answer-wrong-soft.mp3'],
    baseVolume: 0.7,
  },
  achievement: {
    key: 'achievement',
    sources: ['/audio/sfx/achievement-soft.mp3'],
    baseVolume: 0.9,
  },
  'card-flip': {
    key: 'card-flip',
    sources: ['/audio/sfx/card-flip-soft.mp3'],
    baseVolume: 0.5,
  },
  'leaf-collect': {
    key: 'leaf-collect',
    sources: ['/audio/sfx/leaf-collect-soft.mp3'],
    baseVolume: 0.75,
  },
  jump: {
    key: 'jump',
    sources: ['/audio/sfx/jump-soft.mp3'],
    baseVolume: 0.65,
  },
  // journal-flip-soft.mp3 does not exist on disk — remapped to card-flip-soft.mp3
  // (similar page-turn sound). baseVolume reduced slightly to 0.45 to match the
  // softer context of a journal page turn vs. a game card flip.
  'journal-flip': {
    key: 'journal-flip',
    sources: ['/audio/sfx/card-flip-soft.mp3'],
    baseVolume: 0.45,
  },
}

// ── Internal state ─────────────────────────────────────────────────────────────

/** True once the user has interacted and audio is allowed by the browser. */
let _interactionUnlocked = false

/** Current music theme being played (or requested). */
let _currentTheme: BioWiraMusicTheme = 'none'

/** The HTMLAudioElement for the currently-playing music track. */
let _musicEl: HTMLAudioElement | null = null

/** Fade-in animation frame ID (volume ramp for the active track only). */
let _fadeTimer: ReturnType<typeof requestAnimationFrame> | null = null

/** Music volume setting (0.0–1.0). */
let _musicVolume = 0.35

/** SFX volume setting (0.0–1.0). */
let _sfxVolume = 0.55

/** Whether music is globally enabled. */
let _musicEnabled = true

/** Whether SFX is globally enabled. */
let _sfxEnabled = true

/** True when narration is playing — music is ducked. */
let _narrationActive = false

/** Timestamp of last tap SFX play (for cooldown). */
let _lastTapTime = 0
/** Minimum ms between tap SFX plays (prevents spam on rapid clicks). */
const TAP_COOLDOWN_MS = 100

/** Effective music volume accounting for narration ducking. */
function _effectiveMusicVolume(): number {
  const duck = _narrationActive ? 0.15 : 1.0
  return _musicVolume * duck
}

// ── Fade helpers ──────────────────────────────────────────────────────────────

function _cancelFade(): void {
  if (_fadeTimer !== null) {
    cancelAnimationFrame(_fadeTimer)
    _fadeTimer = null
  }
}

/**
 * Stop and release a music element. Used when switching themes so the previous
 * loop cannot keep playing (e.g. adventure-jungle after leaving the play route).
 */
function _disposeMusicEl(el: HTMLAudioElement): void {
  el.pause()
  el.currentTime = 0
  while (el.firstChild) {
    el.removeChild(el.firstChild)
  }
  el.removeAttribute('src')
  el.load()
}

/**
 * Smoothly fade a music element in to the target volume.
 * Duration is ~800 ms.
 */
function _fadeIn(el: HTMLAudioElement, targetVol: number): void {
  _cancelFade()
  el.volume = 0
  const startTime = performance.now()
  const FADE_DURATION = 800

  function step(now: number) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / FADE_DURATION, 1)
    el.volume = targetVol * progress
    if (progress < 1) {
      _fadeTimer = requestAnimationFrame(step)
    }
  }
  _fadeTimer = requestAnimationFrame(step)
}

// ── Music element factory ─────────────────────────────────────────────────────

function _createMusicEl(asset: BioWiraAudioAsset): HTMLAudioElement {
  const el = new Audio()
  el.loop = asset.loop ?? true
  // metadata warms the HTTP connection (range-request ready) without downloading the whole track —
  // faster first-play without triggering autoplay restrictions.
  el.preload = 'metadata'
  // Try each source
  for (const src of asset.sources) {
    const source = document.createElement('source')
    source.src = src
    el.appendChild(source)
  }
  el.onerror = () => {
    if (import.meta.env.DEV) {
      console.warn(`[BioWira audio] Music track "${asset.key}" failed to load.`)
    }
  }
  return el
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Must be called once from a user gesture handler (e.g. first click/tap).
 * After this, music and SFX will be allowed to play.
 */
export function unlockAudio(): void {
  if (_interactionUnlocked) return
  _interactionUnlocked = true

  // Resume any suspended AudioContext in the environment
  if (typeof window !== 'undefined') {
    const ctx = (window as unknown as { __bwAudioCtx?: AudioContext }).__bwAudioCtx
    if (ctx?.state === 'suspended') {
      void ctx.resume()
    }
  }

  // Attempt to start the current theme now after the first gesture.
  // IMPORTANT: Deferred theme setup leaves _musicEl at volume 0 (see setMusicTheme). We must
  // fade in here — calling play() alone would "play" inaudibly forever.
  if (_currentTheme !== 'none' && _musicEnabled && _musicEl) {
    const el = _musicEl
    const asset = MUSIC_ASSETS[_currentTheme]
    const targetVol = (asset?.baseVolume ?? 1) * _effectiveMusicVolume()
    const promise = el.play()
    if (promise) {
      promise
        .then(() => _fadeIn(el, targetVol))
        .catch(() => {
          // Silent — user may block audio
        })
    }
  }
}

/**
 * Switch to a new music theme.
 * - If already on this theme and playing, does nothing.
 * - Stops the previous track immediately, then fades in the new one (if any).
 */
export function setMusicTheme(theme: BioWiraMusicTheme): void {
  if (theme === _currentTheme) return

  _cancelFade()

  const prevTheme = _currentTheme
  _currentTheme = theme

  const prevEl = _musicEl
  _musicEl = null
  if (prevEl && prevTheme !== 'none') {
    _disposeMusicEl(prevEl)
  }

  // Start new
  const asset = MUSIC_ASSETS[theme]
  if (!asset || !_musicEnabled) {
    return
  }

  const el = _createMusicEl(asset)
  _musicEl = el

  if (!_interactionUnlocked) {
    // Defer until user interacts — just set the element; unlockAudio() will start it
    el.volume = 0
    return
  }

  const targetVol = (asset.baseVolume ?? 1) * _effectiveMusicVolume()
  el.volume = 0
  const promise = el.play()
  if (promise) {
    promise
      .then(() => _fadeIn(el, targetVol))
      .catch(() => {
        // Autoplay blocked — wait for unlockAudio
      })
  }
}

/**
 * Pause music without changing the theme (e.g. tab hidden).
 */
export function pauseMusic(): void {
  if (_musicEl && !_musicEl.paused) {
    _musicEl.pause()
  }
}

/**
 * Resume music if it was paused and the theme is active.
 */
export function resumeMusic(): void {
  if (!_musicEnabled || !_interactionUnlocked || !_musicEl || _currentTheme === 'none') return
  if (_musicEl.paused) {
    const promise = _musicEl.play()
    if (promise)
      promise.catch(() => {
        /* silent */
      })
  }
}

/** Update music enabled state. */
export function setMusicEnabled(enabled: boolean): void {
  _musicEnabled = enabled
  if (!enabled) {
    pauseMusic()
  } else {
    // Re-apply the current theme
    const theme = _currentTheme
    _currentTheme = 'none'
    setMusicTheme(theme)
  }
}

/** Update SFX enabled state. */
export function setSfxEnabled(enabled: boolean): void {
  _sfxEnabled = enabled
}

/** Update music volume (0.0–1.0). */
export function setMusicVolume(vol: number): void {
  _musicVolume = Math.max(0, Math.min(1, vol))
  if (_musicEl && !_musicEl.paused) {
    _musicEl.volume = _effectiveMusicVolume()
  }
}

/** Update SFX volume (0.0–1.0). */
export function setSfxVolume(vol: number): void {
  _sfxVolume = Math.max(0, Math.min(1, vol))
}

/**
 * Signal that narration is playing — music ducks to 15%.
 * Call with false when narration stops.
 */
export function setNarrationActive(active: boolean): void {
  _narrationActive = active
  if (_musicEl && !_musicEl.paused) {
    _musicEl.volume = _effectiveMusicVolume()
  }
}

/**
 * Play a short sound effect. Fire-and-forget.
 * For 'tap', a 100ms cooldown prevents spam on rapid clicks.
 * Returns immediately; errors are silent (better UX than crashing).
 */
export function playSfx(key: BioWiraSfxKey): void {
  if (!_sfxEnabled || !_interactionUnlocked) return

  // Cooldown for tap SFX to avoid annoying rapid sounds
  if (key === 'tap') {
    const now = Date.now()
    if (now - _lastTapTime < TAP_COOLDOWN_MS) return
    _lastTapTime = now
  }

  const asset = SFX_ASSETS[key]
  if (!asset) return

  // Create a short-lived Audio element to allow rapid overlapping playback
  const el = new Audio()
  for (const src of asset.sources) {
    const source = document.createElement('source')
    source.src = src
    el.appendChild(source)
  }
  el.volume = Math.min(1, (asset.baseVolume ?? 1) * _sfxVolume)
  el.preload = 'auto'

  const promise = el.play()
  if (promise) {
    promise.catch(() => {
      // Silent — SFX errors are non-critical
    })
  }

  // Garbage-collect the element after it finishes
  el.onended = () => {
    el.src = ''
  }
}

/**
 * Returns the current interaction-unlock state (for debugging / testing).
 */
export function isAudioUnlocked(): boolean {
  return _interactionUnlocked
}
