/**
 * BioWira Asset Preload Service
 *
 * Provides a critical-first preloading strategy for static local assets.
 * - Critical assets block interaction until loaded (or timed out).
 * - Warm assets are loaded in the background after the app becomes interactive.
 *
 * Rules:
 * - Never preloads remote URLs (Mapbox, API data, CDN animal photos).
 * - Never preloads audio elements (respects browser autoplay policy).
 * - Audio warm-up uses fetch HEAD to prime HTTP cache only.
 * - Deduplicates all URL lists to avoid double-loading.
 * - Uses Image.decode() for proper GPU decode where supported.
 * - Fails gracefully: one broken image never blocks the app forever.
 */

import { BRANDING, HOME_PAGE_ASSETS, EXPLORER_RESCUE_ASSETS } from '@/app/branding'
import { getNavIconUrl } from '@/app/iconRegistry'
import { getEcoComicWarmAssetUrls } from '@/features/eco-comics/data/ecoComicAssetRegistry'

export interface PreloadProgress {
  total: number
  loaded: number
  failed: number
  percentage: number
  phase: string
  message: string
}

export type PreloadProgressCallback = (progress: PreloadProgress) => void

const LOADING_MESSAGES = [
  'Preparing the rainforest\u2026',
  'Waking up the animals\u2026',
  'Packing your explorer bag\u2026',
  'Brushing the jungle leaves\u2026',
  'Setting up the adventure\u2026',
] as const

/**
 * Deduplicate a list of URLs, removing empty strings and exact duplicates.
 * Exported for testing.
 */
export function deduplicateUrls(urls: string[]): string[] {
  return [...new Set(urls.filter(Boolean))]
}

/**
 * Determine the correct responsive homepage background for the current viewport.
 * Only one background is loaded — never all three — to avoid wasted bandwidth.
 */
function getResponsiveHomeBackground(): string {
  if (typeof window === 'undefined') return HOME_PAGE_ASSETS.homeScene.desktopBackground
  const w = window.innerWidth
  if (w < 768) return HOME_PAGE_ASSETS.homeScene.mobileBackground
  if (w < 1024) return HOME_PAGE_ASSETS.homeScene.tabletBackground
  return HOME_PAGE_ASSETS.homeScene.desktopBackground
}

/**
 * Load a single image URL with async decoding and a timeout fallback.
 * Returns true on success, false on failure or timeout.
 * A single broken image never hangs the entire preload pipeline.
 */
async function loadImageUrl(url: string, timeoutMs: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs)
    const cleanup = (success: boolean) => {
      clearTimeout(timer)
      resolve(success)
    }
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if ('decode' in img) {
        img.decode().then(() => cleanup(true)).catch(() => cleanup(true))
      } else {
        cleanup(true)
      }
    }
    img.onerror = () => cleanup(false)
    img.src = url
  })
}

/**
 * Returns the critical (blocking) asset URLs for the initial app shell and home page.
 *
 * Includes:
 * - BioWira branding (wordmark, icon)
 * - Nav icons (5 small WebPs used by top/bottom nav)
 * - Home scene: responsive background (viewport-aware), ribbon, decor
 * - All 5 feature card panels, icons, and buttons
 * - Dashboard progress panel assets
 *
 * Does NOT include:
 * - Audio files
 * - Remote URLs (CDN photos, Mapbox)
 * - Mobile+tablet backgrounds when on desktop (and vice versa)
 * - Explorer Rescue game assets (warmed separately)
 */
export function getCriticalAssetUrls(): string[] {
  const brandingUrls = [BRANDING.wordmark, BRANDING.appIcon]

  const navKeys = ['home', 'discover', 'quiz', 'games', 'missions']
  const navUrls = navKeys
    .map((k) => getNavIconUrl(k))
    .filter((u): u is string => Boolean(u))

  const homeSceneUrls = [
    getResponsiveHomeBackground(),
    HOME_PAGE_ASSETS.homeScene.ribbon,
    HOME_PAGE_ASSETS.homeScene.arrowBoard,
    HOME_PAGE_ASSETS.homeScene.flowerPlant,
  ]

  const featureCardUrls = Object.values(HOME_PAGE_ASSETS.featureCards).flatMap((card) => [
    card.panel,
    card.icon,
    card.button,
  ])

  const dashboardUrls = Object.values(HOME_PAGE_ASSETS.dashboard)

  return deduplicateUrls([
    ...brandingUrls,
    ...navUrls,
    ...homeSceneUrls,
    ...featureCardUrls,
    ...dashboardUrls,
  ])
}

/**
 * Returns the warm (non-blocking) asset URLs to preload after the app is interactive.
 *
 * Includes:
 * - Mobile + tablet home backgrounds (the two not preloaded critically)
 * - Explorer Rescue landing + gameplay assets
 * - All clue images
 * - Audio MP3 paths (handled via fetch HEAD, not Image loading)
 */
export function getWarmAssetUrls(): string[] {
  // Add the two backgrounds not loaded critically
  const { mobileBackground, tabletBackground, desktopBackground } = HOME_PAGE_ASSETS.homeScene
  const responsiveBg = getResponsiveHomeBackground()
  const otherBgs = [mobileBackground, tabletBackground, desktopBackground].filter(
    (bg) => bg !== responsiveBg,
  )

  const explorerLanding = Object.values(EXPLORER_RESCUE_ASSETS.landing)

  const explorerGameplay = [
    EXPLORER_RESCUE_ASSETS.gameplay.background,
    EXPLORER_RESCUE_ASSETS.gameplay.portalGate,
    EXPLORER_RESCUE_ASSETS.gameplay.vineLogBanner,
    EXPLORER_RESCUE_ASSETS.gameplay.tigerExplorerSprite,
    EXPLORER_RESCUE_ASSETS.gameplay.orangutanExplorerSprite,
  ]

  const clueUrls = Object.values(EXPLORER_RESCUE_ASSETS.gameplay.clues)

  // Audio warm: these are fetched via HEAD (not Image), so they prime the HTTP cache
  // without triggering browser audio restrictions or full downloads.
  const audioWarmUrls = [
    '/audio/music/calm-jungle-loop.mp3',
    '/audio/music/adventure-jungle-loop.mp3',
    '/audio/sfx/tap-soft.mp3',
    '/audio/sfx/answer-correct-soft.mp3',
    '/audio/sfx/answer-wrong-soft.mp3',
    '/audio/sfx/achievement-soft.mp3',
    '/audio/sfx/card-flip-soft.mp3',
    '/audio/sfx/leaf-collect-soft.mp3',
    '/audio/sfx/jump-soft.mp3',
  ]

  // Eco-Comic: warm only the cover + first two panels (not all 40+ scenes).
  // Remaining scenes are warmed lazily when the reader opens.
  const ecoComicWarm = getEcoComicWarmAssetUrls()

  return deduplicateUrls([
    ...otherBgs,
    ...explorerLanding,
    ...explorerGameplay,
    ...clueUrls,
    ...audioWarmUrls,
    ...ecoComicWarm,
  ])
}

/**
 * Preload an array of image URLs in parallel with progress reporting and per-image timeout.
 *
 * - Audio URLs are silently skipped (use warmAssetsIdle for audio).
 * - Progress callback is called after each asset resolves (success or failure).
 * - A failed asset logs a warning in dev but never crashes the app.
 * - The overall promise always resolves (never rejects) so startup is never blocked permanently.
 */
export async function preloadCriticalAssets(
  urls: string[],
  timeoutMs = 8000,
  onProgress?: PreloadProgressCallback,
): Promise<{ loaded: string[]; failed: string[] }> {
  // Skip audio URLs — image loading doesn't apply to them
  const imageUrls = urls.filter((u) => !/\.(mp3|ogg|wav)$/i.test(u))
  const total = imageUrls.length

  if (total === 0) {
    return { loaded: [], failed: [] }
  }

  const loaded: string[] = []
  const failed: string[] = []
  let resolvedCount = 0
  let messageIdx = 0

  const promises = imageUrls.map(async (url) => {
    const success = await loadImageUrl(url, timeoutMs)
    resolvedCount++
    messageIdx = (messageIdx + 1) % LOADING_MESSAGES.length

    if (success) {
      loaded.push(url)
    } else {
      failed.push(url)
      if (import.meta.env.DEV) {
        console.warn(`[BioWira preload] Failed to load: ${url}`)
      }
    }

    onProgress?.({
      total,
      loaded: loaded.length,
      failed: failed.length,
      percentage: Math.round((resolvedCount / total) * 100),
      phase: 'critical',
      message: LOADING_MESSAGES[messageIdx],
    })
  })

  await Promise.all(promises)
  return { loaded, failed }
}

/**
 * Warm non-critical assets (images and audio) after the app is interactive.
 *
 * - Images: loaded via new Image() for browser decode cache warm-up.
 * - Audio: fetched via HEAD to prime the HTTP/range-request cache without playing.
 * - Uses requestIdleCallback (with 5 s timeout) to avoid competing with user interaction.
 * - Uses a 2 s setTimeout fallback on browsers without requestIdleCallback.
 */
export function warmAssetsIdle(urls: string[]): void {
  const unique = deduplicateUrls(urls)

  const doWarm = () => {
    for (const url of unique) {
      if (/\.(mp3|ogg|wav)$/i.test(url)) {
        // Prime the HTTP cache for audio without autoplay risk
        fetch(url, { method: 'HEAD', cache: 'force-cache' }).catch(() => {
          // Non-critical — silent failure
        })
      } else {
        const img = new Image()
        img.decoding = 'async'
        img.src = url
      }
    }
  }

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(doWarm, { timeout: 5000 })
  } else {
    setTimeout(doWarm, 2000)
  }
}
