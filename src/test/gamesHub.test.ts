import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, getActivePinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent } from 'vue'
import PixelTopNav from '@/components/layout/PixelTopNav.vue'
import GamesPage from '@/features/games/GamesPage.vue'
import HomePage from '@/features/home/HomePage.vue'
import { ROUTE_NAMES } from '@/app/config'
import { HOME_PAGE_ASSETS } from '@/app/branding'

const EmptyView = defineComponent({ template: '<div />' })

/** Lightweight routes so `router.isReady()` never pulls in the full Home/Discover bundles. */
function buildLightRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: ROUTE_NAMES.home, component: EmptyView },
      { path: '/games', name: ROUTE_NAMES.games, component: EmptyView },
      { path: '/quiz', name: ROUTE_NAMES.quiz, component: EmptyView },
      { path: '/missions', name: ROUTE_NAMES.missions, component: EmptyView },
      { path: '/discover', name: ROUTE_NAMES.discover, component: EmptyView },
      { path: '/games/eco-comics', name: ROUTE_NAMES.ecoComics, component: EmptyView },
      { path: '/games/explorer-rescue-run', name: ROUTE_NAMES.explorerRescue, component: EmptyView },
      { path: '/games/journal', name: ROUTE_NAMES.gameJournalMenu, component: EmptyView },
    ],
  })
}

function buildGamesPageRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: ROUTE_NAMES.home, component: EmptyView },
      { path: '/games', name: ROUTE_NAMES.games, component: GamesPage },
      { path: '/quiz', name: ROUTE_NAMES.quiz, component: EmptyView },
      { path: '/missions', name: ROUTE_NAMES.missions, component: EmptyView },
      { path: '/discover', name: ROUTE_NAMES.discover, component: EmptyView },
      { path: '/games/eco-comics', name: ROUTE_NAMES.ecoComics, component: EmptyView },
      { path: '/games/explorer-rescue-run', name: ROUTE_NAMES.explorerRescue, component: EmptyView },
      { path: '/games/journal', name: ROUTE_NAMES.gameJournalMenu, component: EmptyView },
    ],
  })
}

describe('Games hub navigation', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('PixelTopNav shows Home, Discover, Quiz, Games nav items', () => {
    const pinia = getActivePinia()!
    const router = buildLightRouter()
    const wrapper = mount(PixelTopNav, {
      global: {
        plugins: [pinia, router],
        stubs: { SwitchExplorerModal: true },
      },
    })
    const labels = wrapper.findAll('.top-nav__link-label').map((w) => w.text())
    expect(labels).toContain('Home')
    expect(labels).toContain('Discover')
    expect(labels).toContain('Quiz')
    expect(labels).toContain('Games')
    expect(labels).not.toContain('Fun Facts')
    const gamesLink = wrapper.findAll('a').find((a) => a.text().includes('Games'))
    expect(gamesLink).toBeDefined()
    expect(gamesLink!.attributes('href')).toMatch(/games/)
  })

  it('GamesPage shows Nature Missions, Explorer Rescue Run, and Eco-Comics — not Animal Quiz', async () => {
    const router = buildGamesPageRouter()
    await router.push('/games')
    const wrapper = mount(GamesPage, {
      global: { plugins: [createPinia(), router] },
    })
    expect(wrapper.text()).toContain('Games Menu')
    expect(wrapper.text()).not.toContain('Animal Quiz')
    expect(wrapper.text()).toContain('Nature Missions')
    expect(wrapper.text()).toContain('Explorer Rescue Run')
    expect(wrapper.text()).toContain('Eco-Comics')
    expect(wrapper.find('.scene-page').exists()).toBe(true)
    expect(wrapper.find('.pixel-page-ribbon').exists()).toBe(false)
  })

  it('GamesPage has 3 cards: Missions, Rescue Run, Eco-Comics', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = buildGamesPageRouter()
    const pushSpy = vi.spyOn(router, 'push')
    await router.push({ name: ROUTE_NAMES.games })
    const wrapper = mount(GamesPage, { global: { plugins: [pinia, router] } })

    const menuCards = wrapper.findAll('[data-testid^="games-menu-card-"]')
    expect(menuCards).toHaveLength(3)

    const missionCard = menuCards.find((w) => w.text().includes('Nature Missions'))
    expect(missionCard).toBeDefined()
    await missionCard!.trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({ name: ROUTE_NAMES.missions })

    const rescueCard = menuCards.find((w) => w.text().includes('Explorer Rescue Run'))
    expect(rescueCard).toBeDefined()
    await rescueCard!.trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({ name: ROUTE_NAMES.explorerRescue })

    const comicsCard = menuCards.find((w) => w.text().includes('Eco-Comics'))
    expect(comicsCard).toBeDefined()
    await comicsCard!.trigger('click')
    expect(pushSpy).toHaveBeenLastCalledWith({ name: ROUTE_NAMES.ecoComics })

    pushSpy.mockRestore()
  })

  it('GamesPage uses WebP feature card panels instead of old CSS action cards', async () => {
    const router = buildGamesPageRouter()
    await router.push('/games')
    const wrapper = mount(GamesPage, {
      global: { plugins: [createPinia(), router] },
    })

    expect(wrapper.findAll('[data-testid^="games-menu-card-"]')).toHaveLength(3)
    expect(wrapper.find('.action-card').exists()).toBe(false)

    const comicsCard = wrapper.find('[data-testid="games-menu-card-comics"]')
    expect(comicsCard.exists()).toBe(true)
    expect(comicsCard.classes()).toContain('hfc--games')
    expect(comicsCard.find('.hfc__btn').exists()).toBe(true)
    expect(comicsCard.find('.hfc__icon-img').exists()).toBe(true)

    // No quiz card in games menu
    expect(wrapper.find('[data-testid="games-menu-card-quiz"]').exists()).toBe(false)
  })

  it('GamesPage shows Open Journal Book CTA button below the 3 cards', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = buildGamesPageRouter()
    const pushSpy = vi.spyOn(router, 'push')
    await router.push({ name: ROUTE_NAMES.games })
    const wrapper = mount(GamesPage, { global: { plugins: [pinia, router] } })

    // The 3 game cards must still be present
    expect(wrapper.findAll('[data-testid^="games-menu-card-"]')).toHaveLength(3)

    // The journal CTA must be present and separate from game cards
    const journalCta = wrapper.find('[data-testid="games-journal-cta"]')
    expect(journalCta.exists()).toBe(true)

    const openJournalBtn = wrapper.find('[data-testid="games-open-journal-btn"]')
    expect(openJournalBtn.exists()).toBe(true)
    expect(openJournalBtn.text()).toContain('Open Journal Book')

    await openJournalBtn.trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({ name: ROUTE_NAMES.gameJournalMenu })

    pushSpy.mockRestore()
  })

  it('HomePage renders five homepage feature cards with Eco-Comics replacing Fun Facts', async () => {
    const pinia = getActivePinia()!
    const router = buildLightRouter()
    await router.push('/')
    const wrapper = mount(HomePage, {
      global: {
        plugins: [pinia, router],
        stubs: {
          HomeHeroBanner: { template: '<div class="stub-hero" />' },
          HomeWoodRibbon: { template: '<div class="stub-ribbon" />' },
          ContinueLearningCard: true,
          SharedProgressPanel: true,
          SwitchExplorerModal: true,
        },
      },
    })
    expect(wrapper.findAll('[data-testid^="home-feature-card-"]')).toHaveLength(5)
    expect(wrapper.text()).toContain('Discover Animals')
    expect(wrapper.text()).not.toContain('Popular Fun Facts')
    expect(wrapper.text()).toContain('Eco-Comics')
    expect(wrapper.text()).toContain('Take Animal Quiz')
    expect(wrapper.text()).toContain('Nature Missions')
    expect(wrapper.text()).toContain('Explorer Rescue Run')

    const root = wrapper.find('.home-page').element as HTMLElement
    expect(root.style.getPropertyValue('--home-scene-bg').trim()).toBe('')
    /** Scenic urls live in stylesheet (`_home_scene_paths.scss`), not inline (avoids loading unused tiers). */
    expect(root.style.getPropertyValue('--home-scene-bg-mobile').trim()).toBe('')
    expect(root.style.getPropertyValue('--dashboard-panel-bg')).toContain(
      HOME_PAGE_ASSETS.dashboard.progressPanel,
    )
  })
})
