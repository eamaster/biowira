import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useNarrationAudio } from './useNarrationAudio'
import { appConfig } from '@/app/config'
import * as narrationService from '@/services/narrationService'
import { useAudio } from '@/composables/useAudio'

/**
 * Integration tests for API narration wiring (generate → resolve URL → words/duration).
 *
 * Timing-based highlight behaviour is covered by `wordIndexFromTimings` in
 * `src/utils/narrationTimings.ts` + `src/test/narration.test.ts` — not duplicated here.
 *
 * Do not `await nextTick()` right after `await play()` unless you changed reactive text: an extra
 * flush can re-run the text watcher and call `destroyAudio()`, which breaks mocked Audio listener
 * assertions (browser behaviour does not match this artificial sequence).
 */

vi.mock('@/app/config', () => ({
  appConfig: {
    narrationSource: 'api',
    tts: {
      voiceId: 'rCmVtv8cYU60uhlsOo1M',
      modelId: 'eleven_v3',
      speed: 1,
    },
  },
}))

vi.mock('@/services/narrationService', () => ({
  generateNarrationTts: vi.fn(),
  resolveNarrationAudioUrl: vi.fn((url: string) => {
    try {
      const parsed = new URL(url)
      if (parsed.pathname.startsWith('/api/')) {
        return parsed.pathname + parsed.search + parsed.hash
      }
      return url
    } catch {
      return url
    }
  }),
}))

vi.mock('@/composables/useAudio', () => ({
  useAudio: vi.fn(() => ({
    isPlaying: ref(false),
    currentTimeMs: ref(0),
    durationMs: ref(0),
    highlightedWordIndex: ref(-1),
    words: ref([]),
    isAvailable: ref(true),
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
    reset: vi.fn(),
  })),
}))

const MOCK_TTS_RESPONSE = {
  textHash: 'hash',
  voiceId: 'rCmVtv8cYU60uhlsOo1M',
  modelId: 'eleven_v3',
  speed: 1,
  mimeType: 'audio/mpeg',
  cached: false,
  audioUrl: 'http://localhost:5215/api/v1/tts/audio/hash',
  timings: [
    { word: 'Hello', start: 0, end: 0.32 },
    { word: 'from', start: 0.368, end: 0.56 },
    { word: 'the', start: 0.58, end: 0.64 },
    { word: 'TTS', start: 0.76, end: 1.2 },
    { word: 'cache', start: 1.267, end: 1.602 },
    { word: 'API.', start: 1.782, end: 2.642 },
  ],
}

/** Minimal Audio stub — happy-dom may not fire real media events. */
function makeMockAudio() {
  return {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    currentTime: 0,
    duration: 3,
    onloadedmetadata: null as (() => void) | null,
    ontimeupdate: null as (() => void) | null,
    onended: null as (() => void) | null,
    onerror: null as (() => void) | null,
  }
}

describe('useNarrationAudio', () => {
  let originalSource: 'browser' | 'api'

  beforeEach(() => {
    originalSource = appConfig.narrationSource
    vi.mocked(useAudio).mockClear()
  })

  afterEach(() => {
    appConfig.narrationSource = originalSource
    vi.unstubAllGlobals()
  })

  it('delegates to useAudio when mode is browser', () => {
    appConfig.narrationSource = 'browser'
    useNarrationAudio('Hello')

    expect(useAudio).toHaveBeenCalled()
  })

  it('calls generateNarrationTts when play is clicked in api mode', async () => {
    appConfig.narrationSource = 'api'
    vi.spyOn(narrationService, 'generateNarrationTts').mockResolvedValue(MOCK_TTS_RESPONSE)

    const mockAudio = makeMockAudio()
    vi.stubGlobal('Audio', vi.fn().mockReturnValue(mockAudio))

    const audio = useNarrationAudio('Hello from the TTS cache API.')
    await audio.play()

    expect(narrationService.generateNarrationTts).toHaveBeenCalledWith(
      'Hello from the TTS cache API.',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('does not use URL.createObjectURL for API narration', async () => {
    appConfig.narrationSource = 'api'
    vi.spyOn(narrationService, 'generateNarrationTts').mockResolvedValue(MOCK_TTS_RESPONSE)

    const mockAudio = makeMockAudio()
    vi.stubGlobal('Audio', vi.fn().mockReturnValue(mockAudio))
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL')

    try {
      const audio = useNarrationAudio('Hello from the TTS cache API.')
      await audio.play()

      expect(createObjectUrlSpy).not.toHaveBeenCalled()
    } finally {
      createObjectUrlSpy.mockRestore()
    }
  })

  /**
   * Uses the mocked {@link narrationService.resolveNarrationAudioUrl} here (same shape as prod).
   * Exact URL rules are covered in apiClient / narrationService tests.
   */
  it('passes resolved same-origin audio path to Audio()', async () => {
    appConfig.narrationSource = 'api'
    vi.spyOn(narrationService, 'generateNarrationTts').mockResolvedValue(MOCK_TTS_RESPONSE)

    const mockAudio = makeMockAudio()
    const AudioSpy = vi.fn().mockReturnValue(mockAudio)
    vi.stubGlobal('Audio', AudioSpy)

    const audio = useNarrationAudio('Hello from the TTS cache API.')
    await audio.play()

    expect(AudioSpy).toHaveBeenCalledWith('/api/v1/tts/audio/hash')
  })

  it('replaces words from backend timings after play', async () => {
    appConfig.narrationSource = 'api'
    vi.spyOn(narrationService, 'generateNarrationTts').mockResolvedValue(MOCK_TTS_RESPONSE)

    const mockAudio = makeMockAudio()
    vi.stubGlobal('Audio', vi.fn().mockReturnValue(mockAudio))

    const audio = useNarrationAudio('Hello from the TTS cache API.')
    await audio.play()

    expect(audio.words.value).toEqual(['Hello', 'from', 'the', 'TTS', 'cache', 'API.'])
  })

  it('sets durationMs from last timing end when timings exist', async () => {
    appConfig.narrationSource = 'api'
    vi.spyOn(narrationService, 'generateNarrationTts').mockResolvedValue(MOCK_TTS_RESPONSE)

    const mockAudio = makeMockAudio()
    vi.stubGlobal('Audio', vi.fn().mockReturnValue(mockAudio))

    const audio = useNarrationAudio('Hello from the TTS cache API.')
    await audio.play()

    expect(audio.durationMs.value).toBeGreaterThanOrEqual(2642)
  })

  it('changing reactive text resets words after Vue flushes the watcher', async () => {
    appConfig.narrationSource = 'api'
    vi.spyOn(narrationService, 'generateNarrationTts').mockResolvedValue(MOCK_TTS_RESPONSE)

    const mockAudio = makeMockAudio()
    vi.stubGlobal('Audio', vi.fn().mockReturnValue(mockAudio))

    const textRef = ref('Hello from the TTS cache API.')
    const audio = useNarrationAudio(textRef)
    await audio.play()

    expect(audio.words.value).toEqual(['Hello', 'from', 'the', 'TTS', 'cache', 'API.'])

    textRef.value = 'New animal text.'
    await nextTick()

    expect(audio.words.value).toEqual(['New', 'animal', 'text.'])
    expect(audio.highlightedWordIndex.value).toBe(-1)
    expect(audio.isPlaying.value).toBe(false)
  })

  it('API fetch failure sets load error and does not call browser TTS', async () => {
    appConfig.narrationSource = 'api'
    vi.spyOn(narrationService, 'generateNarrationTts').mockRejectedValue(new Error('Network error'))

    const mockAudio = makeMockAudio()
    vi.stubGlobal('Audio', vi.fn().mockReturnValue(mockAudio))

    vi.mocked(useAudio).mockClear()

    const audio = useNarrationAudio('Hello from the TTS cache API.')
    await audio.play()

    expect(useAudio).not.toHaveBeenCalled()
    expect(audio.errorMessage.value).toBe("Oops! We couldn't load the narration. Please try again.")
    expect(audio.isPlaying.value).toBe(false)
  })
})
