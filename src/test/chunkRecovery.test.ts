import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  installChunkAndSwRecovery,
  isChunkLoadError,
  reloadOnceForFreshAssets,
} from '@/app/chunkRecovery'

describe('chunkRecovery', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('detects dynamic import and strict MIME module errors', () => {
    expect(
      isChunkLoadError(
        new TypeError(
          'Failed to fetch dynamically imported module: https://biowira.pages.dev/assets/QuizPage-FftlZcBX.js',
        ),
      ),
    ).toBe(true)
    expect(
      isChunkLoadError(
        new Error(
          'Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html". Strict MIME type checking is enforced for module scripts per HTML spec.',
        ),
      ),
    ).toBe(true)
    expect(isChunkLoadError(new Error('Network timeout'))).toBe(false)
  })

  it('reloads once and enforces cooldown against redirect/reload loops', () => {
    const reload = vi.fn()
    expect(reloadOnceForFreshAssets(10_000, reload)).toBe(true)
    expect(reloadOnceForFreshAssets(12_000, reload)).toBe(false)
    expect(reloadOnceForFreshAssets(30_000, reload)).toBe(true)
    expect(reload).toHaveBeenCalledTimes(2)
  })

  it('prevents default and reloads on vite:preloadError', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    })
    const reloadSpy = vi.fn()
    vi.spyOn(window.sessionStorage, 'getItem').mockReturnValue(null)
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: reloadSpy },
    })

    const cleanup = installChunkAndSwRecovery(router)
    const event = new Event('vite:preloadError', { cancelable: true })
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(reloadSpy).toHaveBeenCalledTimes(1)

    cleanup()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })
})
