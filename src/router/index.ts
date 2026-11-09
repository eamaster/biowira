import { createRouter, createWebHistory } from 'vue-router'
import { getActivePinia } from 'pinia'
import HomePage from '@/features/home/HomePage.vue'
import { appConfig, ROUTE_NAMES } from '@/app/config'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ── Session entry point ──────────────────────────────────────────────────
    {
      path: '/welcome',
      name: ROUTE_NAMES.welcome,
      component: () => import('@/features/welcome/WelcomePage.vue'),
      meta: { requiresNoSession: false, audioTheme: 'calm-jungle' },
    },

    // ── Main app routes (Epics 1–3) — unchanged ──────────────────────────────
    {
      path: '/',
      name: ROUTE_NAMES.home,
      component: HomePage,
      meta: { audioTheme: 'calm-jungle' },
    },
    {
      path: '/missions',
      name: ROUTE_NAMES.missions,
      component: () => import('@/features/missions/MissionsPage.vue'),
      meta: { audioTheme: 'calm-jungle' },
    },
    {
      path: '/missions/result',
      name: ROUTE_NAMES.missionResult,
      component: () => import('@/features/missions/MissionResultPage.vue'),
      meta: { audioTheme: 'calm-jungle' },
    },
    {
      path: '/discover',
      name: ROUTE_NAMES.discover,
      component: () => import('@/features/discover/DiscoverPage.vue'),
      meta: { audioTheme: 'calm-jungle' },
    },
    // Legacy redirect — old /facts links go to Discover instead of a 404.
    {
      path: '/facts',
      redirect: { name: ROUTE_NAMES.discover },
    },
    {
      path: '/games',
      name: ROUTE_NAMES.games,
      component: () => import('@/features/games/GamesPage.vue'),
      meta: { audioTheme: 'calm-jungle' },
    },
    {
      path: '/quiz',
      name: ROUTE_NAMES.quiz,
      component: () => import('@/features/quiz/QuizPage.vue'),
      meta: { audioTheme: 'calm-jungle' },
    },
    {
      path: '/quiz/result',
      name: ROUTE_NAMES.quizResult,
      component: () => import('@/features/quiz/QuizResultPage.vue'),
      meta: { audioTheme: 'calm-jungle' },
    },

    // ── Eco-Comics ────────────────────────────────────────────────────────────
    {
      path: '/games/eco-comics',
      name: ROUTE_NAMES.ecoComics,
      component: () => import('@/features/eco-comics/EcoComicsPage.vue'),
      meta: { audioTheme: 'calm-jungle' },
    },
    {
      path: '/games/eco-comics/story/:storyId',
      name: ROUTE_NAMES.ecoComicReader,
      component: () => import('@/features/eco-comics/EcoComicReaderPage.vue'),
      meta: { hideFooter: true, gameLayout: true, audioTheme: 'calm-jungle' },
    },

    // ── Game Journal ──────────────────────────────────────────────────────────
    {
      path: '/games/journal',
      name: ROUTE_NAMES.gameJournalMenu,
      component: () => import('@/features/game-journal/GameJournalMenuPage.vue'),
      meta: { audioTheme: 'calm-jungle' },
    },
    {
      path: '/games/journal/:categoryId',
      name: ROUTE_NAMES.gameJournalCategory,
      component: () => import('@/features/game-journal/GameJournalStampPage.vue'),
      meta: { audioTheme: 'calm-jungle' },
    },

    // ── Explorer Rescue Run ───────────────────────────────────────────────────
    {
      path: '/games/explorer-rescue-run',
      name: ROUTE_NAMES.explorerRescue,
      component: () => import('@/features/explorer-rescue-run/ExplorerRescueChapterPage.vue'),
      meta: { audioTheme: 'calm-jungle' },
    },
    {
      path: '/games/explorer-rescue-run/play',
      name: ROUTE_NAMES.explorerRescuePlay,
      component: () => import('@/features/explorer-rescue-run/ExplorerRescueGamePage.vue'),
      meta: { hideFooter: true, gameLayout: true, audioTheme: 'adventure-jungle' },
    },
    {
      path: '/games/explorer-rescue-run/result',
      name: ROUTE_NAMES.explorerRescueResult,
      component: () => import('@/features/explorer-rescue-run/ExplorerRescueResultPage.vue'),
      meta: { audioTheme: 'calm-jungle' },
    },
    {
      path: '/games/explorer-rescue-run/journal',
      name: ROUTE_NAMES.explorerRescueJournal,
      // Keep this route for backward compatibility (existing tests + bookmarks).
      // It still renders the original ExplorerRescueJournalPage.
      component: () => import('@/features/explorer-rescue-run/ExplorerRescueJournalPage.vue'),
      meta: { audioTheme: 'calm-jungle' },
    },

    // ── Catch-all ────────────────────────────────────────────────────────────
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

// ── Navigation guard ──────────────────────────────────────────────────────────
//
// Decision table:
//   1. sessionEnabled === false  → always allow (CI / test bypass)
//   2. Going to /welcome         → always allow
//   3. Session isReady + active  → allow
//   4. Session isReady + not active → redirect to /welcome
//   5. Session not ready (safety net only) → await readyPromise, then re-evaluate
//
// Because main.ts awaits bootstrapSession() BEFORE app.use(router), case 5
// should never occur in normal operation. The readyPromise guard is a safety
// net for environments where the router is installed before bootstrap.

router.beforeEach(async (to) => {
  // 1. Guard disabled
  if (!appConfig.sessionEnabled) return true

  // 2. Always allow the welcome route
  if (to.name === ROUTE_NAMES.welcome) return true

  // Lazily acquire the store once Pinia is active
  const pinia = getActivePinia()
  if (!pinia) return true // Pinia not up yet — allow (safe during SSR/test)

  const { useSessionStore } = await import('@/stores/sessionStore')
  const sessionStore = useSessionStore()

  // 5. Safety net: wait if bootstrap somehow hasn't finished
  if (!sessionStore.isReady) {
    await sessionStore.readyPromise
  }

  // 3. Active session — allow all routes
  if (sessionStore.hasActiveSession) return true

  // 4. No session — redirect to welcome
  return { name: ROUTE_NAMES.welcome }
})

export default router
