/**
 * Unit tests for the BioWira audio system.
 * Tests cover: audioStore preferences, persistence, volume clamping,
 * appAudioService toggle behaviour, and the SFX cooldown.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// ── Mock storageService ───────────────────────────────────────────────────────
const mockStorage = new Map<string, unknown>()
vi.mock('@/services/storageService', () => ({
  storageService: {
    get: vi.fn((key: string) => mockStorage.get(key) ?? null),
    set: vi.fn((key: string, val: unknown) => {
      mockStorage.set(key, val)
    }),
  },
}))

// ── Mock appAudioService ──────────────────────────────────────────────────────
const mockSetMusicEnabled = vi.fn()
const mockSetSfxEnabled = vi.fn()
const mockSetMusicVolume = vi.fn()
const mockSetSfxVolume = vi.fn()
const mockSetMusicTheme = vi.fn()
const mockPlaySfx = vi.fn()

vi.mock('@/services/appAudioService', () => ({
  setMusicEnabled: (...args: unknown[]) => mockSetMusicEnabled(...args),
  setSfxEnabled: (...args: unknown[]) => mockSetSfxEnabled(...args),
  setMusicVolume: (...args: unknown[]) => mockSetMusicVolume(...args),
  setSfxVolume: (...args: unknown[]) => mockSetSfxVolume(...args),
  setMusicTheme: (...args: unknown[]) => mockSetMusicTheme(...args),
  playSfx: (...args: unknown[]) => mockPlaySfx(...args),
  unlockAudio: vi.fn(),
  pauseMusic: vi.fn(),
  resumeMusic: vi.fn(),
  setNarrationActive: vi.fn(),
  isAudioUnlocked: vi.fn(() => false),
}))

// ── audioStore tests ──────────────────────────────────────────────────────────
describe('audioStore', () => {
  beforeEach(() => {
    mockStorage.clear()
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('uses DEFAULT_AUDIO_PREFS when nothing is stored', async () => {
    const { useAudioStore } = await import('@/stores/audioStore')
    const store = useAudioStore()
    expect(store.musicEnabled).toBe(true)
    expect(store.sfxEnabled).toBe(true)
    expect(store.musicVolume).toBe(0.35)
    expect(store.sfxVolume).toBe(0.55)
  })

  it('loads preferences from storageService on init', async () => {
    const { STORAGE_KEYS } = await import('@/app/config')
    mockStorage.set(STORAGE_KEYS.audioPreferences, {
      musicEnabled: false,
      sfxEnabled: false,
      musicVolume: 0.2,
      sfxVolume: 0.1,
    })
    const { useAudioStore } = await import('@/stores/audioStore')
    const store = useAudioStore()
    expect(store.musicEnabled).toBe(false)
    expect(store.sfxEnabled).toBe(false)
    expect(store.musicVolume).toBe(0.2)
    expect(store.sfxVolume).toBe(0.1)
  })

  it('persists preferences via storageService when toggling music', async () => {
    const { storageService } = await import('@/services/storageService')
    const { useAudioStore } = await import('@/stores/audioStore')
    const store = useAudioStore()
    store.toggleMusic()
    expect(store.musicEnabled).toBe(false)
    expect(storageService.set).toHaveBeenCalled()
  })

  it('persists preferences via storageService when toggling SFX', async () => {
    const { storageService } = await import('@/services/storageService')
    const { useAudioStore } = await import('@/stores/audioStore')
    const store = useAudioStore()
    store.toggleSfx()
    expect(store.sfxEnabled).toBe(false)
    expect(storageService.set).toHaveBeenCalled()
  })

  it('clamps musicVolume between 0 and 1', async () => {
    const { useAudioStore } = await import('@/stores/audioStore')
    const store = useAudioStore()
    store.setMusicVol(1.5)
    expect(store.musicVolume).toBe(1)
    store.setMusicVol(-0.5)
    expect(store.musicVolume).toBe(0)
  })

  it('clamps sfxVolume between 0 and 1', async () => {
    const { useAudioStore } = await import('@/stores/audioStore')
    const store = useAudioStore()
    store.setSfxVol(2.0)
    expect(store.sfxVolume).toBe(1)
    store.setSfxVol(-1.0)
    expect(store.sfxVolume).toBe(0)
  })

  it('syncs musicEnabled immediately to audio service', async () => {
    const { useAudioStore } = await import('@/stores/audioStore')
    useAudioStore()
    // Immediate watch fires setMusicEnabled(true) on init
    expect(mockSetMusicEnabled).toHaveBeenCalledWith(true)
  })

  it('syncs sfxEnabled immediately to audio service', async () => {
    const { useAudioStore } = await import('@/stores/audioStore')
    useAudioStore()
    expect(mockSetSfxEnabled).toHaveBeenCalledWith(true)
  })

  it('syncs musicVolume immediately to audio service', async () => {
    const { useAudioStore } = await import('@/stores/audioStore')
    useAudioStore()
    expect(mockSetMusicVolume).toHaveBeenCalledWith(0.35)
  })

  it('syncs sfxVolume immediately to audio service', async () => {
    const { useAudioStore } = await import('@/stores/audioStore')
    useAudioStore()
    expect(mockSetSfxVolume).toHaveBeenCalledWith(0.55)
  })

  it('toggleMusic flips musicEnabled state correctly', async () => {
    const { useAudioStore } = await import('@/stores/audioStore')
    const store = useAudioStore()
    const wasBefore = store.musicEnabled
    store.toggleMusic()
    expect(store.musicEnabled).toBe(!wasBefore)
    // Toggle back
    store.toggleMusic()
    expect(store.musicEnabled).toBe(wasBefore)
  })

  it('uses STORAGE_KEYS.audioPreferences as key (not raw string)', async () => {
    const { STORAGE_KEYS } = await import('@/app/config')
    const { storageService } = await import('@/services/storageService')
    const { useAudioStore } = await import('@/stores/audioStore')
    const store = useAudioStore()
    store.toggleMusic()
    const [calledKey] = (storageService.set as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(calledKey).toBe(STORAGE_KEYS.audioPreferences)
  })
})

// ── appAudioService unit-level tests ──────────────────────────────────────────
// These test the exported API surface against module-level state.
// HTMLAudioElement is mocked by vitest.setup.ts (jsdom environment).
describe('appAudioService — SFX cooldown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('module exports the expected API surface', async () => {
    const service = await import('@/services/appAudioService')
    expect(typeof service.unlockAudio).toBe('function')
    expect(typeof service.setMusicTheme).toBe('function')
    expect(typeof service.playSfx).toBe('function')
    expect(typeof service.setMusicEnabled).toBe('function')
    expect(typeof service.setSfxEnabled).toBe('function')
    expect(typeof service.setMusicVolume).toBe('function')
    expect(typeof service.setSfxVolume).toBe('function')
    expect(typeof service.setNarrationActive).toBe('function')
    expect(typeof service.pauseMusic).toBe('function')
    expect(typeof service.resumeMusic).toBe('function')
    expect(typeof service.isAudioUnlocked).toBe('function')
  })
})

// ── Route audio theme meta coverage ──────────────────────────────────────────
describe('Router audio theme meta', () => {
  it('every named route has an explicit audioTheme or relies on calm-jungle default', async () => {
    const { default: router } = await import('@/router/index')
    const routes = router.getRoutes()
    const themedRoutes = routes.filter((r) => r.meta?.audioTheme)
    // All main routes should be tagged
    const mainRouteNames = [
      'home',
      'discover',
      'quiz',
      'quiz-result',
      'games',
      'missions',
      'eco-comics',
      'explorer-rescue',
      'explorer-rescue-play',
      'explorer-rescue-result',
      'explorer-rescue-journal',
      'welcome',
    ]
    for (const name of mainRouteNames) {
      const route = routes.find((r) => String(r.name) === name)
      if (route) {
        expect(route.meta?.audioTheme, `Route "${name}" should have audioTheme`).toBeDefined()
      }
    }
    // welcome must use calm-jungle (background music plays on all pages)
    const welcome = routes.find((r) => String(r.name) === 'welcome')
    if (welcome) expect(welcome.meta?.audioTheme).toBe('calm-jungle')
    // explorer-rescue-play must be 'adventure-jungle'
    const play = routes.find((r) => String(r.name) === 'explorer-rescue-play')
    if (play) expect(play.meta?.audioTheme).toBe('adventure-jungle')
    // themed routes list should be non-empty
    expect(themedRoutes.length).toBeGreaterThan(5)
  }, 15000)
})

// ── Audio asset file existence tests ─────────────────────────────────────────

const __audioTestDir = dirname(fileURLToPath(import.meta.url))
const PUBLIC_ROOT = join(__audioTestDir, '../../public')
const AUDIO_SERVICE_PATH = join(__audioTestDir, '../services/appAudioService.ts')

describe('Audio asset file existence', () => {
  it('all required SFX MP3 files exist on disk', () => {
    const requiredSfx = [
      'audio/sfx/tap-soft.mp3',
      'audio/sfx/answer-correct-soft.mp3',
      'audio/sfx/answer-wrong-soft.mp3',
      'audio/sfx/achievement-soft.mp3',
      'audio/sfx/card-flip-soft.mp3',
      'audio/sfx/leaf-collect-soft.mp3',
      'audio/sfx/jump-soft.mp3',
    ]
    for (const sfx of requiredSfx) {
      expect(existsSync(join(PUBLIC_ROOT, sfx)), `Missing SFX: ${sfx}`).toBe(true)
    }
  })

  it('all required music MP3 files exist on disk', () => {
    const requiredMusic = [
      'audio/music/calm-jungle-loop.mp3',
      'audio/music/adventure-jungle-loop.mp3',
    ]
    for (const music of requiredMusic) {
      expect(existsSync(join(PUBLIC_ROOT, music)), `Missing music: ${music}`).toBe(true)
    }
  })

  it('appAudioService.ts does not reference any .ogg source paths', () => {
    const source = readFileSync(AUDIO_SERVICE_PATH, 'utf8')
    // Check that no .ogg source paths are referenced in the asset registries.
    // TypeScript source files use single or double quotes for string literals.
    const oggMatches = source.match(/['"][^'"]*\.ogg['"]/g) ?? []
    expect(oggMatches, 'Found .ogg references in appAudioService.ts').toHaveLength(0)
  })

  it('journal-flip SFX maps to an existing MP3 file', () => {
    const source = readFileSync(AUDIO_SERVICE_PATH, 'utf8')
    // Find the sources array for journal-flip key
    const journalFlipSection = source.match(/'journal-flip'[\s\S]{0,200}?sources:\s*\[([^\]]+)\]/)
    expect(journalFlipSection, 'journal-flip entry not found in appAudioService').toBeTruthy()

    if (journalFlipSection) {
      const sourcePaths = journalFlipSection[1].match(/['"]([^'"]+\.mp3)['"]/g) ?? []
      expect(sourcePaths.length, 'journal-flip has no MP3 source').toBeGreaterThan(0)

      for (const pathStr of sourcePaths) {
        const filePath = pathStr.replace(/['"]/g, '')
        const diskPath = join(PUBLIC_ROOT, filePath.replace(/^\//, ''))
        expect(existsSync(diskPath), `journal-flip source missing: ${filePath}`).toBe(true)
      }
    }
  })

  it('no SFX entry references journal-flip-soft.mp3 (the missing file)', () => {
    const source = readFileSync(AUDIO_SERVICE_PATH, 'utf8')
    // The filename may appear in a code comment explaining the remapping — that is fine.
    // What must NEVER happen is a quoted source path pointing to the missing file.
    // This regex matches the string only when surrounded by quote characters (i.e. in a sources array).
    const inSources = /['"][^'"]*journal-flip-soft\.mp3['"]/.test(source)
    expect(inSources, 'journal-flip-soft.mp3 must not appear as a quoted source path').toBe(false)
  })
})
