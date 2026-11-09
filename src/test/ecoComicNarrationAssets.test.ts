/**
 * Eco-Comic prepared narration assets — catalog wiring and reader integration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent, ref, h } from 'vue'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { ROUTE_NAMES } from '@/app/config'
import EcoComicReaderPage from '@/features/eco-comics/EcoComicReaderPage.vue'
import { SECRET_WOODEN_CRATE_STORY } from '@/features/eco-comics/data/ecoComicStoryCatalog'
import {
  getSecretWoodenCrateNarrationUrls,
  SECRET_WOODEN_CRATE_ASSETS,
} from '@/features/eco-comics/data/ecoComicAssetRegistry'
import { buildEcoComicNarrationText } from '@/features/eco-comics/utils/buildEcoComicNarrationText'

vi.mock('@/services/assetPreloadService', () => ({
  warmAssetsIdle: vi.fn(),
  preloadCriticalAssets: vi.fn().mockResolvedValue({ loaded: [], failed: [] }),
  getCriticalAssetUrls: vi.fn().mockReturnValue([]),
  getWarmAssetUrls: vi.fn().mockReturnValue([]),
  deduplicateUrls: vi.fn((urls: string[]) => urls),
}))

vi.mock('@/composables/useNarrationAudio', () => ({
  useNarrationAudio: vi.fn(() => ({
    isPlaying: ref(false),
    currentTimeMs: ref(0),
    durationMs: ref(0),
    highlightedWordIndex: ref(-1),
    words: ref<string[]>([]),
    isAvailable: ref(true),
    isLoading: ref(false),
    errorMessage: ref<string | null>(null),
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
    reset: vi.fn(),
    destroy: vi.fn(),
  })),
}))

vi.mock('@/composables/usePreparedNarrationAudio', () => ({
  usePreparedNarrationAudio: vi.fn(() => ({
    isPlaying: ref(false),
    isLoading: ref(false),
    errorMessage: ref<string | null>(null),
    play: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn(),
    destroy: vi.fn(),
  })),
}))

const Empty = defineComponent({ template: '<div />' })

const BWSStub = defineComponent({
  template: '<div class="bw-scene-stub"><slot /><slot name="subtitle" /></div>',
})

/** Repo root (`fit5120_frontend/`), whether tests run from `src/` cwd or repo root */
function getRepoRootDir(): string {
  const cwd = process.cwd().replace(/\\/g, '/')
  if (cwd.endsWith('/src')) return path.dirname(cwd)
  return cwd
}

function publicDiskPathFromUrl(url: string): string {
  const rel = url.replace(/^\//, '')
  return path.join(getRepoRootDir(), 'public', rel)
}

/** Obsolete split-clip filenames — must never appear in registry or catalog narration URLs */
const OBSOLETE_NARR_SUBSTRINGS = [
  'scene-04a',
  'scene-04b',
  'scene-05a',
  'scene-05b',
  'scene-06a',
  'scene-06b',
  'path-aa-scene-19a',
  'path-aa-scene-19b',
  'path-ab-scene-19a',
  'path-ab-scene-19b',
  'path-ab-scene-19c',
  'path-b-scene-17a',
  'path-b-scene-17b',
] as const

function buildReaderRouter() {
  return createRouter({
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
}

describe('eco-comic prepared narration assets', () => {
  const NARR_PREFIX = '/games/eco-comics/secret-wooden-crate/narration/' as const

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('every non-ending panel has exactly one prepared MP3 source', () => {
    for (const panel of Object.values(SECRET_WOODEN_CRATE_STORY.panels)) {
      if (panel.isEnding) continue
      expect(
        panel.narrationAudioSrcs?.length ?? 0,
        `panel ${panel.id} should have exactly one narrationAudioSrcs entry`,
      ).toBe(1)
    }
  })

  it('getSecretWoodenCrateNarrationUrls returns 41 unique narration files', () => {
    const urls = getSecretWoodenCrateNarrationUrls()
    expect(urls.length).toBe(41)
    expect(new Set(urls).size).toBe(41)
  })

  it('registry narration URLs stay under the public story narration path', () => {
    for (const url of getSecretWoodenCrateNarrationUrls()) {
      expect(url.startsWith(NARR_PREFIX), url).toBe(true)
      expect(url.includes('BIOWIRA_UI_REFERENCES'), url).toBe(false)
      for (const bad of OBSOLETE_NARR_SUBSTRINGS) {
        expect(url.includes(bad), `unexpected obsolete segment in ${url}`).toBe(false)
      }
    }
  })

  it('catalog narration paths use registry constants (no BIOWIRA or obsolete splits)', () => {
    for (const panel of Object.values(SECRET_WOODEN_CRATE_STORY.panels)) {
      for (const u of panel.narrationAudioSrcs ?? []) {
        expect(u.startsWith(NARR_PREFIX), `${panel.id}: ${u}`).toBe(true)
        expect(u.includes('BIOWIRA_UI_REFERENCES')).toBe(false)
        for (const bad of OBSOLETE_NARR_SUBSTRINGS) {
          expect(u.includes(bad), `${panel.id}: ${u}`).toBe(false)
        }
      }
    }
  })

  it('every narration URL maps to a non-empty file under public/', () => {
    for (const url of getSecretWoodenCrateNarrationUrls()) {
      const disk = publicDiskPathFromUrl(url)
      expect(fs.existsSync(disk), `missing MP3 on disk for ${url} → ${disk}`).toBe(true)
      const st = fs.statSync(disk)
      expect(st.size, `empty file: ${disk}`).toBeGreaterThan(0)
    }
  })

  it('spot-check key panel filenames', () => {
    const p = SECRET_WOODEN_CRATE_STORY.panels
    expect(p['opening']!.narrationAudioSrcs?.[0]).toBe(SECRET_WOODEN_CRATE_ASSETS.narration.opening)
    expect(p['opening']!.narrationAudioSrcs?.[0]).toContain('opening.mp3')

    expect(p['scene_4']!.narrationAudioSrcs?.[0]).toContain('scene-04.mp3')
    expect(p['scene_5']!.narrationAudioSrcs?.[0]).toContain('scene-05.mp3')
    expect(p['scene_6']!.narrationAudioSrcs?.[0]).toContain('scene-06.mp3')

    expect(p['path_a1_19']!.narrationAudioSrcs?.[0]).toContain('path-aa-scene-19.mp3')
    expect(p['path_a2_19']!.narrationAudioSrcs?.[0]).toContain('path-ab-scene-19.mp3')
    expect(p['path_b_17']!.narrationAudioSrcs?.[0]).toContain('path-b-scene-17.mp3')
    expect(p['path_b_18']!.narrationAudioSrcs?.[0]).toContain('path-b-scene-18.mp3')
  })

  it('buildEcoComicNarrationText still returns readable fallback text', () => {
    const panel = SECRET_WOODEN_CRATE_STORY.panels['scene_1']!
    const text = buildEcoComicNarrationText(panel)
    expect(text.length).toBeGreaterThan(20)
    expect(text).toContain('Fatimah')
  })

  it('EcoComicReaderPage passes audio-srcs to EcoComicNarrationButton', async () => {
    const NarrProbe = defineComponent({
      name: 'EcoComicNarrationButton',
      props: {
        text: { type: String, required: true },
        audioSrcs: { type: Array, default: undefined },
      },
      setup(props) {
        return () =>
          h('div', {
            'data-probe-audio-srcs': JSON.stringify(props.audioSrcs ?? null),
            'data-testid': 'eco-comic-narration-btn-wrap',
          })
      },
    })

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
          EcoComicNarrationButton: NarrProbe,
        },
      },
    })
    await flushPromises()

    const probe = wrapper.find('[data-probe-audio-srcs]')
    expect(probe.exists()).toBe(true)
    const parsed = JSON.parse(probe.attributes('data-probe-audio-srcs') ?? 'null') as string[] | null
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed?.[0]).toContain('opening.mp3')
  })
})
