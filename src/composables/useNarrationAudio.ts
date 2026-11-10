import { ref, watch, toValue, type MaybeRefOrGetter } from 'vue'
import { appConfig } from '@/app/config'
import { useAudio } from '@/composables/useAudio'
import * as narrationService from '@/services/narrationService'
import { tokenizeToWordSpans } from '@/utils/narrationTokenize'
import { wordIndexFromTimings, type WordTimingMs } from '@/utils/narrationTimings'
import { setNarrationActive } from '@/services/appAudioService'

/** ~rate 0.85 utterance — rough ms per character for duration estimate */
const MS_PER_CHAR = 58
const MIN_DURATION_MS = 2000

function estimateDurationMs(text: string, wordCount: number): number {
  const charPart = text.length * MS_PER_CHAR
  const wordPart = wordCount * 340
  return Math.max(MIN_DURATION_MS, Math.round(Math.max(charPart, wordPart)))
}

/**
 * Narration composable that unifies Web Speech API (browser mode) and
 * BioWira backend ElevenLabs cached TTS (api mode) under a single reactive interface.
 *
 * Mode is controlled by appConfig.narrationSource (VITE_NARRATION_SOURCE env).
 * Default is 'api' — BioWira backend /api/v1/tts/generate.
 * Set VITE_NARRATION_SOURCE=browser for an explicit Web Speech API fallback.
 *
 * Security: no ElevenLabs credentials are touched here.
 * The backend endpoint handles all ElevenLabs configuration and caching server-side.
 */
export function useNarrationAudio(textSource: MaybeRefOrGetter<string>) {
  // ── Browser mode: delegate entirely to the existing useAudio composable ──────
  if (appConfig.narrationSource === 'browser') {
    if (import.meta.env.DEV) {
      console.info('[BioWira narration] Using browser TTS fallback (VITE_NARRATION_SOURCE=browser)')
    }
    const browser = useAudio(textSource)
    // Duck background music while browser TTS is playing
    watch(browser.isPlaying, (playing) => setNarrationActive(playing))
    return {
      isPlaying: browser.isPlaying,
      currentTimeMs: browser.currentTimeMs,
      durationMs: browser.durationMs,
      highlightedWordIndex: browser.highlightedWordIndex,
      words: browser.words,
      isAvailable: browser.isAvailable,
      isLoading: ref(false),
      errorMessage: ref<string | null>(null),
      play: browser.play,
      pause: browser.pause,
      seek: browser.seek,
      reset: browser.reset,
      destroy: () => {
        browser.reset()
        setNarrationActive(false)
      },
    }
  }

  // ── API mode: fetch metadata from backend and play via HTMLAudioElement ───────

  const isPlaying = ref(false)
  const currentTimeMs = ref(0)
  const durationMs = ref(0)
  const highlightedWordIndex = ref(-1)
  const words = ref<string[]>([])
  const isAvailable = ref(true)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  let wordTimings: WordTimingMs[] = []
  let narrationText = ''
  let lastMimeType = 'audio/mpeg'

  let audioEl: HTMLAudioElement | null = null
  let abortController: AbortController | null = null

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function stopBrowserSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
      } catch {
        // Ignore synthesis cancel exceptions
      }
    }
  }

  function removeAudioListeners() {
    if (!audioEl) return
    audioEl.onloadedmetadata = null
    audioEl.ontimeupdate = null
    audioEl.onended = null
    audioEl.onerror = null
  }

  function stopAudio() {
    stopBrowserSpeech()
    if (audioEl) {
      try {
        audioEl.pause()
      } catch {
        // Ignore DOMException if audio was never started
      }
    }
    isPlaying.value = false
  }

  function destroyAudio() {
    stopAudio()
    removeAudioListeners()
    audioEl = null
  }

  function abortFetch() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  function attachAudioListeners(el: HTMLAudioElement) {
    el.onloadedmetadata = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) {
        const audioDurationMs = el.duration * 1000
        if (wordTimings.length > 0) {
          const lastTimingEndMs = Math.max(...wordTimings.map((t) => t.endMs))
          durationMs.value = Math.max(audioDurationMs, lastTimingEndMs)
        } else {
          durationMs.value = audioDurationMs
        }
      }
    }

    el.ontimeupdate = () => {
      currentTimeMs.value = el.currentTime * 1000
      if (wordTimings.length > 0) {
        highlightedWordIndex.value = wordIndexFromTimings(currentTimeMs.value, wordTimings)
      }
    }

    el.onended = () => {
      isPlaying.value = false
      setNarrationActive(false)
      stopBrowserSpeech()
      currentTimeMs.value = durationMs.value
      highlightedWordIndex.value = words.value.length - 1
    }

    el.onerror = () => {
      // If HTMLAudioElement media stream fails, fallback to browser Web Speech API
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && narrationText) {
        try {
          stopBrowserSpeech()
          const utterance = new SpeechSynthesisUtterance(narrationText)
          utterance.rate = 0.9
          utterance.lang = 'en-US'
          utterance.onend = () => {
            isPlaying.value = false
            setNarrationActive(false)
          }
          window.speechSynthesis.speak(utterance)
          isPlaying.value = true
          setNarrationActive(true)
          return
        } catch {}
      }
      isPlaying.value = false
      setNarrationActive(false)
      errorMessage.value = "Oops! We couldn't load the narration. Please try again."
    }
  }

  // ── Text watcher — reset state when animal/text changes ──────────────────────

  watch(
    () => toValue(textSource),
    (newText) => {
      abortFetch()
      destroyAudio()
      wordTimings = []
      currentTimeMs.value = 0
      highlightedWordIndex.value = -1
      isPlaying.value = false
      isLoading.value = false
      errorMessage.value = null

      const trimmed = newText.trim()
      if (trimmed) {
        narrationText = trimmed
        // Immediately populate words from local tokenization so the UI is not empty
        // before the API returns. When backend timings arrive, words is replaced.
        const spans = tokenizeToWordSpans(trimmed)
        words.value = spans.map((s) => s.word)
        durationMs.value = estimateDurationMs(trimmed, spans.length)
      } else {
        narrationText = ''
        words.value = []
        durationMs.value = 0
      }
    },
    { immediate: true },
  )

  // ── Fetch TTS metadata and create HTMLAudioElement ────────────────────────────

  async function fetchAndPrepareAudio(): Promise<HTMLAudioElement> {
    abortFetch()
    abortController = new AbortController()

    isLoading.value = true
    errorMessage.value = null

    try {
      const metadata = await narrationService.generateNarrationTts(narrationText, {
        signal: abortController.signal,
      })

      // Convert timings from seconds → milliseconds and filter invalid entries
      const resolved: WordTimingMs[] = metadata.timings
        .filter(
          (t) =>
            typeof t.word === 'string' &&
            Number.isFinite(t.start) &&
            Number.isFinite(t.end),
        )
        .map((t) => ({
          word: t.word,
          startMs: t.start * 1000,
          endMs: t.end * 1000,
        }))

      wordTimings = resolved

      if (wordTimings.length > 0) {
        words.value = wordTimings.map((t) => t.word)
        durationMs.value = Math.max(...wordTimings.map((t) => t.endMs))
      }
      // else: keep the locally-tokenized words and estimated duration

      const audioSrc = narrationService.resolveNarrationAudioUrl(metadata.audioUrl)
      lastMimeType = metadata.mimeType || 'audio/mpeg'
      const el = new Audio(audioSrc)
      attachAudioListeners(el)
      audioEl = el

      isLoading.value = false
      return el
    } catch (err: unknown) {
      isLoading.value = false

      if (err instanceof DOMException && err.name === 'AbortError') throw err
      if (err instanceof Error && err.name === 'AbortError') throw err

      errorMessage.value = "Oops! We couldn't load the narration. Please try again."
      throw err
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  async function play() {
    if (isPlaying.value) return

    if (import.meta.env.DEV) {
      console.info('[BioWira narration] Requesting backend ElevenLabs TTS audio')
    }

    try {
      if (!audioEl) {
        const el = await fetchAndPrepareAudio()
        await el.play()
      } else {
        await audioEl.play()
      }
      isPlaying.value = true
      setNarrationActive(true)

      // When backend returned synthesized WAV timing fallback, speak via Web Speech API so voice is heard
      if (lastMimeType === 'audio/wav' && typeof window !== 'undefined' && 'speechSynthesis' in window && narrationText) {
        try {
          stopBrowserSpeech()
          const utterance = new SpeechSynthesisUtterance(narrationText)
          utterance.rate = 0.9
          utterance.lang = 'en-US'
          window.speechSynthesis.speak(utterance)
        } catch {
          // Ignore synthesis error
        }
      }
    } catch (err: unknown) {
      const isAbort =
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && err.name === 'AbortError')
      if (!isAbort) {
        isPlaying.value = false
        if (!errorMessage.value) {
          errorMessage.value = "Oops! We couldn't play the narration. Please try again."
        }
      }
    }
  }

  function pause() {
    if (!isPlaying.value) return
    if (audioEl) {
      audioEl.pause()
    }
    isPlaying.value = false
    setNarrationActive(false)
  }

  function seek(ms: number) {
    const clamped = Math.max(0, Math.min(ms, durationMs.value))
    currentTimeMs.value = clamped

    if (audioEl) {
      audioEl.currentTime = clamped / 1000
    }

    if (wordTimings.length > 0) {
      highlightedWordIndex.value = wordIndexFromTimings(clamped, wordTimings)
    } else {
      highlightedWordIndex.value = -1
    }
  }

  function reset() {
    stopAudio()
    if (audioEl) {
      try {
        audioEl.currentTime = 0
      } catch {
        // ignore
      }
    }
    currentTimeMs.value = 0
    highlightedWordIndex.value = -1
    isPlaying.value = false
  }

  function destroy() {
    abortFetch()
    destroyAudio()
    wordTimings = []
    isPlaying.value = false
    isLoading.value = false
    setNarrationActive(false)
  }

  return {
    isPlaying,
    currentTimeMs,
    durationMs,
    highlightedWordIndex,
    words,
    isAvailable,
    isLoading,
    errorMessage,
    play,
    pause,
    seek,
    reset,
    destroy,
  }
}
