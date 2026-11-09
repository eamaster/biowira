// ============================================================
// Game Journal — Vitest tests
// Covers: catalog, store, routing, eco-comic, journal pages
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent } from 'vue'
import { ROUTE_NAMES, STORAGE_KEYS } from '@/app/config'
import type { GameJournalState } from '@/domain/gameJournal'
import { storageService } from '@/services/storageService'
import {
  GAME_JOURNAL_STAMP_CATALOG,
  GAME_JOURNAL_CATEGORIES,
  TOTAL_AVAILABLE_STAMPS,
  getStampById,
  getStampsByCategory,
  getStampsForJournalMenuTally,
} from '@/features/game-journal/data/gameJournalCatalog'
import { useGameJournalStore } from '@/stores/gameJournalStore'
import {
  getStoryById,
  ECO_COMIC_COMING_SOON_COUNT,
} from '@/features/eco-comics/data/ecoComicStoryCatalog'
import {
  SECRET_WOODEN_CRATE_ASSETS,
  getEcoComicWarmAssetUrls,
  getSecretWoodenCrateSceneUrls,
} from '@/features/eco-comics/data/ecoComicAssetRegistry'
import GameJournalMenuPage from '@/features/game-journal/GameJournalMenuPage.vue'
import { GAME_JOURNAL_ASSETS } from '@/features/game-journal/data/gameJournalAssetRegistry'
import GameJournalStampPage from '@/features/game-journal/GameJournalStampPage.vue'
import JournalEmptyNotice from '@/features/game-journal/components/JournalEmptyNotice.vue'
import { EXPLORER_RESCUE_RUN_CATALOG } from '@/features/explorer-rescue-run/data/explorerRescueRunCatalog'
import { NATURE_MISSION_JOURNAL_MENU_STAMP_IDS } from '@/features/game-journal/data/journalMissionMapping'

// ── Mock storageService ───────────────────────────────────────────────────────

vi.mock('@/services/storageService', () => ({
  storageService: {
    get: vi.fn((key: string) => {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (!parsed || parsed.v !== 1) return null
        return parsed.data
      } catch {
        return null
      }
    }),
    set: vi.fn((key: string, value: unknown) => {
      localStorage.setItem(key, JSON.stringify({ v: 1, data: value }))
    }),
    remove: vi.fn((key: string) => localStorage.removeItem(key)),
    clearKeys: vi.fn(),
  },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildJournalRouter() {
  const Empty = defineComponent({ template: '<div />' })
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/games', name: ROUTE_NAMES.games, component: Empty },
      { path: '/games/journal', name: ROUTE_NAMES.gameJournalMenu, component: GameJournalMenuPage },
      { path: '/games/journal/:categoryId', name: ROUTE_NAMES.gameJournalCategory, component: GameJournalStampPage },
    ],
  })
}

// ── gameJournalCatalog ────────────────────────────────────────────────────────

describe('gameJournalCatalog', () => {
  it('contains stamps for all three categories', () => {
    const categoryIds = GAME_JOURNAL_STAMP_CATALOG.map((s) => s.categoryId)
    expect(categoryIds).toContain('nature-mission')
    expect(categoryIds).toContain('eco-comic')
    expect(categoryIds).toContain('explorer-rescue-run')
  })

  it('has nature-mission-helper stamp (non-menu tally)', () => {
    const stamp = getStampById('nature-mission-helper')
    expect(stamp).toBeDefined()
    expect(stamp?.categoryId).toBe('nature-mission')
    expect(stamp?.availableForRestoration).toBe(true)
    expect(stamp?.journalMenuProgress).toBe(false)
  })

  it('nature mission menu chip uses three featured animal stamps only', () => {
    const menu = getStampsForJournalMenuTally('nature-mission')
    expect(menu.map((s) => s.stampId).sort()).toEqual(
      [...NATURE_MISSION_JOURNAL_MENU_STAMP_IDS].sort(),
    )
  })

  it('has wild-match-finder stamp compatible with Explorer Rescue journal stamp key', () => {
    const stamp = getStampById('wild-match-finder')
    expect(stamp).toBeDefined()
    expect(stamp?.categoryId).toBe('explorer-rescue-run')
    expect(stamp?.availableForRestoration).toBe(true)
  })

  it('explorer rescue journal stamps match playable runs (menu stamp denominator)', () => {
    const stampIds = new Set(getStampsByCategory('explorer-rescue-run').map((s) => s.stampId))
    for (const run of EXPLORER_RESCUE_RUN_CATALOG) {
      expect(stampIds.has(run.journalStampId)).toBe(true)
    }
    expect(stampIds.size).toBe(EXPLORER_RESCUE_RUN_CATALOG.length)
  })

  it('has three Eco-Comic ending stamps', () => {
    const ecoStamps = getStampsByCategory('eco-comic')
    expect(ecoStamps).toHaveLength(3)
  })

  it('family-team-hero stamp has +50 leafPoints and call-a-parent endingId', () => {
    const stamp = getStampById('family-team-hero')
    expect(stamp?.leafPoints).toBe(50)
    expect(stamp?.endingId).toBe('call-a-parent')
    expect(stamp?.storyId).toBe('secret-wooden-crate')
  })

  it('pangolin-guardian stamp has +30 leafPoints and contact-wildlife-dept endingId', () => {
    const stamp = getStampById('pangolin-guardian')
    expect(stamp?.leafPoints).toBe(30)
    expect(stamp?.endingId).toBe('contact-wildlife-dept')
  })

  it('wildlife-secret-agent stamp has +80 leafPoints and photograph-and-report endingId', () => {
    const stamp = getStampById('wildlife-secret-agent')
    expect(stamp?.leafPoints).toBe(80)
    expect(stamp?.endingId).toBe('photograph-and-report')
  })

  it('all stamps with availableForRestoration=true count toward TOTAL_AVAILABLE_STAMPS', () => {
    const available = GAME_JOURNAL_STAMP_CATALOG.filter((s) => s.availableForRestoration)
    expect(TOTAL_AVAILABLE_STAMPS).toBe(available.length)
    expect(TOTAL_AVAILABLE_STAMPS).toBeGreaterThan(0)
  })

  it('GAME_JOURNAL_CATEGORIES has entries for all 3 category IDs', () => {
    const ids = GAME_JOURNAL_CATEGORIES.map((c) => c.id)
    expect(ids).toContain('nature-mission')
    expect(ids).toContain('eco-comic')
    expect(ids).toContain('explorer-rescue-run')
  })
})

// ── gameJournalStore ──────────────────────────────────────────────────────────

describe('gameJournalStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('loads empty state safely when no stored data', () => {
    const store = useGameJournalStore()
    expect(store.unlockedStampIds).toEqual([])
    expect(store.unlockedStampCount).toBe(0)
    expect(store.rainforestRestoredPercent).toBe(0)
    expect(store.totalAvailableStampCount).toBe(TOTAL_AVAILABLE_STAMPS)
  })

  it('records a Nature Mission completion', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    const record = store.recordGameCompletion({
      categoryId: 'nature-mission',
      sourceId: 'mission-123',
      title: 'Tiger Territory Walk',
      description: 'You patrolled with the tiger path!',
      leafPointsEarned: 30,
      stampId: 'mission-tiger-territory',
    })
    expect(record.categoryId).toBe('nature-mission')
    expect(record.stampId).toBe('mission-tiger-territory')
    expect(store.hasRecords('nature-mission')).toBe(true)
    expect(store.unlockedStampIds).toContain('mission-tiger-territory')
  })

  it('records an Explorer Rescue Run completion', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    store.recordGameCompletion({
      categoryId: 'explorer-rescue-run',
      sourceId: 'malayan-tiger',
      title: 'Malayan Tiger Wild Match',
      description: 'Found the Wild Match!',
      leafPointsEarned: 50,
      stampId: 'wild-match-finder',
      metadata: {
        rescueAnimalName: 'Malayan Tiger',
        wildMatchName: 'Sun Bear',
        isFirstCompletion: true,
      },
    })
    expect(store.hasRecords('explorer-rescue-run')).toBe(true)
    expect(store.unlockedStampIds).toContain('wild-match-finder')
  })

  it('records an Eco-Comic completion', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    store.recordGameCompletion({
      categoryId: 'eco-comic',
      sourceId: 'secret-wooden-crate_photograph-and-report',
      title: 'The Secret in the Wooden Crate',
      description: 'Completed the Wildlife Secret Agent ending.',
      leafPointsEarned: 80,
      stampId: 'wildlife-secret-agent',
      metadata: {
        storyId: 'secret-wooden-crate',
        endingId: 'photograph-and-report',
      },
    })
    expect(store.hasRecords('eco-comic')).toBe(true)
    expect(store.unlockedStampIds).toContain('wildlife-secret-agent')
  })

  it('deduplicates unlocked stamps when same stamp recorded twice', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    store.recordGameCompletion({
      categoryId: 'nature-mission',
      sourceId: 'mission-1',
      title: 'Mission 1',
      description: 'desc',
      leafPointsEarned: 20,
      stampId: 'mission-tiger-territory',
    })
    store.recordGameCompletion({
      categoryId: 'nature-mission',
      sourceId: 'mission-2',
      title: 'Mission 2 replay',
      description: 'desc',
      leafPointsEarned: 20,
      stampId: 'mission-tiger-territory',
    })
    expect(store.unlockedStampIds.filter((id) => id === 'mission-tiger-territory')).toHaveLength(1)
  })

  it('does not increase restoration when same stamp is re-recorded', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    store.recordGameCompletion({
      categoryId: 'nature-mission',
      sourceId: 'm1',
      title: 'Mission',
      description: 'd',
      leafPointsEarned: 20,
      stampId: 'mission-tiger-territory',
    })
    const after1 = store.rainforestRestoredPercent
    store.recordGameCompletion({
      categoryId: 'nature-mission',
      sourceId: 'm2',
      title: 'Mission replay',
      description: 'd',
      leafPointsEarned: 20,
      stampId: 'mission-tiger-territory',
    })
    expect(store.rainforestRestoredPercent).toBe(after1)
  })

  it('computes rainforestRestoredPercent from unlocked/available stamp catalog', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')

    // Start at 0
    expect(store.rainforestRestoredPercent).toBe(0)

    // Unlock 1 stamp
    store.recordGameCompletion({
      categoryId: 'nature-mission',
      sourceId: 'm1',
      title: 'Mission',
      description: 'd',
      leafPointsEarned: 20,
      stampId: 'mission-tiger-territory',
    })

    const expected1 = Math.round((1 / TOTAL_AVAILABLE_STAMPS) * 100)
    expect(store.rainforestRestoredPercent).toBe(expected1)

    // Unlock a second stamp
    store.recordGameCompletion({
      categoryId: 'explorer-rescue-run',
      sourceId: 'tiger',
      title: 'Rescue',
      description: 'd',
      leafPointsEarned: 50,
      stampId: 'wild-match-finder',
    })

    const expected2 = Math.round((2 / TOTAL_AVAILABLE_STAMPS) * 100)
    expect(store.rainforestRestoredPercent).toBe(expected2)
  })

  it('totalAvailableStampCount equals TOTAL_AVAILABLE_STAMPS from catalog', () => {
    const store = useGameJournalStore()
    expect(store.totalAvailableStampCount).toBe(TOTAL_AVAILABLE_STAMPS)
  })

  it('hasRecords returns false for category with no completions', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    expect(store.hasRecords('eco-comic')).toBe(false)
    expect(store.hasRecords('nature-mission')).toBe(false)
  })

  it('recordsByCategory returns records newest-first', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    store.recordGameCompletion({
      categoryId: 'eco-comic', sourceId: 'a', title: 'A', description: 'd',
      leafPointsEarned: 10, stampId: 'family-team-hero',
    })
    store.recordGameCompletion({
      categoryId: 'eco-comic', sourceId: 'b', title: 'B', description: 'd',
      leafPointsEarned: 10, stampId: 'pangolin-guardian',
    })
    const records = store.recordsByCategory('eco-comic')
    expect(records).toHaveLength(2)
    // Newest first — second recorded should appear first
    expect(records[0]!.sourceId).toBe('b')
  })

  it('categoryStampDefinitions returns stamps with locked/unlocked state', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    store.recordGameCompletion({
      categoryId: 'eco-comic', sourceId: 'a', title: 'A', description: 'd',
      leafPointsEarned: 80, stampId: 'wildlife-secret-agent',
    })
    const stamps = store.categoryStampDefinitions('eco-comic')
    const agentStamp = stamps.find((s) => s.stampId === 'wildlife-secret-agent')
    const heroStamp = stamps.find((s) => s.stampId === 'family-team-hero')
    expect(agentStamp?.isUnlocked).toBe(true)
    expect(heroStamp?.isUnlocked).toBe(false)
  })
})

// ── Eco-Comic catalog ─────────────────────────────────────────────────────────

describe('ecoComicStoryCatalog', () => {
  it('The Secret in the Wooden Crate story is available', () => {
    const story = getStoryById('secret-wooden-crate')
    expect(story).toBeDefined()
    expect(story?.available).toBe(true)
  })

  it('catalog has 2 coming-soon slots', () => {
    expect(ECO_COMIC_COMING_SOON_COUNT).toBe(2)
  })

  it('story panels include all three ending panels', () => {
    const story = getStoryById('secret-wooden-crate')!
    const panels = Object.values(story.panels)
    const endingIds = panels
      .filter((p) => p.isEnding)
      .map((p) => p.endingId)
    expect(endingIds).toContain('call-a-parent')
    expect(endingIds).toContain('contact-wildlife-dept')
    expect(endingIds).toContain('photograph-and-report')
  })

  it('family-team-hero ending gives +50 leaf points', () => {
    const story = getStoryById('secret-wooden-crate')!
    const panel = Object.values(story.panels).find((p) => p.endingId === 'call-a-parent')
    expect(panel?.leafPoints).toBe(50)
    expect(panel?.stampId).toBe('family-team-hero')
  })

  it('pangolin-guardian ending gives +30 leaf points', () => {
    const story = getStoryById('secret-wooden-crate')!
    const panel = Object.values(story.panels).find((p) => p.endingId === 'contact-wildlife-dept')
    expect(panel?.leafPoints).toBe(30)
    expect(panel?.stampId).toBe('pangolin-guardian')
  })

  it('wildlife-secret-agent ending gives +80 leaf points', () => {
    const story = getStoryById('secret-wooden-crate')!
    const panel = Object.values(story.panels).find((p) => p.endingId === 'photograph-and-report')
    expect(panel?.leafPoints).toBe(80)
    expect(panel?.stampId).toBe('wildlife-secret-agent')
  })

  it('story has a first panel id that exists in panels', () => {
    const story = getStoryById('secret-wooden-crate')!
    expect(story.panels[story.firstPanelId]).toBeDefined()
  })

  it('all panels referenced by nextPanelId or choices exist', () => {
    const story = getStoryById('secret-wooden-crate')!
    const panels = story.panels
    for (const panel of Object.values(panels)) {
      if (panel.nextPanelId) {
        expect(panels[panel.nextPanelId], `Missing panel: ${panel.nextPanelId}`).toBeDefined()
      }
      for (const choice of panel.choices ?? []) {
        expect(panels[choice.nextPanelId], `Missing panel: ${choice.nextPanelId}`).toBeDefined()
      }
    }
  })

  it('available story has a real coverImageSrc', () => {
    const story = getStoryById('secret-wooden-crate')!
    expect(story.coverImageSrc).toBeTruthy()
    expect(story.coverImageSrc).toContain('/games/eco-comics/menu/')
    expect(story.coverImageSrc).not.toContain('BIOWIRA_UI_REFERENCES')
  })

  it('every non-ending panel has a real imageSrc', () => {
    const story = getStoryById('secret-wooden-crate')!
    for (const panel of Object.values(story.panels)) {
      if (!panel.isEnding) {
        expect(panel.imageSrc, `Panel ${panel.id} is missing imageSrc`).toBeTruthy()
        expect(panel.imageSrc, `Panel ${panel.id} imageSrc should be in /games/eco-comics/`).toContain(
          '/games/eco-comics/secret-wooden-crate/',
        )
      }
    }
  })

  it('no imageSrc references BIOWIRA_UI_REFERENCES', () => {
    const story = getStoryById('secret-wooden-crate')!
    for (const panel of Object.values(story.panels)) {
      if (panel.imageSrc) {
        expect(panel.imageSrc, `Panel ${panel.id} must not reference BIOWIRA_UI_REFERENCES`).not.toContain(
          'BIOWIRA_UI_REFERENCES',
        )
      }
    }
  })

  it('no imageSrc references non-existent Path B scene 19/20/21', () => {
    const story = getStoryById('secret-wooden-crate')!
    for (const panel of Object.values(story.panels)) {
      if (panel.imageSrc) {
        // Path B only goes up to scene-18; no scene-19/20/21 exist for path-b
        expect(panel.imageSrc).not.toMatch(/path-b\/scene-1[9]\.webp/)
        expect(panel.imageSrc).not.toMatch(/path-b\/scene-2[0-9]\.webp/)
      }
    }
  })

  it('path_a2_21 exists and uses the Path AB scene21 asset', () => {
    const story = getStoryById('secret-wooden-crate')!
    const panel = story.panels['path_a2_21']
    expect(panel).toBeDefined()
    expect(panel!.imageSrc).toContain('contact-perhilitan/scene-21.webp')
  })

  it('scene_8 has choices (first branch merged in, no separate choice placeholder)', () => {
    const story = getStoryById('secret-wooden-crate')!
    const scene8 = story.panels['scene_8']
    expect(scene8).toBeDefined()
    expect(scene8!.choices).toBeDefined()
    expect(scene8!.choices!.map((c) => c.nextPanelId)).toContain('path_a_9')
    expect(scene8!.choices!.map((c) => c.nextPanelId)).toContain('path_b_9')
    // scene_8 must have a real image
    expect(scene8!.imageSrc).toContain('/games/eco-comics/secret-wooden-crate/')
  })

  it('path_a_12 has choices (second branch merged in, no separate choice placeholder)', () => {
    const story = getStoryById('secret-wooden-crate')!
    const panel = story.panels['path_a_12']
    expect(panel).toBeDefined()
    expect(panel!.choices).toBeDefined()
    expect(panel!.choices!.map((c) => c.nextPanelId)).toContain('path_a1_13')
    expect(panel!.choices!.map((c) => c.nextPanelId)).toContain('path_a2_13')
    expect(panel!.imageSrc).toContain('path-a/shared/scene-12.webp')
  })

  it('scene_choice_1 does not exist (merged into scene_8)', () => {
    const story = getStoryById('secret-wooden-crate')!
    expect(story.panels['scene_choice_1']).toBeUndefined()
  })

  it('path_a_choice_2 does not exist (merged into path_a_12)', () => {
    const story = getStoryById('secret-wooden-crate')!
    expect(story.panels['path_a_choice_2']).toBeUndefined()
  })

  it('path_b_21 does not exist (ride-home message merged into path_b_18)', () => {
    const story = getStoryById('secret-wooden-crate')!
    expect(story.panels['path_b_21']).toBeUndefined()
  })

  it('path_b_18 leads directly to ending_b (no missing path_b_21 hop)', () => {
    const story = getStoryById('secret-wooden-crate')!
    const p18 = story.panels['path_b_18']
    expect(p18!.nextPanelId).toBe('ending_b')
  })

  it('opening panel has isOpening: true', () => {
    const story = getStoryById('secret-wooden-crate')!
    expect(story.panels['opening']!.isOpening).toBe(true)
  })

  it('shared Path A scenes use path-a/shared/ path (deduplication)', () => {
    const story = getStoryById('secret-wooden-crate')!
    for (const panelId of ['path_a_9', 'path_a_10', 'path_a_11', 'path_a_12']) {
      const panel = story.panels[panelId]!
      expect(panel.imageSrc, `${panelId} should use shared path`).toContain('path-a/shared/')
    }
    // path_a1_20 and path_a2_20 both use shared scene-20
    expect(story.panels['path_a1_20']!.imageSrc).toContain('path-a/shared/scene-20.webp')
    expect(story.panels['path_a2_20']!.imageSrc).toContain('path-a/shared/scene-20.webp')
  })

  it('ending panels reuse final scene imageSrc (no blank placeholder)', () => {
    const story = getStoryById('secret-wooden-crate')!
    expect(story.panels['ending_a1']!.imageSrc).toBeTruthy()
    expect(story.panels['ending_a2']!.imageSrc).toBeTruthy()
    expect(story.panels['ending_b']!.imageSrc).toBeTruthy()
  })
})

// ── buildEcoComicNarrationText ────────────────────────────────────────────────

import { buildEcoComicNarrationText } from '@/features/eco-comics/utils/buildEcoComicNarrationText'

describe('buildEcoComicNarrationText', () => {
  it('returns empty string for null panel', () => {
    expect(buildEcoComicNarrationText(null)).toBe('')
  })

  it('returns narration text for narration-only panels', () => {
    const panel = {
      id: 'test',
      imagePlaceholder: '🌙',
      narration: 'Fatimah walks through the night market.',
    }
    const text = buildEcoComicNarrationText(panel as never)
    expect(text).toContain('Fatimah walks through the night market.')
  })

  it('includes speaker names naturally for dialogue panels', () => {
    const panel = {
      id: 'test',
      imagePlaceholder: '🦋',
      dialogues: [
        { speaker: 'Fatimah', text: '"What is that sound?"' },
        { speaker: 'Rama', text: '"Be careful!"' },
      ],
    }
    const text = buildEcoComicNarrationText(panel as never)
    expect(text).toContain('Fatimah says:')
    expect(text).toContain('"What is that sound?"')
    expect(text).toContain('Rama says:')
    expect(text).toContain('"Be careful!"')
  })

  it('handles dialogue-only panels (no narrator text)', () => {
    const panel = {
      id: 'test',
      imagePlaceholder: '👩',
      dialogues: [{ speaker: 'Mom', text: '"Are you alright?"' }],
    }
    const text = buildEcoComicNarrationText(panel as never)
    expect(text).toContain('Mom says:')
    expect(text).toContain('"Are you alright?"')
  })

  it('handles narration + dialogue together', () => {
    const panel = {
      id: 'test',
      imagePlaceholder: '🦔',
      narration: 'Rama points toward the crate.',
      dialogues: [{ speaker: 'Rama', text: '"That is a Sunda Pangolin."' }],
    }
    const text = buildEcoComicNarrationText(panel as never)
    expect(text).toContain('Rama points toward the crate.')
    expect(text).toContain('Rama says:')
  })

  it('returns empty string for panel with no narration and no dialogues', () => {
    const panel = { id: 'test', imagePlaceholder: '🌿' }
    expect(buildEcoComicNarrationText(panel as never)).toBe('')
  })

  it('omits dialogue lines with empty text', () => {
    const panel = {
      id: 'test',
      imagePlaceholder: '🌙',
      dialogues: [
        { speaker: 'Fatimah', text: '' },
        { speaker: 'Rama', text: '"Look out!"' },
      ],
    }
    const text = buildEcoComicNarrationText(panel as never)
    expect(text).not.toContain('Fatimah says:')
    expect(text).toContain('Rama says:')
  })

  it('builds correct text from real secret-wooden-crate scene_3 data', () => {
    const story = getStoryById('secret-wooden-crate')!
    const panel = story.panels['scene_3']!
    const text = buildEcoComicNarrationText(panel)
    expect(text).toContain('Monarch butterfly')
    expect(text).toContain('Monarch says:')
  })
})

// ── EcoComicsPage library tests ───────────────────────────────────────────────

import EcoComicsPage from '@/features/eco-comics/EcoComicsPage.vue'

describe('EcoComicsPage library', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  function buildLibraryRouter() {
    const Empty = defineComponent({ template: '<div />' })
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/games', name: ROUTE_NAMES.games, component: Empty },
        { path: '/games/eco-comics', name: ROUTE_NAMES.ecoComics, component: EcoComicsPage },
        { path: '/games/eco-comics/story/:storyId', name: ROUTE_NAMES.ecoComicReader, component: Empty },
      ],
    })
  }

  it('renders library page with testid', async () => {
    const router = buildLibraryRouter()
    await router.push({ name: ROUTE_NAMES.ecoComics })
    const wrapper = mount(EcoComicsPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: { BioWiraScenePage: BWSStub },
      },
    })
    await flushPromises()
    expect(wrapper.find('[data-testid="eco-comics-library-page"]').exists()).toBe(true)
  })

  it('available story card renders a cover image', async () => {
    const router = buildLibraryRouter()
    await router.push({ name: ROUTE_NAMES.ecoComics })
    const wrapper = mount(EcoComicsPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: { BioWiraScenePage: BWSStub },
      },
    })
    await flushPromises()
    const card = wrapper.find('[data-testid="eco-comics-book-secret-wooden-crate"]')
    expect(card.exists()).toBe(true)
    // Image should render
    const img = card.find('img.eco-lib__cover-img')
    expect(img.exists()).toBe(true)
    // Image src from real asset registry (library menu tier)
    expect(img.attributes('src')).toContain('/games/eco-comics/menu/')
  })

  it('coming-soon cards are rendered with correct testids', async () => {
    const router = buildLibraryRouter()
    await router.push({ name: ROUTE_NAMES.ecoComics })
    const wrapper = mount(EcoComicsPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: { BioWiraScenePage: BWSStub },
      },
    })
    await flushPromises()
    expect(wrapper.find('[data-testid="eco-comics-coming-soon-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="eco-comics-coming-soon-2"]').exists()).toBe(true)
  })

  it('Back to Games button is visible and navigates', async () => {
    const router = buildLibraryRouter()
    const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined as unknown as never)
    await router.push({ name: ROUTE_NAMES.ecoComics })
    const wrapper = mount(EcoComicsPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: { BioWiraScenePage: BWSStub },
      },
    })
    await flushPromises()
    const backBtn = wrapper.find('[data-testid="eco-comics-back-btn"]')
    expect(backBtn.exists()).toBe(true)
    await backBtn.trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({ name: ROUTE_NAMES.games })
    pushSpy.mockRestore()
  })
})

// ── ecoComicAssetRegistry ─────────────────────────────────────────────────────

describe('ecoComicAssetRegistry', () => {
  it('all SECRET_WOODEN_CRATE_ASSETS paths start with /games/eco-comics/', () => {
    function checkPaths(obj: Record<string, unknown>, prefix = '') {
      for (const [key, val] of Object.entries(obj)) {
        if (typeof val === 'string') {
          expect(val, `${prefix}.${key} must start with /games/eco-comics/`).toMatch(
            /^\/games\/eco-comics\//,
          )
          expect(val, `${prefix}.${key} must not reference BIOWIRA_UI_REFERENCES`).not.toContain(
            'BIOWIRA_UI_REFERENCES',
          )
        } else if (typeof val === 'object' && val !== null) {
          checkPaths(val as Record<string, unknown>, `${prefix}.${key}`)
        }
      }
    }
    checkPaths(SECRET_WOODEN_CRATE_ASSETS as unknown as Record<string, unknown>)
  })

  it('getEcoComicWarmAssetUrls returns cover and first two scene paths', () => {
    const warm = getEcoComicWarmAssetUrls()
    expect(warm).toContain(SECRET_WOODEN_CRATE_ASSETS.cover)
    expect(warm.length).toBeLessThanOrEqual(3)
  })

  it('getSecretWoodenCrateSceneUrls has no duplicates', () => {
    const urls = getSecretWoodenCrateSceneUrls()
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('shared scenes (scene-09 to scene-12, scene-20) are not duplicated across call-parent and contact-perhilitan', () => {
    // These should only appear in path-a/shared/, NOT repeated in sub-folders
    for (const sharedScene of Object.values(SECRET_WOODEN_CRATE_ASSETS.pathAShared)) {
      expect(sharedScene).toContain('path-a/shared/')
      expect(Object.values(SECRET_WOODEN_CRATE_ASSETS.pathACallParent)).not.toContain(sharedScene)
      expect(Object.values(SECRET_WOODEN_CRATE_ASSETS.pathAContactPerhilitan)).not.toContain(sharedScene)
    }
  })
})

// ── Routing ───────────────────────────────────────────────────────────────────

describe('routing — journal routes', () => {
  it('/games/journal route exists with name gameJournalMenu', () => {
    expect(ROUTE_NAMES.gameJournalMenu).toBe('game-journal-menu')
  })

  it('/games/journal/:categoryId route exists with name gameJournalCategory', () => {
    expect(ROUTE_NAMES.gameJournalCategory).toBe('game-journal-category')
  })

  it('/games/explorer-rescue-run/journal still exists for backward compatibility', () => {
    expect(ROUTE_NAMES.explorerRescueJournal).toBe('explorer-rescue-journal')
  })

  it('ecoComicReader route name is defined', () => {
    expect(ROUTE_NAMES.ecoComicReader).toBe('eco-comic-reader')
  })
})

// ── GameJournalMenuPage ───────────────────────────────────────────────────────

const BWSStub = defineComponent({ template: '<div class="bw-scene-stub"><slot /></div>' })

describe('GameJournalMenuPage', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  async function mountMenuPage() {
    const router = buildJournalRouter()
    await router.push({ name: ROUTE_NAMES.gameJournalMenu })
    await router.isReady()
    return mount(GameJournalMenuPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: { BioWiraScenePage: BWSStub, PixelProgressBar: true },
      },
    })
  }

  it('shows three category cards', async () => {
    const wrapper = await mountMenuPage()
    const cards = wrapper.findAll('[data-testid^="journal-category-card-"]')
    expect(cards).toHaveLength(3)
  })

  it('book frame uses journal_book_2 sprite (same registry key as stamp pages)', async () => {
    const wrapper = await mountMenuPage()
    expect(wrapper.find('.journal-menu-page__book-bg').attributes('src')).toBe(
      GAME_JOURNAL_ASSETS.shared.bookFrameWide,
    )
  })

  it('shows category cards for nature-mission, eco-comic, explorer-rescue-run', async () => {
    const wrapper = await mountMenuPage()
    expect(wrapper.find('[data-testid="journal-category-card-nature-mission"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="journal-category-card-eco-comic"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="journal-category-card-explorer-rescue-run"]').exists()).toBe(true)
  })

  it('clicking empty category shows "Please complete a game to unlock the stamps!" message', async () => {
    const wrapper = await mountMenuPage()

    // No records exist, so clicking any card should show empty notice
    const card = wrapper.find('[data-testid="journal-category-card-nature-mission"]')
    await card.trigger('click')
    await wrapper.vm.$nextTick()

    const emptyMsg = wrapper.find('[data-testid="journal-empty-message"]')
    expect(emptyMsg.exists()).toBe(true)
    expect(emptyMsg.text()).toContain('Please complete a game to unlock the stamps!')
  })

  it('Play Games button in empty notice navigates to /games', async () => {
    const router = buildJournalRouter()
    await router.push({ name: ROUTE_NAMES.gameJournalMenu })
    const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined as unknown as never)
    const wrapper = mount(GameJournalMenuPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: { BioWiraScenePage: BWSStub, PixelProgressBar: true },
      },
    })

    // Click empty category to show notice
    await wrapper.find('[data-testid="journal-category-card-nature-mission"]').trigger('click')
    await wrapper.vm.$nextTick()

    // Click Play Games
    await wrapper.find('[data-testid="journal-play-games-btn"]').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({ name: ROUTE_NAMES.games })
  })

  it('Explorer Rescue card badge shows 2/2 when two animals appear in history', async () => {
    const store = useGameJournalStore()
    store.recordGameCompletion({
      categoryId: 'explorer-rescue-run',
      sourceId: 'malayan-tiger',
      title: 'Larut Torrent Frog Wild Match',
      description: 'Found the Wild Match!',
      leafPointsEarned: 50,
      stampId: 'wild-match-finder',
      metadata: {
        isFirstCompletion: true,
        rescueAnimalName: 'Larut Torrent Frog',
        wildMatchName: 'Asian Common Toad',
      },
    })
    store.recordGameCompletion({
      categoryId: 'explorer-rescue-run',
      sourceId: 'malayan-tiger',
      title: 'Sun Bear Wild Match',
      description: 'Found the Wild Match!',
      leafPointsEarned: 50,
      stampId: 'wild-match-finder',
      metadata: {
        isFirstCompletion: true,
        rescueAnimalName: 'Sun Bear',
        wildMatchName: 'Bornean Orangutan',
      },
    })

    const wrapper = await mountMenuPage()
    const badge = wrapper.find('[data-testid="journal-category-card-explorer-rescue-run"] .journal-menu-page__cat-badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('2/2 stamps')
  })

  it('Go Back to Games button navigates to /games', async () => {
    const router = buildJournalRouter()
    await router.push({ name: ROUTE_NAMES.gameJournalMenu })
    const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined as unknown as never)
    const wrapper = mount(GameJournalMenuPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: { BioWiraScenePage: BWSStub, PixelProgressBar: true },
      },
    })
    await wrapper.find('[data-testid="journal-back-to-games-btn"]').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({ name: ROUTE_NAMES.games })
  })
})

// ── GameJournalStampPage ──────────────────────────────────────────────────────

describe('GameJournalStampPage', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  function seedRecords(profileId = 'guest') {
    const store = useGameJournalStore()
    store._resetForTests(profileId)
    // Seed 3 records for eco-comic
    store.recordGameCompletion({
      categoryId: 'eco-comic', sourceId: 'a', title: 'Story A', description: 'First ending',
      leafPointsEarned: 80, stampId: 'wildlife-secret-agent',
    })
    store.recordGameCompletion({
      categoryId: 'eco-comic', sourceId: 'b', title: 'Story B', description: 'Second ending',
      leafPointsEarned: 30, stampId: 'pangolin-guardian',
    })
  }

  async function mountStampPage(categoryId = 'eco-comic') {
    const router = buildJournalRouter()
    await router.push({ name: ROUTE_NAMES.gameJournalCategory, params: { categoryId } })
    await router.isReady()
    return mount(GameJournalStampPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: { BioWiraScenePage: BWSStub, PixelProgressBar: true, GameplayIcon: true },
      },
    })
  }

  it('shows first completed record when category has records', async () => {
    seedRecords()
    const wrapper = await mountStampPage('eco-comic')
    await flushPromises()
    expect(wrapper.find('[data-testid="journal-stamp-page-eco-comic"]').exists()).toBe(true)
  })

  it('hides BOTH arrow buttons when only one record exists', async () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    store.recordGameCompletion({
      categoryId: 'nature-mission', sourceId: 'm1', title: 'Mission', description: 'd',
      leafPointsEarned: 20, stampId: 'mission-tiger-territory',
    })
    const wrapper = await mountStampPage('nature-mission')
    await flushPromises()
    expect(wrapper.find('[data-testid="journal-prev-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="journal-next-btn"]').exists()).toBe(false)
  })

  it('hides left (prev) arrow on first page when multiple records exist', async () => {
    seedRecords()
    const wrapper = await mountStampPage('eco-comic')
    await flushPromises()
    // On first page (index 0), prev button should NOT exist
    expect(wrapper.find('[data-testid="journal-prev-btn"]').exists()).toBe(false)
    // Next button should exist (there are 2 records)
    expect(wrapper.find('[data-testid="journal-next-btn"]').exists()).toBe(true)
  })

  it('hides right (next) arrow on last page when multiple records exist', async () => {
    seedRecords()
    const wrapper = await mountStampPage('eco-comic')
    await flushPromises()

    // Click next to go to last page
    await wrapper.find('[data-testid="journal-next-btn"]').trigger('click')
    await wrapper.vm.$nextTick()

    // On last page, next should NOT exist
    expect(wrapper.find('[data-testid="journal-next-btn"]').exists()).toBe(false)
    // Prev should exist
    expect(wrapper.find('[data-testid="journal-prev-btn"]').exists()).toBe(true)
  })

  it('shows locked eco-comic stamps greyed out for un-unlocked stamps', async () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    store.recordGameCompletion({
      categoryId: 'eco-comic', sourceId: 'a', title: 'Story', description: 'd',
      leafPointsEarned: 80, stampId: 'wildlife-secret-agent',
    })
    const wrapper = await mountStampPage('eco-comic')
    await flushPromises()

    // Unlocked stamp
    const agentStamp = wrapper.find('[data-testid="journal-stamp-wildlife-secret-agent"]')
    expect(agentStamp.exists()).toBe(true)
    expect(agentStamp.classes()).toContain('journal-stamp--unlocked')

    // Locked stamps (family-team-hero, pangolin-guardian not unlocked)
    const heroStamp = wrapper.find('[data-testid="journal-stamp-family-team-hero"]')
    expect(heroStamp.exists()).toBe(true)
    expect(heroStamp.classes()).toContain('journal-stamp--locked')
  })

  it('eco-comic stamp column uses per-page cumulative progress (not global unlocks)', async () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    store.recordGameCompletion({
      categoryId: 'eco-comic',
      sourceId: 'secret-wooden-crate_call-a-parent',
      title: 'Story',
      description: 'd',
      leafPointsEarned: 50,
      stampId: 'family-team-hero',
      completedAt: '2025-01-01T12:00:00.000Z',
    })
    store.recordGameCompletion({
      categoryId: 'eco-comic',
      sourceId: 'secret-wooden-crate_contact-wildlife-dept',
      title: 'Story',
      description: 'd',
      leafPointsEarned: 30,
      stampId: 'pangolin-guardian',
      completedAt: '2025-01-02T12:00:00.000Z',
    })
    const wrapper = await mountStampPage('eco-comic')
    await flushPromises()

    expect(wrapper.find('[data-testid="journal-stamp-family-team-hero"]').classes()).toContain(
      'journal-stamp--unlocked',
    )
    expect(wrapper.find('[data-testid="journal-stamp-pangolin-guardian"]').classes()).toContain(
      'journal-stamp--locked',
    )

    await wrapper.find('[data-testid="journal-next-btn"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="journal-stamp-family-team-hero"]').classes()).toContain(
      'journal-stamp--unlocked',
    )
    expect(wrapper.find('[data-testid="journal-stamp-pangolin-guardian"]').classes()).toContain(
      'journal-stamp--unlocked',
    )
  })
})

// ── JournalEmptyNotice component ──────────────────────────────────────────────

describe('JournalEmptyNotice', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders exact message text', () => {
    const router = buildJournalRouter()
    const wrapper = mount(JournalEmptyNotice, {
      props: { categoryTitle: 'Nature Mission' },
      global: { plugins: [createPinia(), router] },
    })
    expect(wrapper.find('[data-testid="journal-empty-message"]').text()).toBe(
      'Please complete a game to unlock the stamps!',
    )
  })

  it('has Play Games button', () => {
    const router = buildJournalRouter()
    const wrapper = mount(JournalEmptyNotice, {
      props: { categoryTitle: 'Nature Mission' },
      global: { plugins: [createPinia(), router] },
    })
    expect(wrapper.find('[data-testid="journal-play-games-btn"]').exists()).toBe(true)
  })

  it('Play Games button navigates to games', async () => {
    const router = buildJournalRouter()
    const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined as unknown as never)
    const wrapper = mount(JournalEmptyNotice, {
      props: { categoryTitle: 'Nature Mission' },
      global: { plugins: [createPinia(), router] },
    })
    await wrapper.find('[data-testid="journal-play-games-btn"]').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({ name: ROUTE_NAMES.games })
  })
})

// ── Eco-Comic duplicate completion guard ──────────────────────────────────────

describe('Eco-Comic duplicate completion guard', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('second completion of same ending does not add a second stamp unlock', async () => {
    const journalStore = useGameJournalStore()
    journalStore._resetForTests('guest')

    // First completion
    journalStore.recordGameCompletion({
      categoryId: 'eco-comic',
      sourceId: 'secret-wooden-crate_photograph-and-report',
      title: 'Story',
      description: 'Completed',
      leafPointsEarned: 80,
      stampId: 'wildlife-secret-agent',
    })

    const countAfterFirst = journalStore.unlockedStampIds.filter(
      (id) => id === 'wildlife-secret-agent',
    ).length
    expect(countAfterFirst).toBe(1)

    // Second attempt (replay) — same stamp
    journalStore.recordGameCompletion({
      categoryId: 'eco-comic',
      sourceId: 'secret-wooden-crate_photograph-and-report_replay',
      title: 'Story replay',
      description: 'Completed again',
      leafPointsEarned: 0, // no extra points on replay
      stampId: 'wildlife-secret-agent',
    })

    const countAfterSecond = journalStore.unlockedStampIds.filter(
      (id) => id === 'wildlife-secret-agent',
    ).length
    expect(countAfterSecond).toBe(1) // still exactly 1
  })

  it('restoration does not increase on duplicate stamp', () => {
    const journalStore = useGameJournalStore()
    journalStore._resetForTests('guest')

    journalStore.recordGameCompletion({
      categoryId: 'eco-comic', sourceId: 'a', title: 'T', description: 'd',
      leafPointsEarned: 80, stampId: 'wildlife-secret-agent',
    })
    const restoreAfterFirst = journalStore.rainforestRestoredPercent

    journalStore.recordGameCompletion({
      categoryId: 'eco-comic', sourceId: 'a-replay', title: 'T', description: 'd',
      leafPointsEarned: 0, stampId: 'wildlife-secret-agent',
    })
    expect(journalStore.rainforestRestoredPercent).toBe(restoreAfterFirst)
  })
})

// ── EcoComicReaderPage unit tests ─────────────────────────────────────────────

import EcoComicReaderPage from '@/features/eco-comics/EcoComicReaderPage.vue'

// Mock warmAssetsIdle so it does not run setTimeout in tests
vi.mock('@/services/assetPreloadService', () => ({
  warmAssetsIdle: vi.fn(),
  preloadCriticalAssets: vi.fn().mockResolvedValue({ loaded: [], failed: [] }),
  getCriticalAssetUrls: vi.fn().mockReturnValue([]),
  getWarmAssetUrls: vi.fn().mockReturnValue([]),
  deduplicateUrls: vi.fn((urls: string[]) => urls),
}))

describe('EcoComicReaderPage', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  function buildReaderRouter() {
    const Empty = defineComponent({ template: '<div />' })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/games/eco-comics', name: ROUTE_NAMES.ecoComics, component: Empty },
        {
          path: '/games/eco-comics/story/:storyId',
          name: ROUTE_NAMES.ecoComicReader,
          component: EcoComicReaderPage,
        },
        { path: '/games/journal', name: ROUTE_NAMES.gameJournalMenu, component: Empty },
      ],
    })
    return router
  }

  it('opening panel shows START button not NEXT', async () => {
    const router = buildReaderRouter()
    await router.push({ name: ROUTE_NAMES.ecoComicReader, params: { storyId: 'secret-wooden-crate' } })
    await router.isReady()

    const wrapper = mount(EcoComicReaderPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: {
          BioWiraScenePage: BWSStub,
          PixelProgressBar: true,
          GameplayIcon: true,
          PixelButton: false,
        },
      },
    })
    await flushPromises()

    // Start button should be visible
    const startBtn = wrapper.find('[data-testid="eco-comic-start-btn"]')
    expect(startBtn.exists()).toBe(true)
    expect(startBtn.text()).toContain('START')

    // NEXT button should NOT be visible on opening panel
    expect(wrapper.find('[data-testid="eco-comic-next-btn"]').exists()).toBe(false)
    // BACK button should NOT be visible on opening panel
    expect(wrapper.find('[data-testid="eco-comic-back-btn"]').exists()).toBe(false)
  })

  it('opening panel renders real scene image (not placeholder only)', async () => {
    const router = buildReaderRouter()
    await router.push({ name: ROUTE_NAMES.ecoComicReader, params: { storyId: 'secret-wooden-crate' } })
    await router.isReady()

    const wrapper = mount(EcoComicReaderPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: { BioWiraScenePage: BWSStub, PixelProgressBar: true, GameplayIcon: true, EcoComicNarrationButton: true },
      },
    })
    await flushPromises()

    // Updated class name: reader__scene-img
    const img = wrapper.find('img.reader__scene-img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toContain('/games/eco-comics/secret-wooden-crate/initial/opening.webp')
    // Scene frame uses object-fit: contain (not cover) class pattern
    expect(wrapper.find('.reader__scene-frame').exists()).toBe(true)
  })

  it('clicking START advances to scene_1 which shows a real image', async () => {
    const router = buildReaderRouter()
    await router.push({ name: ROUTE_NAMES.ecoComicReader, params: { storyId: 'secret-wooden-crate' } })
    await router.isReady()

    const wrapper = mount(EcoComicReaderPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: { BioWiraScenePage: BWSStub, PixelProgressBar: true, GameplayIcon: true, EcoComicNarrationButton: true },
      },
    })
    await flushPromises()

    await wrapper.find('[data-testid="eco-comic-start-btn"]').trigger('click')
    await wrapper.vm.$nextTick()

    const img = wrapper.find('img.reader__scene-img')
    expect(img.attributes('src')).toContain('/games/eco-comics/secret-wooden-crate/initial/scene-01.webp')
  })

  it('BACK from scene_1 returns to opening panel (not library)', async () => {
    const router = buildReaderRouter()
    // Navigate BEFORE setting up the spy so the route actually loads
    await router.push({ name: ROUTE_NAMES.ecoComicReader, params: { storyId: 'secret-wooden-crate' } })
    await router.isReady()

    const wrapper = mount(EcoComicReaderPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: {
          BioWiraScenePage: BWSStub,
          PixelProgressBar: true,
          GameplayIcon: true,
          EcoComicNarrationButton: true,
        },
      },
    })
    await flushPromises()

    // Spy AFTER mounting so it doesn't intercept the initial navigation
    const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined as unknown as never)

    // Navigate to scene_1 via START
    await wrapper.find('[data-testid="eco-comic-start-btn"]').trigger('click')
    await wrapper.vm.$nextTick()

    // Now on scene_1 — BACK button should be visible
    const backBtn = wrapper.find('[data-testid="eco-comic-back-btn"]')
    expect(backBtn.exists()).toBe(true)

    // Click BACK
    await backBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Should be back on opening — START button should appear
    expect(wrapper.find('[data-testid="eco-comic-start-btn"]').exists()).toBe(true)
    // Should NOT have navigated to the library
    expect(pushSpy).not.toHaveBeenCalledWith({ name: ROUTE_NAMES.ecoComics })
    pushSpy.mockRestore()
  })

  it('BACK from opening panel navigates to eco-comics library', async () => {
    const router = buildReaderRouter()
    // Navigate BEFORE setting up the spy so the route actually loads
    await router.push({ name: ROUTE_NAMES.ecoComicReader, params: { storyId: 'secret-wooden-crate' } })
    await router.isReady()

    const wrapper = mount(EcoComicReaderPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: {
          BioWiraScenePage: BWSStub,
          PixelProgressBar: true,
          GameplayIcon: true,
          EcoComicNarrationButton: true,
        },
      },
    })
    await flushPromises()

    // Spy AFTER mounting
    const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined as unknown as never)

    // On opening panel, BACK button should NOT exist (canGoBack = false)
    expect(wrapper.find('[data-testid="eco-comic-back-btn"]').exists()).toBe(false)

    // Click "Back to Eco-Comics" secondary link
    const libLink = wrapper.find('[data-testid="eco-comic-library-link"]')
    expect(libLink.exists()).toBe(true)
    await libLink.trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({ name: ROUTE_NAMES.ecoComics })
    pushSpy.mockRestore()
  })

  it('narration button is visible on each panel', async () => {
    const router = buildReaderRouter()
    await router.push({ name: ROUTE_NAMES.ecoComicReader, params: { storyId: 'secret-wooden-crate' } })
    await router.isReady()

    const wrapper = mount(EcoComicReaderPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: { BioWiraScenePage: BWSStub, PixelProgressBar: true, GameplayIcon: true },
      },
    })
    await flushPromises()

    // EcoComicNarrationButton should be present in the reader
    const narrationWrap = wrapper.find('[data-testid="eco-comic-narration-btn-wrap"]')
    expect(narrationWrap.exists()).toBe(true)
  })

  it('scene_8 shows choice buttons with real image', async () => {
    const router = buildReaderRouter()
    await router.push({ name: ROUTE_NAMES.ecoComicReader, params: { storyId: 'secret-wooden-crate' } })
    await router.isReady()

    const wrapper = mount(EcoComicReaderPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: { BioWiraScenePage: BWSStub, PixelProgressBar: true, GameplayIcon: true, EcoComicNarrationButton: true },
      },
    })
    await flushPromises()

    // Navigate to scene_8 by clicking through opening → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
    const panelSequence = ['opening', 'scene_1', 'scene_2', 'scene_3', 'scene_4', 'scene_5', 'scene_6', 'scene_7']
    for (const _ of panelSequence) {
      const btn = wrapper.find('[data-testid="eco-comic-start-btn"], [data-testid="eco-comic-next-btn"]')
      if (btn.exists()) {
        await btn.trigger('click')
        await wrapper.vm.$nextTick()
      }
    }

    // Now should be on scene_8 (choices visible)
    const choices = wrapper.findAll('[data-testid^="eco-comic-choice-"]')
    expect(choices.length).toBeGreaterThanOrEqual(2)

    // Image should be real
    const img = wrapper.find('img.reader__scene-img')
    expect(img.attributes('src')).toContain('scene-08.webp')
  })
})

// ── gameJournalStore — new AC3 fields ─────────────────────────────────────────

describe('gameJournalStore — restorationPercentBefore/After/Delta', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('first stamp completion stores positive restorationPercentDelta', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    const record = store.recordGameCompletion({
      categoryId: 'nature-mission',
      sourceId: 'm1',
      title: 'Mission',
      description: 'd',
      leafPointsEarned: 30,
      stampId: 'mission-tiger-territory',
    })
    expect(record.restorationPercentBefore).toBe(0)
    expect(record.restorationPercentAfter).toBeGreaterThan(0)
    expect(record.restorationPercentDelta).toBeGreaterThan(0)
    expect(record.restorationPercentDelta).toBe(record.restorationPercentAfter - record.restorationPercentBefore)
  })

  it('replay of same stamp stores restorationPercentDelta === 0 and before === after', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    store.recordGameCompletion({
      categoryId: 'nature-mission',
      sourceId: 'm1',
      title: 'Mission',
      description: 'd',
      leafPointsEarned: 30,
      stampId: 'mission-tiger-territory',
    })
    const replayRecord = store.recordGameCompletion({
      categoryId: 'nature-mission',
      sourceId: 'm2',
      title: 'Mission replay',
      description: 'd',
      leafPointsEarned: 30,
      stampId: 'mission-tiger-territory',
    })
    expect(replayRecord.restorationPercentDelta).toBe(0)
    expect(replayRecord.restorationPercentBefore).toBe(replayRecord.restorationPercentAfter)
  })

  it('old records missing before/delta fields are migrated safely', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')

    // Manually write an old-format record to localStorage
    const profileId = 'guest'
    const key = `bw_game_journal_${profileId}`
    const oldRecord = {
      id: 'old-record-1',
      categoryId: 'nature-mission',
      sourceId: 'old-mission',
      title: 'Old Mission',
      description: 'old desc',
      completedAt: new Date().toISOString(),
      leafPointsEarned: 20,
      stampId: 'nature-mission-helper',
      stampTitle: 'Nature Mission Helper',
      stampDescription: '',
      restorationPercentAfter: 20,
      // no restorationPercentBefore
      // no restorationPercentDelta
      metadata: {},
    }
    localStorage.setItem(
      key,
      JSON.stringify({
        v: 1,
        data: {
          profileId,
          records: [oldRecord],
          unlockedStampIds: ['nature-mission-helper'],
          updatedAt: new Date().toISOString(),
        },
      }),
    )

    // Trigger reload — should not throw
    store.reloadForProfile(profileId)

    const records = store.getRecordsForCategory('nature-mission')
    expect(records).toHaveLength(1)
    const migrated = records[0]!
    expect(migrated.restorationPercentAfter).toBe(20)
    // before defaults to 0, delta defaults to max(0, 20 - 0) = 20
    expect(migrated.restorationPercentBefore).toBe(0)
    expect(migrated.restorationPercentDelta).toBe(20)
  })

  it('getStampCountForCategory returns correct label and counts', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')

    let count = store.getStampCountForCategory('eco-comic')
    expect(count.unlockedStampCount).toBe(0)
    expect(count.totalStampCount).toBe(3)
    expect(count.label).toBe('0/3 stamps')

    store.recordGameCompletion({
      categoryId: 'eco-comic',
      sourceId: 'a',
      title: 'A',
      description: 'd',
      leafPointsEarned: 80,
      stampId: 'wildlife-secret-agent',
    })

    count = store.getStampCountForCategory('eco-comic')
    expect(count.unlockedStampCount).toBe(1)
    expect(count.totalStampCount).toBe(3)
    expect(count.label).toBe('1/3 stamps')
  })

  it('getStampCountForCategory nature-mission shows 1/3 after featured animal mission unlock', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    store.recordGameCompletion({
      categoryId: 'nature-mission',
      sourceId: 'm1',
      title: 'Tiger Territory Walk',
      description: 'd',
      leafPointsEarned: 20,
      stampId: 'mission-tiger-territory',
    })
    const count = store.getStampCountForCategory('nature-mission')
    expect(count.unlockedStampCount).toBe(1)
    expect(count.totalStampCount).toBe(3)
    expect(count.label).toBe('1/3 stamps')
  })

  it('getStampCountForCategory nature-mission omits legacy helper from menu tally', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    store.recordGameCompletion({
      categoryId: 'nature-mission',
      sourceId: 'm1',
      title: 'Bird Listener',
      description: 'd',
      leafPointsEarned: 20,
      stampId: 'nature-mission-helper',
    })
    const count = store.getStampCountForCategory('nature-mission')
    expect(count.unlockedStampCount).toBe(0)
    expect(count.totalStampCount).toBe(3)
    expect(count.label).toBe('0/3 stamps')
  })

  it('Explorer Rescue frog then sun bear unlocks two menu stamps (2/2)', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    store.recordGameCompletion({
      categoryId: 'explorer-rescue-run',
      sourceId: 'larut-torrent-frog',
      title: 'Larut Torrent Frog Wild Match',
      description: 'Found the Wild Match!',
      leafPointsEarned: 50,
      stampId: 'wild-match-finder',
      metadata: { isFirstCompletion: true },
    })
    store.recordGameCompletion({
      categoryId: 'explorer-rescue-run',
      sourceId: 'sun-bear',
      title: 'Sun Bear Wild Match',
      description: 'Found the Wild Match!',
      leafPointsEarned: 50,
      stampId: 'wild-match-finder',
      metadata: { isFirstCompletion: true },
    })
    const count = store.getStampCountForCategory('explorer-rescue-run')
    expect(count.unlockedStampCount).toBe(2)
    expect(count.totalStampCount).toBe(2)
    expect(count.label).toBe('2/2 stamps')
    expect(store.unlockedStampIds).toContain('wild-match-finder')
    expect(store.unlockedStampIds).toContain('wild-match-sun-bear')
  })

  it('counts 2/2 when legacy rows share sourceId but metadata names differ', () => {
    const profileId = 'guest'
    const key = STORAGE_KEYS.gameJournalState(profileId)
    const legacy: GameJournalState = {
      profileId,
      unlockedStampIds: ['wild-match-finder'],
      updatedAt: new Date().toISOString(),
      records: [
        {
          id: '1',
          categoryId: 'explorer-rescue-run',
          sourceId: 'malayan-tiger',
          title: 'Larut Torrent Frog Wild Match',
          description: 'Found the Wild Match!',
          completedAt: '2026-01-01T00:00:00.000Z',
          leafPointsEarned: 50,
          stampId: 'wild-match-finder',
          stampTitle: 'Wild Match Finder',
          stampDescription: '',
          restorationPercentBefore: 0,
          restorationPercentAfter: 10,
          restorationPercentDelta: 10,
          metadata: {
            isFirstCompletion: true,
            rescueAnimalName: 'Larut Torrent Frog',
            wildMatchName: 'Asian Common Toad',
          },
        },
        {
          id: '2',
          categoryId: 'explorer-rescue-run',
          sourceId: 'malayan-tiger',
          title: 'Sun Bear Wild Match',
          description: 'Found the Wild Match!',
          completedAt: '2026-01-02T00:00:00.000Z',
          leafPointsEarned: 50,
          stampId: 'wild-match-finder',
          stampTitle: 'Wild Match Finder',
          stampDescription: '',
          restorationPercentBefore: 10,
          restorationPercentAfter: 10,
          restorationPercentDelta: 0,
          metadata: {
            isFirstCompletion: true,
            rescueAnimalName: 'Sun Bear',
            wildMatchName: 'Bornean Orangutan',
          },
        },
      ],
    }
    storageService.set(key, legacy)
    setActivePinia(createPinia())
    const store = useGameJournalStore()
    expect(store.getStampCountForCategory('explorer-rescue-run').label).toBe('2/2 stamps')
    const card = store.categoryCardsData.find((c) => c.id === 'explorer-rescue-run')
    expect(card?.unlockedStampCount).toBe(2)
    expect(card?.totalStampCount).toBe(2)
  })

  it('migrates missing Sun Bear stamp when legacy saves only wild-match-finder', () => {
    const profileId = 'guest'
    const key = STORAGE_KEYS.gameJournalState(profileId)
    const legacy: GameJournalState = {
      profileId,
      unlockedStampIds: ['wild-match-finder'],
      updatedAt: new Date().toISOString(),
      records: [
        {
          id: '1',
          categoryId: 'explorer-rescue-run',
          sourceId: 'larut-torrent-frog',
          title: 'Larut Torrent Frog Wild Match',
          description: 'Found the Wild Match!',
          completedAt: '2026-01-01T00:00:00.000Z',
          leafPointsEarned: 50,
          stampId: 'wild-match-finder',
          stampTitle: 'Wild Match Finder',
          stampDescription: '',
          restorationPercentBefore: 0,
          restorationPercentAfter: 10,
          restorationPercentDelta: 10,
          metadata: { isFirstCompletion: true },
        },
        {
          id: '2',
          categoryId: 'explorer-rescue-run',
          sourceId: 'sun-bear',
          title: 'Sun Bear Wild Match',
          description: 'Found the Wild Match!',
          completedAt: '2026-01-02T00:00:00.000Z',
          leafPointsEarned: 50,
          stampId: 'wild-match-finder',
          stampTitle: 'Wild Match Finder',
          stampDescription: '',
          restorationPercentBefore: 10,
          restorationPercentAfter: 10,
          restorationPercentDelta: 0,
          metadata: { isFirstCompletion: true },
        },
      ],
    }
    storageService.set(key, legacy)
    setActivePinia(createPinia())
    const store = useGameJournalStore()
    const count = store.getStampCountForCategory('explorer-rescue-run')
    expect(count.label).toBe('2/2 stamps')
    expect(store.unlockedStampIds).toContain('wild-match-sun-bear')
  })

  it('Explorer Rescue replay appends a new history record but stamp count stays 1', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    store.recordGameCompletion({
      categoryId: 'explorer-rescue-run',
      sourceId: 'tiger',
      title: 'Malayan Tiger Wild Match',
      description: 'Found the Wild Match!',
      leafPointsEarned: 50,
      stampId: 'wild-match-finder',
      metadata: { isFirstCompletion: true },
    })
    store.recordGameCompletion({
      categoryId: 'explorer-rescue-run',
      sourceId: 'tiger',
      title: 'Malayan Tiger Wild Match',
      description: 'Found the Wild Match!',
      leafPointsEarned: 10,
      stampId: 'wild-match-finder',
      metadata: { isFirstCompletion: false },
    })
    const records = store.getRecordsForCategory('explorer-rescue-run')
    expect(records).toHaveLength(2)
    // stamp still deduplicated
    expect(store.unlockedStampIds.filter((id) => id === 'wild-match-finder')).toHaveLength(1)
    // replay delta is 0
    expect(records[0]!.restorationPercentDelta).toBe(0)
  })

  it('Eco-Comic replay appends a new history record but stamp count stays same', () => {
    const store = useGameJournalStore()
    store._resetForTests('guest')
    store.recordGameCompletion({
      categoryId: 'eco-comic',
      sourceId: 'secret-wooden-crate_photograph-and-report',
      title: 'The Secret in the Wooden Crate',
      description: 'Wildlife Secret Agent ending',
      leafPointsEarned: 80,
      stampId: 'wildlife-secret-agent',
      metadata: { isFirstCompletion: true },
    })
    store.recordGameCompletion({
      categoryId: 'eco-comic',
      sourceId: 'secret-wooden-crate_photograph-and-report',
      title: 'The Secret in the Wooden Crate',
      description: 'Wildlife Secret Agent ending',
      leafPointsEarned: 0,
      stampId: 'wildlife-secret-agent',
      metadata: { isFirstCompletion: false },
    })
    const records = store.getRecordsForCategory('eco-comic')
    expect(records).toHaveLength(2)
    expect(store.unlockedStampIds.filter((id) => id === 'wildlife-secret-agent')).toHaveLength(1)
    // replay leaf points is 0
    expect(records[0]!.leafPointsEarned).toBe(0)
    // replay delta is 0
    expect(records[0]!.restorationPercentDelta).toBe(0)
  })
})

// ── MissionsPage — removed old dashboard blocks ───────────────────────────────

import MissionsPage from '@/features/missions/MissionsPage.vue'

vi.mock('@/stores/missionStore', () => ({
  useMissionStore: () => ({
    selectedLocationId: null,
    activeMission: null,
    missionLoading: false,
    missionStarting: false,
    missionCompleting: false,
    missionError: null,
    weatherLoading: false,
    weatherDisplay: null,
    latestMissionResult: null,
    startMission: vi.fn(),
    completeMission: vi.fn().mockResolvedValue(undefined),
    refreshMission: vi.fn(),
    selectLocation: vi.fn(),
  }),
}))

vi.mock('@/stores/progressStore', () => ({
  useProgressStore: () => ({
    leafPoints: 0,
    level: 1,
    levelTitle: 'Nature Newbie',
    levelProgressPercent: 0,
    progress: null,
  }),
}))

describe('MissionsPage — old dashboard blocks removed', () => {
  it('does not render TOTAL LEAF POINTS block', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/missions', name: 'missions', component: MissionsPage }],
    })
    await router.push('/missions')
    setActivePinia(createPinia())

    const wrapper = mount(MissionsPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: {
          BioWiraScenePage: { template: '<div><slot /></div>' },
          MissionLocationPicker: true,
          MissionWeatherChip: true,
          MissionCard: true,
        },
      },
    })
    await flushPromises()

    const html = wrapper.html()
    expect(html).not.toContain('TOTAL LEAF POINTS')
    expect(html).not.toContain('LEVEL PROGRESS')
    expect(html).not.toContain('Your Badges')
    expect(html).not.toContain('Recent Missions')
  })

  it('still renders missions-page content with mission card stub', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/missions', name: 'missions', component: MissionsPage }],
    })
    await router.push('/missions')
    setActivePinia(createPinia())

    const wrapper = mount(MissionsPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: {
          BioWiraScenePage: { template: '<div><slot /></div>' },
          MissionLocationPicker: true,
          MissionWeatherChip: true,
          MissionCard: true,
        },
      },
    })
    await flushPromises()

    expect(wrapper.find('.missions-page').exists()).toBe(true)
  })
})

// ── GameJournalStampPage — stamp count chip ───────────────────────────────────

describe('GameJournalStampPage — stamp count chip', () => {
  it('shows data-testid="journal-stamp-count" when records exist', async () => {
    localStorage.clear()
    setActivePinia(createPinia())

    const journalStore = useGameJournalStore()
    journalStore._resetForTests('guest')
    journalStore.recordGameCompletion({
      categoryId: 'eco-comic',
      sourceId: 'a',
      title: 'Story',
      description: 'd',
      leafPointsEarned: 80,
      stampId: 'wildlife-secret-agent',
    })

    const router = buildJournalRouter()
    await router.push({ name: ROUTE_NAMES.gameJournalCategory, params: { categoryId: 'eco-comic' } })
    await router.isReady()

    const wrapper = mount(GameJournalStampPage, {
      global: {
        plugins: [createPinia(), router],
        stubs: {
          BioWiraScenePage: { template: '<div><slot /></div>' },
          JournalSideArrow: true,
          JournalActionBar: true,
          EcoComicJournalRecord: true,
          ExplorerRescueJournalRecord: true,
          NatureMissionJournalRecord: true,
        },
      },
    })
    await flushPromises()

    expect(wrapper.find('[data-testid="journal-stamp-count"]').exists()).toBe(true)
    const chipText = wrapper.find('[data-testid="journal-stamp-count"]').text()
    expect(chipText).toContain('/3 stamps')
  })
})
