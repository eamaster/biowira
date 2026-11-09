/**
 * App Bootstrap Store
 *
 * Tracks the multi-phase loading sequence that plays on app startup:
 *   idle → session → assets → ready
 *
 * Used by InitialAppLoader.vue to render the full-screen splash screen,
 * and by main.ts to orchestrate the bootstrap pipeline.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ── Types ──────────────────────────────────────────────────────────────────────

export type BootstrapPhase = 'idle' | 'session' | 'assets' | 'ready'

// ── Constants ──────────────────────────────────────────────────────────────────

/** Minimum time (ms) the loader is shown, even if everything loads instantly. */
const MIN_DISPLAY_MS = 1200

/** How often the friendly message rotates (ms). */
const MESSAGE_INTERVAL_MS = 2200

const MESSAGES: readonly string[] = [
  'Waking up the animals\u2026',
  'Preparing the rainforest\u2026',
  'Packing your explorer bag\u2026',
  'Brushing the jungle leaves\u2026',
  'Shining the adventure lantern\u2026',
  'Calling the forest friends\u2026',
  'Setting up your base camp\u2026',
] as const

// ── Store ──────────────────────────────────────────────────────────────────────

export const useAppBootstrapStore = defineStore('appBootstrap', () => {
  // ── State ────────────────────────────────────────────────────────────────────

  const phase = ref<BootstrapPhase>('idle')

  /** Number of assets successfully loaded so far. */
  const _loaded = ref(0)

  /** Total number of assets to load (set by setProgress). */
  const _total = ref(0)

  /** Number of assets that failed to load. */
  const _failed = ref(0)

  /** Index into the MESSAGES array for the rotating friendly message. */
  const _messageIdx = ref(0)

  /** Timestamp (ms) when startBootstrap() was called — used to enforce MIN_DISPLAY_MS. */
  let _startedAt = 0

  /** Interval handle for the message rotation; cleared in complete(). */
  let _messageInterval: ReturnType<typeof setInterval> | null = null

  // ── Computed ─────────────────────────────────────────────────────────────────

  const isReady = computed(() => phase.value === 'ready')

  /**
   * Loading percentage (0–100).
   * - During 'session' phase: fixed 10 % so users see immediate progress.
   * - During 'assets' phase:  10 % base + up to 90 % from asset loading.
   * - During 'idle'/'ready':  0 / 100 respectively.
   */
  const percentage = computed<number>(() => {
    switch (phase.value) {
      case 'idle':
        return 0
      case 'session':
        return 10
      case 'assets': {
        if (_total.value === 0) return 10
        const assetProgress = (_loaded.value + _failed.value) / _total.value
        return Math.min(99, Math.round(10 + assetProgress * 89))
      }
      case 'ready':
        return 100
      default:
        return 0
    }
  })

  /** The current rotating friendly message shown beneath the progress bar. */
  const message = computed<string>(() => MESSAGES[_messageIdx.value])

  /** How many assets failed to load during the assets phase. */
  const failedCount = computed<number>(() => _failed.value)

  // ── Actions ──────────────────────────────────────────────────────────────────

  /**
   * Begin the bootstrap sequence.
   * Sets phase to 'session', records the start time, and starts the message rotation.
   * Called from main.ts immediately after pinia is active.
   */
  function startBootstrap(): void {
    _startedAt = Date.now()
    phase.value = 'session'
    _messageIdx.value = 0

    // Start rotating the friendly messages
    _messageInterval = setInterval(() => {
      _messageIdx.value = (_messageIdx.value + 1) % MESSAGES.length
    }, MESSAGE_INTERVAL_MS)
  }

  /**
   * Advance to the assets phase once the session bootstrap is done.
   * Called from main.ts after sessionStore.bootstrapSession() resolves.
   */
  function markAssetsPhase(): void {
    phase.value = 'assets'
  }

  /**
   * Update asset loading progress.
   * Called by the onProgress callback from preloadCriticalAssets().
   */
  function setProgress(loaded: number, total: number, failed: number): void {
    _loaded.value = loaded
    _total.value = total
    _failed.value = failed
  }

  /**
   * Finalize the bootstrap sequence.
   *
   * - Enforces MIN_DISPLAY_MS so the loader never flashes for < 1.2 s.
   * - Stops the message rotation interval.
   * - Sets phase to 'ready', which unmounts InitialAppLoader.
   */
  async function complete(): Promise<void> {
    const elapsed = Date.now() - _startedAt
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed)

    if (remaining > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, remaining))
    }

    if (_messageInterval !== null) {
      clearInterval(_messageInterval)
      _messageInterval = null
    }

    phase.value = 'ready'
  }

  // ── Expose ───────────────────────────────────────────────────────────────────

  return {
    phase,
    isReady,
    percentage,
    message,
    failedCount,
    startBootstrap,
    markAssetsPhase,
    setProgress,
    complete,
  }
})
