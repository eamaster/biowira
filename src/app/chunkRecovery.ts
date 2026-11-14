import type { Router } from 'vue-router'

const RELOAD_STORAGE_KEY = 'biowira:chunk_reload_ts'
const RELOAD_COOLDOWN_MS = 15_000

const CHUNK_ERROR_PATTERNS = [
  'failed to fetch dynamically imported module',
  'importing a module script failed',
  'error loading dynamically imported module',
  'loading chunk',
  'loading css chunk',
  'strict mime type checking is enforced for module scripts',
]

/** Identifies stale dynamic-import / module MIME errors caused by deploying newer hashed assets. */
export function isChunkLoadError(err: unknown): boolean {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : ''
  const normalized = message.toLowerCase()
  if (!normalized) return false
  if (err instanceof Error && err.name === 'ChunkLoadError') return true
  return CHUNK_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern))
}

/**
 * Triggers a single guarded reload so clients stuck on an older bundle/SW fetch fresh HTML and chunk manifests.
 * Returns true if a reload was triggered, false if skipped due to cooldown or SSR environment.
 */
export function reloadOnceForFreshAssets(
  now = Date.now(),
  reloadFn: () => void = () => window.location.reload(),
): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.sessionStorage.getItem(RELOAD_STORAGE_KEY)
    const last = raw ? Number(raw) : 0
    if (Number.isFinite(last) && last > 0 && now - last < RELOAD_COOLDOWN_MS) {
      return false
    }
    window.sessionStorage.setItem(RELOAD_STORAGE_KEY, String(now))
  } catch {
    // Ignore storage access errors (private browsing / restricted storage)
  }
  reloadFn()
  return true
}

/**
 * Installs stale-chunk and service-worker update recovery across Vite preload errors,
 * Vue Router async route errors, and active Service Worker controller upgrades.
 */
export function installChunkAndSwRecovery(router: Router): () => void {
  if (typeof window === 'undefined') return () => {}

  const onPreloadError = (event: Event) => {
    event.preventDefault()
    reloadOnceForFreshAssets()
  }

  window.addEventListener('vite:preloadError', onPreloadError)

  const stopRouterError = router.onError((error) => {
    if (isChunkLoadError(error)) {
      reloadOnceForFreshAssets()
    }
  })

  let cleanupSw: (() => void) | undefined
  if ('serviceWorker' in navigator) {
    const sw = navigator.serviceWorker
    const hadController = Boolean(sw.controller)
    const onControllerChange = () => {
      if (hadController) {
        reloadOnceForFreshAssets()
      }
    }
    sw.addEventListener('controllerchange', onControllerChange)
    void sw
      .getRegistration()
      .then((reg) => reg?.update())
      .catch(() => {})
    cleanupSw = () => sw.removeEventListener('controllerchange', onControllerChange)
  }

  return () => {
    window.removeEventListener('vite:preloadError', onPreloadError)
    stopRouterError()
    cleanupSw?.()
  }
}
