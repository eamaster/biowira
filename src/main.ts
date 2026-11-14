import '@/styles/global.scss'
import '@fortawesome/fontawesome-free/css/all.min.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { installChunkAndSwRecovery } from '@/app/chunkRecovery'
import { useSessionStore } from '@/stores/sessionStore'
import { useAppBootstrapStore } from '@/stores/appBootstrapStore'

async function init() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  // ── Create stores BEFORE mounting ──────────────────────────────────────────
  // Pinia must be active (app.use(pinia)) before useStore() calls.
  // Creating stores here ensures App.vue renders with correct initial state
  // (InitialAppLoader visible) from the very first paint.
  const sessionStore = useSessionStore()
  const bootstrapStore = useAppBootstrapStore()

  // Begin the loading sequence — App.vue will show InitialAppLoader now.
  bootstrapStore.startBootstrap()

  // ── Install router BEFORE mount ────────────────────────────────────────────
  // The beforeEach guard awaits sessionStore.readyPromise, so even though we
  // mount before bootstrapSession() resolves, the router safely holds
  // navigation until the session is ready.
  app.use(router)
  installChunkAndSwRecovery(router)

  // ── Mount immediately ──────────────────────────────────────────────────────
  // InitialAppLoader is now visible to the user while session + assets load.
  // All heavy bootstrap work happens AFTER this point — not before first paint.
  app.mount('#app')

  // ── Phase 1: Session bootstrap ─────────────────────────────────────────────
  // Resolves readyPromise → router guard can proceed with correct session state.
  await sessionStore.bootstrapSession()

  // ── Phase 2: Critical asset preload ────────────────────────────────────────
  bootstrapStore.markAssetsPhase()

  // Respect Save-Data and very slow connections — skip preloading to get the
  // user into the app as fast as possible on constrained networks.
  type NavWithConnection = Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string }
  }
  const conn = (navigator as NavWithConnection).connection
  const isSlowOrSaveData =
    conn?.saveData === true || ['slow-2g', '2g'].includes(conn?.effectiveType ?? '')

  if (!isSlowOrSaveData) {
    const { getCriticalAssetUrls, preloadCriticalAssets, getWarmAssetUrls, warmAssetsIdle } =
      await import('@/services/assetPreloadService')

    const criticalUrls = getCriticalAssetUrls()
    await preloadCriticalAssets(criticalUrls, 8000, (p) => {
      bootstrapStore.setProgress(p.loaded, p.total, p.failed)
    })

    // ── Phase 3: Complete (enforces minimum display time) ──────────────────
    await bootstrapStore.complete()

    // Warm non-critical assets in the background after the app is interactive.
    // warmAssetsIdle() uses requestIdleCallback so it never competes with user input.
    const warmUrls = getWarmAssetUrls()
    warmAssetsIdle(warmUrls)
  } else {
    // Slow/constrained connection: skip heavy preloading, go straight to ready.
    await bootstrapStore.complete()
  }
}

init()
