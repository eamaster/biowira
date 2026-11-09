import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent } from 'vue'

import { ROUTE_NAMES } from '@/app/config'
import QuizPage from '@/features/quiz/QuizPage.vue'
import QuizResultPage from '@/features/quiz/QuizResultPage.vue'
import { useQuizStore } from '@/stores/quizStore'
import MissionsPage from '@/features/missions/MissionsPage.vue'
import EcoComicsPage from '@/features/eco-comics/EcoComicsPage.vue'
import DiscoverPage from '@/features/discover/DiscoverPage.vue'
import ExplorerRescueChapterPage from '@/features/explorer-rescue-run/ExplorerRescueChapterPage.vue'
import ExplorerRescueResultPage from '@/features/explorer-rescue-run/ExplorerRescueResultPage.vue'
import ExplorerRescueJournalPage from '@/features/explorer-rescue-run/ExplorerRescueJournalPage.vue'
import BioWiraScenePage from '@/components/layout/BioWiraScenePage.vue'
import PixelAppShell from '@/components/layout/PixelAppShell.vue'
import PixelFooter from '@/components/layout/PixelFooter.vue'
import appRouter from '@/router/index'
import GamesPage from '@/features/games/GamesPage.vue'
import { BIOWIRA_SCENE_ASSETS } from '@/app/branding'

const Empty = defineComponent({ template: '<div />' })

/** Path segments for décor assets (stable under Vite public paths). */
const HOME_SCENE_ARROW_SEG = BIOWIRA_SCENE_ASSETS.arrowBoard.split('/').pop() ?? 'arrow'
const HOME_SCENE_FLOWER_SEG = BIOWIRA_SCENE_ASSETS.flowerPlant.split('/').pop() ?? 'flower'

async function mountWithRoute(
  component: Parameters<typeof mount>[0],
  path: string,
  name: string,
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path, name, component: Empty }],
  })
  await router.push(path)
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(component, {
    global: { plugins: [pinia, router] },
  })
}

describe('BioWira scene layout on main pages', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('QuizPage uses .scene-page and not PixelPageRibbon', async () => {
    const wrapper = await mountWithRoute(QuizPage, '/quiz', ROUTE_NAMES.quiz)
    for (let i = 0; i < 30; i++) {
      await flushPromises()
      if (wrapper.find('.scene-page').exists()) break
    }
    expect(wrapper.find('.scene-page').exists()).toBe(true)
    expect(wrapper.find('.pixel-page-ribbon').exists()).toBe(false)
    expect(wrapper.text()).toMatch(/Animal Quiz|Pick a Quiz|Loading quiz/i)
  })

  it('MissionsPage uses .scene-page and not PixelPageRibbon', async () => {
    const wrapper = await mountWithRoute(MissionsPage, '/missions', ROUTE_NAMES.missions)
    await flushPromises()
    expect(wrapper.find('.scene-page').exists()).toBe(true)
    expect(wrapper.find('.pixel-page-ribbon').exists()).toBe(false)
    expect(wrapper.text()).toMatch(/Nature Missions/i)
  })

  it('EcoComicsPage uses .scene-page and not PixelPageRibbon', async () => {
    const wrapper = await mountWithRoute(EcoComicsPage, '/games/eco-comics', ROUTE_NAMES.ecoComics)
    await flushPromises()
    expect(wrapper.find('.scene-page').exists()).toBe(true)
    expect(wrapper.find('.pixel-page-ribbon').exists()).toBe(false)
    expect(wrapper.text()).toMatch(/Eco-Comics/i)
  })

  it('GamesPage uses .scene-page and not PixelPageRibbon', async () => {
    const wrapper = await mountWithRoute(GamesPage, '/games', ROUTE_NAMES.games)
    await flushPromises()
    expect(wrapper.find('.scene-page').exists()).toBe(true)
    expect(wrapper.find('.pixel-page-ribbon').exists()).toBe(false)
    expect(wrapper.text()).toMatch(/Games Menu/i)
  })

  it('QuizPage uses compact scene density class', async () => {
    const wrapper = await mountWithRoute(QuizPage, '/quiz', ROUTE_NAMES.quiz)
    for (let i = 0; i < 35; i++) {
      await flushPromises()
      const scene = wrapper.find('.scene-page')
      if (scene.exists() && scene.classes().includes('scene-page--density-compact')) break
    }
    const scene = wrapper.find('.scene-page')
    expect(scene.exists()).toBe(true)
    expect(scene.classes()).toContain('scene-page--density-compact')
  })

  it('BioWiraScenePage renders rainforest corner décor when showDecor is true', () => {
    const wrapper = mount(BioWiraScenePage, {
      props: { title: 'Scene', showDecor: true },
      global: {
        stubs: { HomeWoodRibbon: true },
      },
    })
    expect(wrapper.find('.scene-page__decor-layer').exists()).toBe(true)
    const imgs = wrapper.findAll('.scene-page__decor')
    expect(imgs).toHaveLength(2)
    expect(imgs[0].attributes('src')).toContain(HOME_SCENE_ARROW_SEG)
    expect(imgs[1].attributes('src')).toContain(HOME_SCENE_FLOWER_SEG)
  })

  it('DiscoverPage uses .scene-page and not PixelPageRibbon', async () => {
    const wrapper = await mountWithRoute(DiscoverPage, '/discover', ROUTE_NAMES.discover)
    for (let i = 0; i < 40; i++) {
      await flushPromises()
      if (wrapper.find('.scene-page').exists()) break
    }
    expect(wrapper.find('.scene-page').exists()).toBe(true)
    expect(wrapper.find('.pixel-page-ribbon').exists()).toBe(false)
    expect(wrapper.text()).toMatch(/Discover Animals/i)
  })

  it('ExplorerRescueChapterPage uses .scene-page and not PixelPageRibbon', async () => {
    const wrapper = await mountWithRoute(
      ExplorerRescueChapterPage,
      '/games/explorer-rescue-run',
      ROUTE_NAMES.explorerRescue,
    )
    await flushPromises()
    expect(wrapper.find('.scene-page').exists()).toBe(true)
    expect(wrapper.find('.pixel-page-ribbon').exists()).toBe(false)
    expect(wrapper.text()).toMatch(/Explorer Rescue Run/i)
  })

  it('QuizResultPage uses .scene-page and not PixelPageRibbon', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/quiz/result', name: ROUTE_NAMES.quizResult, component: Empty }],
    })
    await router.push('/quiz/result')
    const pinia = createPinia()
    setActivePinia(pinia)
    const quizStore = useQuizStore()
    quizStore.lastResult = {
      quizId: 'q-test',
      score: 5,
      totalQuestions: 8,
      pointsEarned: 100,
      attempts: [],
      completedAt: new Date(),
    }
    const wrapper = mount(QuizResultPage, { global: { plugins: [pinia, router] } })
    for (let i = 0; i < 30; i++) {
      await flushPromises()
      if (wrapper.find('.scene-page').exists()) break
    }
    expect(wrapper.find('.scene-page').exists()).toBe(true)
    expect(wrapper.find('.pixel-page-ribbon').exists()).toBe(false)
    expect(wrapper.text()).toMatch(/Quiz Complete/i)
  })

  it('ExplorerRescueJournalPage uses .scene-page and not PixelPageRibbon', async () => {
    const wrapper = await mountWithRoute(
      ExplorerRescueJournalPage,
      '/games/explorer-rescue-run/journal',
      ROUTE_NAMES.explorerRescueJournal,
    )
    await flushPromises()
    expect(wrapper.find('.scene-page').exists()).toBe(true)
    expect(wrapper.find('.pixel-page-ribbon').exists()).toBe(false)
    expect(wrapper.text()).toMatch(/Rescue Journal/i)
    expect(wrapper.find('[data-testid="explorer-rescue-journal-page"]').exists()).toBe(true)
  })

  it('ExplorerRescueResultPage uses .scene-page and not PixelPageRibbon', async () => {
    const wrapper = await mountWithRoute(
      ExplorerRescueResultPage,
      '/games/explorer-rescue-run/result',
      ROUTE_NAMES.explorerRescueResult,
    )
    await flushPromises()
    expect(wrapper.find('.scene-page').exists()).toBe(true)
    expect(wrapper.find('.pixel-page-ribbon').exists()).toBe(false)
    expect(wrapper.text()).toMatch(/Your Wild Match!/i)
  })
})

describe('Explorer Rescue play route meta, density, and footer shell', () => {
  it('/games/explorer-rescue-run/play has hideFooter and gameLayout meta', () => {
    const r = appRouter.resolve({
      name: ROUTE_NAMES.explorerRescuePlay,
    })
    expect(r.meta.hideFooter).toBe(true)
    expect(r.meta.gameLayout).toBe(true)
  })

  it('/games/eco-comics/story/:storyId has hideFooter and gameLayout meta', () => {
    const r = appRouter.resolve({
      name: ROUTE_NAMES.ecoComicReader,
      params: { storyId: 'secret-wooden-crate' },
    })
    expect(r.meta.hideFooter).toBe(true)
    expect(r.meta.gameLayout).toBe(true)
  })

  it('normal content routes do not hide footer by default', () => {
    for (const name of [
      ROUTE_NAMES.home,
      ROUTE_NAMES.discover,
      ROUTE_NAMES.games,
      ROUTE_NAMES.quiz,
      ROUTE_NAMES.ecoComics,
      ROUTE_NAMES.explorerRescue,
      ROUTE_NAMES.explorerRescueResult,
    ] as const) {
      const r = appRouter.resolve({ name })
      expect(r.meta.hideFooter).not.toBe(true)
    }
  })

  it('BioWiraScenePage adds scene-page--density-game when density is game', () => {
    const wrapper = mount(BioWiraScenePage, {
      props: {
        title: 'Game',
        tone: 'play',
        contentWidth: 'wide',
        density: 'game',
        showDecor: false,
      },
    })
    expect(wrapper.classes()).toContain('scene-page--density-game')
    expect(wrapper.classes()).toContain('scene-page--play')
  })

  it('BioWiraScenePage adds scene-page--game when contentWidth is game', () => {
    const wrapper = mount(BioWiraScenePage, {
      props: {
        title: 'Play',
        tone: 'play',
        contentWidth: 'game',
        showDecor: false,
      },
    })
    expect(wrapper.classes()).toContain('scene-page--game')
    expect(wrapper.classes()).toContain('scene-page--play')
  })

  it('BioWiraScenePage uses scene-page--density-normal by default', () => {
    const wrapper = mount(BioWiraScenePage, {
      props: { title: 'Page', showDecor: false },
    })
    expect(wrapper.classes()).toContain('scene-page--density-normal')
  })

  it('PixelAppShell hides footer when route.meta.hideFooter is true and toggles game-layout class', async () => {
    const testRouter = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: Empty },
        { path: '/x', name: 'x', component: Empty, meta: { hideFooter: true, gameLayout: true } },
      ],
    })
    await testRouter.push('/x')
    await testRouter.isReady()
    const wrapper = mount(PixelAppShell, {
      slots: { default: '<div /><div />' },
      global: { plugins: [testRouter] },
    })
    expect(wrapper.findComponent(PixelFooter).exists()).toBe(false)
    expect(wrapper.find('.app-shell__main--game-layout').exists()).toBe(true)

    await testRouter.push('/')
    await flushPromises()
    expect(wrapper.findComponent(PixelFooter).exists()).toBe(true)
    expect(wrapper.find('.app-shell__main--game-layout').exists()).toBe(false)
  })
})