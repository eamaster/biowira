import { ref, watch, onUnmounted, toValue, type MaybeRefOrGetter } from 'vue'
import {
  tokenizeToWordSpans,
  wordIndexFromCharIndex,
  wordIndexFromLinearCharProgress,
} from '@/utils/narrationTokenize'
import type { WordSpan } from '@/utils/narrationTokenize'

/**
 * Narration composable backed by Web Speech API.
 *
 * Sync strategy:
 * - Primary: SpeechSynthesisUtterance `word` boundary events (charIndex → word span).
 * - Fallback: linear character progress through the utterance text when boundaries are weak
 *   (never mix equal-ms-per-word with boundary updates — that caused visible drift).
 * - Progress bar time uses elapsed wall-clock from session start; we do not cancel speech
 *   when the estimate elapses (that used to cut audio short and desync highlights).
 */

const TICK_MS = 80
/** ~rate 0.85 utterance — rough ms per character for duration estimate */
const MS_PER_CHAR = 58
const MIN_DURATION_MS = 2000

function estimateDurationMs(text: string, wordCount: number): number {
  const charPart = text.length * MS_PER_CHAR
  const wordPart = wordCount * 340
  return Math.max(MIN_DURATION_MS, Math.round(Math.max(charPart, wordPart)))
}

export function useAudio(textSource: MaybeRefOrGetter<string>) {
  const isPlaying = ref(false)
  const currentTimeMs = ref(0)
  const durationMs = ref(0)
  const highlightedWordIndex = ref(-1)
  const words = ref<string[]>([])
  const wordSpans = ref<WordSpan[]>([])
  /** Trimmed narration string — must match SpeechSynthesisUtterance text exactly */
  const narrationText = ref('')
  const isAvailable = ref(false)

  let utterance: SpeechSynthesisUtterance | null = null
  let trackerId: ReturnType<typeof setInterval> | null = null
  let sessionStartMs = 0
  /** Playback position offset within the full narration (ms) */
  let playbackOffsetMs = 0
  /** Character offset in `narrationText` where the current utterance starts */
  let utteranceCharOffset = 0
  /** True once we received a `word` boundary this session (Chrome / Edge). */
  let wordBoundarySyncActive = false

  if (typeof window !== 'undefined') {
    isAvailable.value = 'speechSynthesis' in window
  }

  function stopTracking() {
    if (trackerId !== null) {
      clearInterval(trackerId)
      trackerId = null
    }
  }

  function applyFallbackHighlight() {
    const full = narrationText.value
    const spans = wordSpans.value
    if (spans.length === 0 || durationMs.value <= 0) return
    const progress = Math.min(1, Math.max(0, currentTimeMs.value / durationMs.value))
    const idx = wordIndexFromLinearCharProgress(spans, full.length, progress)
    if (idx >= 0) highlightedWordIndex.value = idx
  }

  function startTracking() {
    stopTracking()
    sessionStartMs = Date.now()
    trackerId = setInterval(() => {
      const elapsed = Date.now() - sessionStartMs
      const next = Math.min(playbackOffsetMs + elapsed, durationMs.value)
      currentTimeMs.value = next

      if (!wordBoundarySyncActive) {
        applyFallbackHighlight()
      }

      if (next >= durationMs.value) {
        stopTracking()
      }
    }, TICK_MS)
  }

  function cancelSpeech() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    stopTracking()
    utterance = null
  }

  function buildFromText(text: string) {
    const normalized = text.trim()
    narrationText.value = normalized
    const spans = tokenizeToWordSpans(normalized)
    wordSpans.value = spans
    words.value = spans.map((s) => s.word)
    durationMs.value = estimateDurationMs(normalized, spans.length)
  }

  function reset() {
    cancelSpeech()
    isPlaying.value = false
    currentTimeMs.value = 0
    playbackOffsetMs = 0
    utteranceCharOffset = 0
    wordBoundarySyncActive = false
    highlightedWordIndex.value = -1
  }

  watch(
    () => toValue(textSource),
    (newText) => {
      reset()
      buildFromText(newText)
    },
    { immediate: true },
  )

  function attachUtteranceListeners() {
    if (!utterance) return

    utterance.onend = () => {
      stopTracking()
      isPlaying.value = false
      currentTimeMs.value = durationMs.value
      highlightedWordIndex.value = Math.max(0, words.value.length - 1)
      utteranceCharOffset = 0
      playbackOffsetMs = 0
      wordBoundarySyncActive = false
    }

    utterance.onerror = () => {
      stopTracking()
      isPlaying.value = false
      wordBoundarySyncActive = false
    }

    utterance.onboundary = (e) => {
      if (e.name !== 'word') return
      wordBoundarySyncActive = true
      const rel = e.charIndex ?? 0
      const absolute = utteranceCharOffset + rel
      const idx = wordIndexFromCharIndex(wordSpans.value, absolute)
      if (idx >= 0) highlightedWordIndex.value = idx
    }
  }

  function play() {
    if (!isAvailable.value) return
    if (isPlaying.value) return

    const synth = window.speechSynthesis

    if (synth.paused) {
      synth.resume()
      isPlaying.value = true
      sessionStartMs = Date.now()
      startTracking()
      return
    }

    cancelSpeech()

    const full = toValue(textSource).trim()
    if (!full) return

    if (currentTimeMs.value >= durationMs.value - 1 || durationMs.value === 0) {
      playbackOffsetMs = 0
      utteranceCharOffset = 0
      currentTimeMs.value = 0
    }

    const spoken = full.slice(utteranceCharOffset)
    if (!spoken.trim()) {
      playbackOffsetMs = 0
      utteranceCharOffset = 0
      currentTimeMs.value = 0
      return
    }

    wordBoundarySyncActive = false

    utterance = new SpeechSynthesisUtterance(spoken)
    utterance.rate = 0.85
    utterance.pitch = 1.0

    attachUtteranceListeners()

    highlightedWordIndex.value = -1
    const startIdx = wordIndexFromCharIndex(wordSpans.value, utteranceCharOffset)
    if (startIdx >= 0) highlightedWordIndex.value = startIdx

    synth.speak(utterance)
    isPlaying.value = true
    playbackOffsetMs = currentTimeMs.value
    sessionStartMs = Date.now()
    startTracking()
  }

  function pause() {
    if (!isPlaying.value) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const synth = window.speechSynthesis
    if (synth.speaking || synth.paused) {
      synth.pause()
    }
    playbackOffsetMs = currentTimeMs.value
    stopTracking()
    isPlaying.value = false
  }

  function seek(ms: number) {
    const wasPlaying = isPlaying.value
    const clamped = Math.max(0, Math.min(ms, durationMs.value))
    const full = narrationText.value
    const spans = wordSpans.value

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        window.speechSynthesis.cancel()
      }
    }
    stopTracking()
    utterance = null
    isPlaying.value = false

    playbackOffsetMs = clamped
    currentTimeMs.value = clamped

    if (spans.length > 0 && durationMs.value > 0) {
      const progress = clamped / durationMs.value
      const wIdx = wordIndexFromLinearCharProgress(spans, full.length, progress)
      highlightedWordIndex.value = Math.max(0, wIdx)
      utteranceCharOffset = spans[wIdx]?.start ?? 0
    } else {
      highlightedWordIndex.value = -1
      utteranceCharOffset = 0
    }

    wordBoundarySyncActive = false

    if (wasPlaying) {
      setTimeout(() => play(), 80)
    }
  }


  onUnmounted(reset)

  return {
    isPlaying,
    currentTimeMs,
    durationMs,
    highlightedWordIndex,
    words,
    isAvailable,
    play,
    pause,
    seek,
    reset,
  }
}
