import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent } from 'vue'
import { ROUTE_NAMES } from '@/app/config'
import ExplorerRescueGamePage from '@/features/explorer-rescue-run/ExplorerRescueGamePage.vue'
import type { ExplorerRescueRound } from '@/features/explorer-rescue-run/game/types'

const { loadExplorerRescueRoundMock } = vi.hoisted(() => {
  const minimalRound: ExplorerRescueRound = {
    explorerAnimalId: 'malayan-tiger',
    explorerName: 'Malayan Tiger',
    explorerVisualKey: 'malayan-tiger',
    clueTraits: [
      { id: 'habitat_forest', label: 'Forest', emoji: '🌳', iconPath: '/games/explorer-rescue/clues/habitat-forest-clue.webp' },
      { id: 'diet_carnivore', label: 'Carnivore', emoji: '🥩', iconPath: '/games/explorer-rescue/clues/diet-carnivore-clue.webp' },
      { id: 'group_mammal', label: 'Mammals', emoji: '🐾', iconPath: '/games/explorer-rescue/clues/group_mammal-clue.webp' },
    ],
    choices: [
      {
        animalId: 'sun-bear',
        name: 'Sun Bear',
        visualKey: 'sun-bear',
        choiceTraits: [],
        sharedTraitIds: [],
        isCorrect: true,
      },
      {
        animalId: 'c',
        name: 'C',
        visualKey: 'c',
        choiceTraits: [],
        sharedTraitIds: [],
        isCorrect: false,
      },
      {
        animalId: 'd',
        name: 'D',
        visualKey: 'd',
        choiceTraits: [],
        sharedTraitIds: [],
        isCorrect: false,
      },
    ],
    rewards: {
      firstCompletionLeafPoints: 50,
      replayLeafPoints: 5,
      restorationIncrease: 15,
      journalStamp: 'wild-match-finder',
    },
    matchInstruction: 'Pick the best match.',
  }

  return {
    loadExplorerRescueRoundMock: vi.fn(async () => minimalRound),
  }
})

vi.mock('@/features/explorer-rescue-run/data/explorerRescueRoundBuilder', () => ({
  loadExplorerRescueRound: (opts: Record<string, unknown>) => loadExplorerRescueRoundMock(opts),
  clearExplorerRescueAnimalCache: vi.fn(),
}))

vi.mock('@/features/explorer-rescue-run/game/createExplorerRescueGame', () => ({
  createExplorerRescueGame: vi.fn((config: { callbacks?: { onReady?: () => void } }) => {
    queueMicrotask(() => config.callbacks?.onReady?.())
  }),
  destroyExplorerRescueGame: vi.fn(),
  getExplorerRescueScene: vi.fn(() => null),
  refreshExplorerRescueGameLayout: vi.fn(),
}))

describe('ExplorerRescueGamePage — integrated gameplay top bar', () => {
  const SceneStub = defineComponent({
    name: 'BioWiraScenePageStub',
    props: {
      hideHeader: { type: Boolean, default: false },
    },
    template:
      '<div class="scene-stub" :data-test-hide-header="hideHeader ? \'true\' : \'false\'"><slot /></div>',
  })

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  async function mountPlayPage() {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/games/explorer-rescue-run/play',
          name: ROUTE_NAMES.explorerRescuePlay,
          component: ExplorerRescueGamePage,
        },
      ],
    })
    await router.push({ name: ROUTE_NAMES.explorerRescuePlay, query: { rescueAnimal: 'malayan-tiger' } })
    await router.isReady()
    const wrapper = mount(ExplorerRescueGamePage, {
      global: {
        plugins: [router],
        stubs: {
          BioWiraScenePage: SceneStub,
          AnimalIcon: true,
          GameplayIcon: true,
          PixelButton: true,
          MobileGameControls: true,
          RescueTraitBadge: true,
          RescueChoiceIcon: true,
          RescueChoiceTraitList: true,
          PixelLoadingState: true,
          PixelErrorState: true,
          Transition: false,
        },
      },
      attachTo: document.body,
    })
    await flushPromises()
    await flushPromises()
    return { wrapper, router }
  }

  it('renders stage, top bar, frame, and canvas; clue badges and points live in the top bar', async () => {
    const { wrapper } = await mountPlayPage()
    expect(wrapper.find('.game-page').exists()).toBe(true)
    expect(wrapper.find('.game-page__stage').exists()).toBe(true)
    expect(wrapper.find('.game-page__topbar').exists()).toBe(true)
    expect(wrapper.find('.game-page__frame').exists()).toBe(true)
    expect(wrapper.find('.game-page__canvas').exists()).toBe(true)

    const topbar = wrapper.find('.game-page__topbar')
    expect(topbar.find('.game-page__clue-badges').exists()).toBe(true)
    expect(topbar.find('.game-page__points-chip').exists()).toBe(true)
    expect(topbar.find('[aria-label="Collected clues"]').exists()).toBe(true)
    expect(wrapper.find('.game-page__topbar-section--rescue-animal').exists()).toBe(true)
    expect(wrapper.text()).toMatch(/Rescue Animal/i)
    expect(wrapper.text()).toMatch(/Larut Torrent Frog/)
    expect(wrapper.text()).toMatch(/Clues/)
    expect(wrapper.text()).toMatch(/\/3/)

    expect(wrapper.find('.game-page__mission-bar').exists()).toBe(false)
    wrapper.unmount()
  })

  it('sets hide-header on BioWiraScenePage immediately (wood ribbon hidden; immersive viewport fill)', async () => {
    const { wrapper } = await mountPlayPage()
    const stub = wrapper.getComponent(SceneStub)
    expect(stub.props('hideHeader')).toBe(true)
    wrapper.unmount()
  })
})
