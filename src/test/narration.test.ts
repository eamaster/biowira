import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick, defineComponent } from 'vue'
import {
  tokenizeToWordSpans,
  wordIndexFromCharIndex,
  wordIndexFromLinearCharProgress,
} from '@/utils/narrationTokenize'
import { buildAnimalNarrationText } from '@/domain/buildAnimalNarrationText'
import { useAudio } from '@/composables/useAudio'
import { mount } from '@vue/test-utils'
import ReadAlongText from '@/components/ui/ReadAlongText.vue'
import AnimalProfileSheet from '@/features/discover/components/AnimalProfileSheet.vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { wordIndexFromTimings } from '@/utils/narrationTimings'

describe('narration tokenization', () => {
  it('tokenizeToWordSpans splits on whitespace and keeps punctuation on tokens', () => {
    const spans = tokenizeToWordSpans('Hello,   world!\nAgain.')
    expect(spans.map((s) => s.word)).toEqual(['Hello,', 'world!', 'Again.'])
    expect(spans[0]).toMatchObject({ start: 0, end: 6 })
    expect(spans[1]).toMatchObject({ start: 9, end: 15 })
  })

  it('wordIndexFromCharIndex maps charIndex to the correct token', () => {
    const spans = tokenizeToWordSpans('One two three')
    expect(wordIndexFromCharIndex(spans, 0)).toBe(0)
    expect(wordIndexFromCharIndex(spans, 4)).toBe(1)
    // Index 7 is the space before "three" — maps to the following word
    expect(wordIndexFromCharIndex(spans, 7)).toBe(2)
    expect(wordIndexFromCharIndex(spans, 8)).toBe(2)
  })

  it('wordIndexFromCharIndex handles space between words', () => {
    const spans = tokenizeToWordSpans('aa bb')
    expect(wordIndexFromCharIndex(spans, 2)).toBe(1)
  })

  it('wordIndexFromLinearCharProgress is stable end-to-end', () => {
    const spans = tokenizeToWordSpans('alpha beta gamma')
    const len = 'alpha beta gamma'.length
    expect(wordIndexFromLinearCharProgress(spans, len, 0)).toBe(0)
    expect(wordIndexFromLinearCharProgress(spans, len, 0.5)).toBeGreaterThanOrEqual(0)
    expect(wordIndexFromLinearCharProgress(spans, len, 1)).toBe(2)
  })
})

describe('wordIndexFromTimings (backend TTS ms timings)', () => {
  /** Same shape as useNarrationAudio after converting seconds → ms */
  const SAMPLE_TIMINGS_MS = [
    { word: 'Hello', startMs: 0, endMs: 320 },
    { word: 'from', startMs: 368, endMs: 560 },
    { word: 'the', startMs: 580, endMs: 640 },
    { word: 'TTS', startMs: 760, endMs: 1200 },
    { word: 'cache', startMs: 1267, endMs: 1602 },
    { word: 'API.', startMs: 1782, endMs: 2642 },
  ]

  it('maps playback ms to the active word index', () => {
    expect(wordIndexFromTimings(100, SAMPLE_TIMINGS_MS)).toBe(0) // Hello
    expect(wordIndexFromTimings(400, SAMPLE_TIMINGS_MS)).toBe(1) // from
    expect(wordIndexFromTimings(700, SAMPLE_TIMINGS_MS)).toBe(2) // gap → previous word "the"
    expect(wordIndexFromTimings(1300, SAMPLE_TIMINGS_MS)).toBe(4) // cache
    expect(wordIndexFromTimings(3000, SAMPLE_TIMINGS_MS)).toBe(5) // past last end → last word
  })

  it('returns -1 before the first word starts', () => {
    expect(wordIndexFromTimings(-1, SAMPLE_TIMINGS_MS)).toBe(-1)
  })
})

describe('buildAnimalNarrationText', () => {
  it('uses only API description (read-along); never merges conservationExplanation', () => {
    const body =
      'Malayan Tiger. The Malayan Tiger is Malaysia\'s national animal. They need big forests to survive!'
    const text = buildAnimalNarrationText({
      description: body,
    })
    expect(text).toBe(body)
    expect(text).not.toContain('Why it matters')
    expect(text).not.toContain('big problems')
  })

  it('does not include conservationExplanation even when different from description', () => {
    const text = buildAnimalNarrationText({
      description: 'Short body text.',
    })
    expect(text).toBe('Short body text.')
  })
})

function mountUseAudio(initial: string) {
  const C = defineComponent({
    setup() {
      const textRef = ref(initial)
      const api = useAudio(() => textRef.value)
      return {
        textRef,
        isPlaying: api.isPlaying,
        currentTimeMs: api.currentTimeMs,
        durationMs: api.durationMs,
        highlightedWordIndex: api.highlightedWordIndex,
        words: api.words,
        isAvailable: api.isAvailable,
        play: api.play,
        pause: api.pause,
        seek: api.seek,
        reset: api.reset,
      }
    },
    template: '<div />',
  })
  const wrapper = mount(C)
  return { wrapper, vm: wrapper.vm as Record<string, unknown> }
}

describe('useAudio (browser TTS)', () => {
  let lastUtterance: SpeechSynthesisUtterance | null = null
  let synthSpeaking = false
  let synthPaused = false

  beforeEach(() => {
    vi.useFakeTimers()
    lastUtterance = null
    synthSpeaking = false
    synthPaused = false

    class MockUtterance {
      text: string
      rate = 1
      pitch = 1
      onboundary: ((ev: SpeechSynthesisEvent) => void) | null = null
      onend: (() => void) | null = null
      onerror: (() => void) | null = null
      constructor(text: string) {
        this.text = text
      }
    }

    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance)

    const synth = {
      get speaking() {
        return synthSpeaking
      },
      get paused() {
        return synthPaused
      },
      speak: vi.fn((u: SpeechSynthesisUtterance) => {
        lastUtterance = u
        synthSpeaking = true
        synthPaused = false
      }),
      cancel: vi.fn(() => {
        synthSpeaking = false
        synthPaused = false
      }),
      pause: vi.fn(() => {
        synthPaused = true
      }),
      resume: vi.fn(() => {
        synthPaused = false
        synthSpeaking = true
      }),
    }

    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: synth,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('maps word boundary charIndex to highlightedWordIndex', async () => {
    const { vm } = mountUseAudio('One two three')
    const play = vm.play as () => void

    await nextTick()
    play()
    await nextTick()

    expect(lastUtterance).toBeTruthy()
    expect(lastUtterance!.text).toBe('One two three')

    const ev = new Event('boundary') as SpeechSynthesisEvent
    Object.assign(ev, { name: 'word', charIndex: 4 })
    lastUtterance!.onboundary?.(ev)
    expect(vm.highlightedWordIndex).toBe(1)

    lastUtterance!.onend?.()
    expect(vm.isPlaying).toBe(false)
  })

  it('seek while stopped updates highlight and play speaks from snapped word offset', async () => {
    const { vm } = mountUseAudio('alpha beta gamma delta')
    const play = vm.play as () => void
    const seek = vm.seek as (ms: number) => void

    await nextTick()
    seek((vm.durationMs as number) * 0.45)
    await nextTick()
    expect(vm.highlightedWordIndex as number).toBeGreaterThanOrEqual(0)

    play()
    await nextTick()
    expect(lastUtterance).toBeTruthy()
    expect(lastUtterance!.text.length).toBeLessThan('alpha beta gamma delta'.length)
    expect(lastUtterance!.text).toMatch(/beta|gamma|delta/)
  })

  it('fallback advances highlight via timer when no boundary events fire', async () => {
    const { vm } = mountUseAudio('aa bb cc dd')
    const play = vm.play as () => void

    await nextTick()
    play()
    await nextTick()
    expect(lastUtterance).toBeTruthy()

    const start = vm.highlightedWordIndex as number
    vi.advanceTimersByTime(2000)
    await nextTick()
    expect(vm.highlightedWordIndex as number).toBeGreaterThanOrEqual(start)
  })

  it('pause then resume does not reset highlight to zero', async () => {
    const { vm } = mountUseAudio('first second third')
    const play = vm.play as () => void
    const pause = vm.pause as () => void

    await nextTick()
    play()
    await nextTick()

    const ev = new Event('boundary') as SpeechSynthesisEvent
    Object.assign(ev, { name: 'word', charIndex: 6 })
    lastUtterance!.onboundary?.(ev)
    const atPause = vm.highlightedWordIndex as number

    pause()
    await nextTick()

    play()
    await nextTick()
    expect(vm.highlightedWordIndex as number).toBe(atPause)
  })
})

describe('ReadAlongText + AnimalProfileSheet (Discover)', () => {
  it('ReadAlongText highlights the active word without errors', () => {
    const w = mount(ReadAlongText, {
      props: { words: ['Hello', 'world'], highlightedIndex: 1, size: 'md' },
    })
    expect(w.findAll('.read-along__word--active')).toHaveLength(1)
  })

  it('AnimalProfileSheet renders narration block for an animal', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'home', component: { template: '<div />' } }],
    })
    const wrapper = mount(AnimalProfileSheet, {
      props: {
        animal: {
          id: 't1',
          commonName: 'Test Animal',
          scientificName: 'Testus animalis',
          category: 'mammals',
          habitat: 'rainforest',
          diet: 'Plants',
          lifespan: '10 years',
          conservationStatus: 'least_concern',
          conservationReason: 'Stable',
          conservationExplanation: 'Doing fine.',
          description: 'A gentle creature.',
          funFact: 'Fun',
          iconEmoji: '🦎',
          mapPosition: { desktop: { x: 50, y: 50 } },
          occurrences: [],
        },
      },
      global: {
        plugins: [pinia, router],
        stubs: {
          PixelButton: true,
          PixelStatusBadge: true,
          NarrationPlayer: true,
          AnimalIcon: true,
        },
      },
    })
    expect(wrapper.find('.profile__read-along').exists()).toBe(true)
  })
})
