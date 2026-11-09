import { ref, watch, onUnmounted, toValue, type MaybeRefOrGetter } from 'vue'
import { setNarrationActive } from '@/services/appAudioService'

const LOAD_ERR = "Oops! We couldn't load the narration. Please try again."
const PLAY_ERR = "Oops! We couldn't play the narration. Please try again."

/**
 * Plays one or more public MP3 URLs sequentially (Eco-Comic prepared narration).
 * Ducks background music via `setNarrationActive` for the full user-started sequence,
 * including short gaps between clips.
 */
export function usePreparedNarrationAudio(
  audioSrcsSource: MaybeRefOrGetter<readonly string[] | undefined>,
) {
  const isPlaying = ref(false)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  /** Bumps when `audioSrcs` changes or on reset/destroy — stale audio callbacks must no-op. */
  let generation = 0
  let clipIndex = 0
  let audioEl: HTMLAudioElement | null = null
  let sequenceDuckActive = false

  function normalizedSrcs(): string[] {
    const raw = toValue(audioSrcsSource)
    if (!raw?.length) return []
    return raw.map((s) => s.trim()).filter((s) => s.length > 0)
  }

  function clearDuck() {
    if (sequenceDuckActive) {
      sequenceDuckActive = false
      setNarrationActive(false)
    }
  }

  function applyDuck() {
    if (!sequenceDuckActive) {
      sequenceDuckActive = true
      setNarrationActive(true)
    }
  }

  function detachListeners(el: HTMLAudioElement) {
    el.onloadedmetadata = null
    el.oncanplay = null
    el.onended = null
    el.onerror = null
  }

  function disposeAudio() {
    if (!audioEl) return
    try {
      audioEl.pause()
    } catch {
      /* ignore */
    }
    detachListeners(audioEl)
    audioEl.src = ''
    try {
      audioEl.load()
    } catch {
      /* ignore */
    }
    audioEl = null
  }

  function bumpGeneration() {
    generation++
  }

  function hardStop() {
    disposeAudio()
    isPlaying.value = false
    isLoading.value = false
    clearDuck()
  }

  /** Stops playback; optionally bumps generation so in-flight async work exits. */
  function interrupt(bumpGen: boolean) {
    if (bumpGen) bumpGeneration()
    clipIndex = 0
    errorMessage.value = null
    hardStop()
  }

  watch(
    () => normalizedSrcs().join('\u0000'),
    () => {
      interrupt(true)
    },
    { flush: 'sync' },
  )

  function handleClipEnded(gen: number, srcs: string[]) {
    if (gen !== generation) return

    if (clipIndex + 1 >= srcs.length) {
      clipIndex = 0
      disposeAudio()
      isPlaying.value = false
      isLoading.value = false
      clearDuck()
      return
    }

    clipIndex += 1
    disposeAudio()
    isPlaying.value = false
    isLoading.value = true
    applyDuck()
    void prepareClipAtIndex(srcs, gen)
  }

  function attachForClip(el: HTMLAudioElement, gen: number, srcs: string[]) {
    el.onended = () => handleClipEnded(gen, srcs)

    el.onerror = () => {
      if (gen !== generation) return
      errorMessage.value = LOAD_ERR
      interrupt(false)
      bumpGeneration()
    }
  }

  async function prepareClipAtIndex(srcs: string[], gen: number): Promise<void> {
    if (gen !== generation) return

    const src = srcs[clipIndex]
    if (!src) {
      interrupt(false)
      bumpGeneration()
      return
    }

    disposeAudio()
    isLoading.value = true

    const el = new Audio(src)
    el.preload = 'metadata'
    attachForClip(el, gen, srcs)
    audioEl = el

    let playStarted = false

    const tryPlayOnce = async () => {
      if (playStarted || gen !== generation) return
      playStarted = true
      try {
        await el.play()
        if (gen !== generation) {
          try {
            el.pause()
          } catch {
            /* ignore */
          }
          return
        }
        isPlaying.value = true
        isLoading.value = false
        applyDuck()
      } catch {
        if (gen !== generation) return
        errorMessage.value = PLAY_ERR
        interrupt(false)
        bumpGeneration()
      }
    }

    el.onloadedmetadata = () => {
      void tryPlayOnce()
    }

    el.oncanplay = () => {
      void tryPlayOnce()
    }
  }

  async function play() {
    const srcs = normalizedSrcs()
    if (!srcs.length) return

    if (isPlaying.value) return

    errorMessage.value = null

    const gen = generation

    if (audioEl && audioEl.paused) {
      isLoading.value = true
      try {
        await audioEl.play()
        if (gen !== generation) return
        isPlaying.value = true
        isLoading.value = false
        applyDuck()
      } catch {
        if (gen !== generation) return
        errorMessage.value = PLAY_ERR
        interrupt(false)
        bumpGeneration()
      }
      return
    }

    clipIndex = 0
    await prepareClipAtIndex(srcs, gen)
  }

  function pause() {
    if (!audioEl) return
    try {
      audioEl.pause()
    } catch {
      /* ignore */
    }
    isPlaying.value = false
    isLoading.value = false
    clearDuck()
  }

  function reset() {
    interrupt(false)
    bumpGeneration()
  }

  function destroy() {
    interrupt(true)
  }

  onUnmounted(() => {
    destroy()
  })

  return {
    isPlaying,
    isLoading,
    errorMessage,
    play,
    pause,
    reset,
    destroy,
  }
}
