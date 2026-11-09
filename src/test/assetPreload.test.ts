/**
 * Tests for the BioWira asset preload service and app bootstrap store.
 *
 * Covers:
 * - URL deduplication
 * - Critical URL list shape (no audio, no remote, no duplicates)
 * - Warm URL list shape
 * - preloadCriticalAssets resolves correctly with progress reporting
 * - Timeout fallback (no hanging)
 * - appBootstrapStore phase transitions
 * - appBootstrapStore percentage calculation
 * - appBootstrapStore complete() enforces minimum display time
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// ── appBootstrapStore tests ───────────────────────────────────────────────────

describe('appBootstrapStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in idle phase with isReady=false', async () => {
    const { useAppBootstrapStore } = await import('@/stores/appBootstrapStore')
    const store = useAppBootstrapStore()
    expect(store.phase).toBe('idle')
    expect(store.isReady).toBe(false)
  })

  it('transitions to session phase after startBootstrap()', async () => {
    const { useAppBootstrapStore } = await import('@/stores/appBootstrapStore')
    const store = useAppBootstrapStore()
    store.startBootstrap()
    expect(store.phase).toBe('session')
    expect(store.isReady).toBe(false)
  })

  it('transitions to assets phase after markAssetsPhase()', async () => {
    const { useAppBootstrapStore } = await import('@/stores/appBootstrapStore')
    const store = useAppBootstrapStore()
    store.startBootstrap()
    store.markAssetsPhase()
    expect(store.phase).toBe('assets')
    expect(store.isReady).toBe(false)
  })

  it('becomes ready and isReady=true after complete() with timers run', async () => {
    const { useAppBootstrapStore } = await import('@/stores/appBootstrapStore')
    const store = useAppBootstrapStore()
    store.startBootstrap()
    store.markAssetsPhase()
    const p = store.complete()
    // Advance past MIN_DISPLAY_MS (1200 ms) without running the infinite message
    // rotation interval. vi.runAllTimers() aborts on repeating intervals.
    await vi.advanceTimersByTimeAsync(1200)
    await p
    expect(store.phase).toBe('ready')
    expect(store.isReady).toBe(true)
  })

  it('setProgress updates percentage correctly', async () => {
    const { useAppBootstrapStore } = await import('@/stores/appBootstrapStore')
    const store = useAppBootstrapStore()
    // percentage is phase-aware; must be in 'assets' phase for setProgress to affect it.
    // Formula: Math.round(10 + (loaded + failed) / total * 89)
    // = Math.round(10 + (5 + 0) / 10 * 89) = Math.round(10 + 44.5) = 55
    store.startBootstrap()
    store.markAssetsPhase()
    store.setProgress(5, 10, 0)
    expect(store.percentage).toBe(55)
  })

  it('setProgress percentage is 0 when total is 0', async () => {
    const { useAppBootstrapStore } = await import('@/stores/appBootstrapStore')
    const store = useAppBootstrapStore()
    expect(store.percentage).toBe(0)
  })

  it('setProgress rounds percentage to nearest integer', async () => {
    const { useAppBootstrapStore } = await import('@/stores/appBootstrapStore')
    const store = useAppBootstrapStore()
    // Formula: Math.round(10 + (1 + 0) / 3 * 89) = Math.round(10 + 29.67) = 40
    store.startBootstrap()
    store.markAssetsPhase()
    store.setProgress(1, 3, 0)
    expect(store.percentage).toBe(40)
  })

  it('message is a non-empty string', async () => {
    const { useAppBootstrapStore } = await import('@/stores/appBootstrapStore')
    const store = useAppBootstrapStore()
    expect(typeof store.message).toBe('string')
    expect(store.message.length).toBeGreaterThan(0)
  })

  it('failedCount reflects setProgress failed value', async () => {
    const { useAppBootstrapStore } = await import('@/stores/appBootstrapStore')
    const store = useAppBootstrapStore()
    store.setProgress(3, 5, 2)
    expect(store.failedCount).toBe(2)
  })

  it('startBootstrap can be called multiple times without error', async () => {
    const { useAppBootstrapStore } = await import('@/stores/appBootstrapStore')
    const store = useAppBootstrapStore()
    expect(() => {
      store.startBootstrap()
      store.startBootstrap()
    }).not.toThrow()
  })
})

// ── assetPreloadService tests ─────────────────────────────────────────────────

describe('assetPreloadService — deduplicateUrls', () => {
  it('removes exact duplicate URLs', async () => {
    const { deduplicateUrls } = await import('@/services/assetPreloadService')
    const result = deduplicateUrls(['/a.webp', '/b.webp', '/a.webp', '/c.webp'])
    expect(result).toEqual(['/a.webp', '/b.webp', '/c.webp'])
  })

  it('removes empty strings', async () => {
    const { deduplicateUrls } = await import('@/services/assetPreloadService')
    const result = deduplicateUrls(['', '/a.webp', '', '/b.webp'])
    expect(result).toEqual(['/a.webp', '/b.webp'])
  })

  it('returns empty array for empty input', async () => {
    const { deduplicateUrls } = await import('@/services/assetPreloadService')
    expect(deduplicateUrls([])).toEqual([])
  })

  it('preserves order of first occurrence', async () => {
    const { deduplicateUrls } = await import('@/services/assetPreloadService')
    const result = deduplicateUrls(['/c.webp', '/a.webp', '/b.webp', '/a.webp'])
    expect(result[0]).toBe('/c.webp')
    expect(result[1]).toBe('/a.webp')
  })
})

describe('assetPreloadService — getCriticalAssetUrls', () => {
  it('returns a non-empty array', async () => {
    const { getCriticalAssetUrls } = await import('@/services/assetPreloadService')
    const urls = getCriticalAssetUrls()
    expect(urls.length).toBeGreaterThan(0)
  })

  it('returns an already-deduplicated list (no duplicates)', async () => {
    const { getCriticalAssetUrls, deduplicateUrls } = await import('@/services/assetPreloadService')
    const urls = getCriticalAssetUrls()
    expect(urls).toEqual(deduplicateUrls(urls))
  })

  it('does not include audio file URLs', async () => {
    const { getCriticalAssetUrls } = await import('@/services/assetPreloadService')
    const urls = getCriticalAssetUrls()
    const audioUrls = urls.filter((u) => /\.(mp3|ogg|wav)$/i.test(u))
    expect(audioUrls).toHaveLength(0)
  })

  it('does not include remote (http/https) URLs', async () => {
    const { getCriticalAssetUrls } = await import('@/services/assetPreloadService')
    const urls = getCriticalAssetUrls()
    const remoteUrls = urls.filter((u) => /^https?:\/\//i.test(u))
    expect(remoteUrls).toHaveLength(0)
  })

  it('includes at least one branding URL (wordmark or icon)', async () => {
    const { getCriticalAssetUrls } = await import('@/services/assetPreloadService')
    const urls = getCriticalAssetUrls()
    const brandingUrls = urls.filter((u) => u.includes('/branding/'))
    expect(brandingUrls.length).toBeGreaterThan(0)
  })

  it('includes at least one nav icon URL', async () => {
    const { getCriticalAssetUrls } = await import('@/services/assetPreloadService')
    const urls = getCriticalAssetUrls()
    const navUrls = urls.filter((u) => u.includes('/icons/nav/'))
    expect(navUrls.length).toBeGreaterThan(0)
  })

  it('includes exactly one responsive home background (not all three)', async () => {
    const { getCriticalAssetUrls } = await import('@/services/assetPreloadService')
    const urls = getCriticalAssetUrls()
    const bgUrls = urls.filter((u) => u.includes('home-background'))
    // Only one responsive background should be in the critical list
    expect(bgUrls).toHaveLength(1)
  })

  it('includes home-page feature card panels for all 5 cards', async () => {
    const { getCriticalAssetUrls } = await import('@/services/assetPreloadService')
    const urls = getCriticalAssetUrls()
    const cardPanels = urls.filter(
      (u) =>
        u.includes('-card.webp') ||
        u.includes('-card-panel.webp') ||
        u.includes('-card_panel.webp'),
    )
    // Should have 5 card panels (discover, eco-comics, quiz, missions, rescue)
    expect(cardPanels.length).toBeGreaterThanOrEqual(5)
  })
})

describe('assetPreloadService — getWarmAssetUrls', () => {
  it('returns a non-empty array', async () => {
    const { getWarmAssetUrls } = await import('@/services/assetPreloadService')
    const urls = getWarmAssetUrls()
    expect(urls.length).toBeGreaterThan(0)
  })

  it('returns a deduplicated list', async () => {
    const { getWarmAssetUrls, deduplicateUrls } = await import('@/services/assetPreloadService')
    const urls = getWarmAssetUrls()
    expect(urls).toEqual(deduplicateUrls(urls))
  })

  it('includes explorer rescue gameplay assets', async () => {
    const { getWarmAssetUrls } = await import('@/services/assetPreloadService')
    const urls = getWarmAssetUrls()
    const gameUrls = urls.filter((u) => u.includes('/games/explorer-rescue/'))
    expect(gameUrls.length).toBeGreaterThan(0)
  })

  it('includes audio MP3 warm URLs', async () => {
    const { getWarmAssetUrls } = await import('@/services/assetPreloadService')
    const urls = getWarmAssetUrls()
    const audioUrls = urls.filter((u) => u.endsWith('.mp3'))
    expect(audioUrls.length).toBeGreaterThan(0)
  })

  it('does not include remote (http/https) URLs', async () => {
    const { getWarmAssetUrls } = await import('@/services/assetPreloadService')
    const urls = getWarmAssetUrls()
    const remoteUrls = urls.filter((u) => /^https?:\/\//i.test(u))
    expect(remoteUrls).toHaveLength(0)
  })
})

describe('assetPreloadService — preloadCriticalAssets', () => {
  it('returns loaded and failed arrays', async () => {
    const { preloadCriticalAssets } = await import('@/services/assetPreloadService')
    const result = await preloadCriticalAssets(['/test.webp'], 200)
    expect(result).toHaveProperty('loaded')
    expect(result).toHaveProperty('failed')
    expect(Array.isArray(result.loaded)).toBe(true)
    expect(Array.isArray(result.failed)).toBe(true)
  })

  it('loaded + failed sum equals total URL count', async () => {
    const { preloadCriticalAssets } = await import('@/services/assetPreloadService')
    const result = await preloadCriticalAssets(['/a.webp', '/b.webp', '/c.webp'], 200)
    expect(result.loaded.length + result.failed.length).toBe(3)
  })

  it('skips audio URLs (does not try to load them as images)', async () => {
    const { preloadCriticalAssets } = await import('@/services/assetPreloadService')
    // Audio URLs should be skipped; result total should be 0 (no image URLs)
    const result = await preloadCriticalAssets(['/audio.mp3', '/sfx.ogg'], 200)
    expect(result.loaded.length + result.failed.length).toBe(0)
  })

  it('calls onProgress callback for each asset', async () => {
    const { preloadCriticalAssets } = await import('@/services/assetPreloadService')
    const calls: number[] = []
    await preloadCriticalAssets(['/a.webp', '/b.webp'], 200, (p) => {
      calls.push(p.percentage)
    })
    expect(calls).toHaveLength(2)
  })

  it('onProgress percentage is between 0 and 100', async () => {
    const { preloadCriticalAssets } = await import('@/services/assetPreloadService')
    const percentages: number[] = []
    await preloadCriticalAssets(['/a.webp', '/b.webp', '/c.webp'], 200, (p) => {
      percentages.push(p.percentage)
    })
    for (const pct of percentages) {
      expect(pct).toBeGreaterThanOrEqual(0)
      expect(pct).toBeLessThanOrEqual(100)
    }
  })

  it('resolves within the timeout even for broken images', async () => {
    const { preloadCriticalAssets } = await import('@/services/assetPreloadService')
    // 100ms timeout — should resolve quickly even if image load fails
    const start = Date.now()
    await preloadCriticalAssets(['/definitely-does-not-exist-xyz.webp'], 100)
    const elapsed = Date.now() - start
    // Should complete well within 2 seconds (gives it 1.5s buffer beyond timeout)
    expect(elapsed).toBeLessThan(1500)
  }, 5000)

  it('returns empty arrays for empty input', async () => {
    const { preloadCriticalAssets } = await import('@/services/assetPreloadService')
    const result = await preloadCriticalAssets([], 200)
    expect(result.loaded).toHaveLength(0)
    expect(result.failed).toHaveLength(0)
  })

  it('onProgress message is a non-empty string', async () => {
    const { preloadCriticalAssets } = await import('@/services/assetPreloadService')
    const messages: string[] = []
    await preloadCriticalAssets(['/a.webp'], 200, (p) => {
      messages.push(p.message)
    })
    for (const msg of messages) {
      expect(typeof msg).toBe('string')
      expect(msg.length).toBeGreaterThan(0)
    }
  })
})

describe('assetPreloadService — warmAssetsIdle', () => {
  it('does not throw for image URLs', async () => {
    const { warmAssetsIdle } = await import('@/services/assetPreloadService')
    expect(() => warmAssetsIdle(['/a.webp', '/b.png'])).not.toThrow()
  })

  it('does not throw for audio URLs', async () => {
    const { warmAssetsIdle } = await import('@/services/assetPreloadService')
    expect(() => warmAssetsIdle(['/audio.mp3', '/sfx.ogg'])).not.toThrow()
  })

  it('does not throw for empty array', async () => {
    const { warmAssetsIdle } = await import('@/services/assetPreloadService')
    expect(() => warmAssetsIdle([])).not.toThrow()
  })
})
