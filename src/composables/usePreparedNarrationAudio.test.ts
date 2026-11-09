import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick, defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { usePreparedNarrationAudio } from './usePreparedNarrationAudio'

vi.mock('@/services/appAudioService', () => ({
  setNarrationActive: vi.fn(),
}))

import { setNarrationActive } from '@/services/appAudioService'

type MockAudioInstance = {
  src: string
  preload: string
  paused: boolean
  play: ReturnType<typeof vi.fn>
  pause: ReturnType<typeof vi.fn>
  load: ReturnType<typeof vi.fn>
  onloadedmetadata: (() => void) | null
  oncanplay: (() => void) | null
  onended: (() => void) | null
  onerror: (() => void) | null
}

const mockAudios: MockAudioInstance[] = []

function fireReady(el: MockAudioInstance) {
  el.onloadedmetadata?.()
  el.oncanplay?.()
}

beforeEach(() => {
  mockAudios.length = 0
  vi.mocked(setNarrationActive).mockClear()

  class MockAudio {
    src = ''
    preload = ''
    paused = true
    play = vi.fn()
    pause = vi.fn()
    load = vi.fn()
    onloadedmetadata: (() => void) | null = null
    oncanplay: (() => void) | null = null
    onended: (() => void) | null = null
    onerror: (() => void) | null = null

    constructor(src: string) {
      this.src = src
      this.play.mockImplementation(() => {
        this.paused = false
        return Promise.resolve(undefined)
      })
      this.pause.mockImplementation(() => {
        this.paused = true
      })
      mockAudios.push(this)
      queueMicrotask(() => fireReady(this))
    }
  }

  vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.mocked(setNarrationActive).mockClear()
})

function mountPrepared(srcs: () => readonly string[] | undefined) {
  const holder: {
    wrapper: ReturnType<typeof mount> | null
    composable: ReturnType<typeof usePreparedNarrationAudio> | null
  } = { wrapper: null, composable: null }

  holder.wrapper = mount(
    defineComponent({
      setup() {
        holder.composable = usePreparedNarrationAudio(srcs)
        return () => null
      },
      template: '<span />',
    }),
  )
  return {
    get c() {
      return holder.composable!
    },
    unmount() {
      holder.wrapper?.unmount()
    },
  }
}

describe('usePreparedNarrationAudio', () => {
  it('plays a single MP3 source', async () => {
    const { c, unmount } = mountPrepared(() => ['https://example.com/a.mp3'])
    await c.play()
    await nextTick()
    await Promise.resolve()

    expect(mockAudios).toHaveLength(1)
    expect(mockAudios[0]!.play).toHaveBeenCalled()
    expect(c.isPlaying.value).toBe(true)
    expect(vi.mocked(setNarrationActive)).toHaveBeenCalledWith(true)
    unmount()
  })

  it('plays multiple sources sequentially', async () => {
    const { c, unmount } = mountPrepared(() => [
      'https://example.com/a.mp3',
      'https://example.com/b.mp3',
    ])
    await c.play()
    await nextTick()
    await Promise.resolve()

    expect(mockAudios).toHaveLength(1)

    mockAudios[0]!.onended?.()
    await nextTick()
    await Promise.resolve()

    expect(mockAudios.length).toBeGreaterThanOrEqual(2)
    expect(mockAudios[1]!.play).toHaveBeenCalled()
    expect(
      vi.mocked(setNarrationActive).mock.calls.filter((args) => args[0] === true).length,
    ).toBeGreaterThanOrEqual(1)
    unmount()
  })

  it('pause stops the active HTMLAudioElement', async () => {
    const { c, unmount } = mountPrepared(() => ['https://example.com/a.mp3'])
    await c.play()
    await nextTick()
    await Promise.resolve()

    c.pause()
    expect(mockAudios[0]!.pause).toHaveBeenCalled()
    expect(c.isPlaying.value).toBe(false)
    expect(vi.mocked(setNarrationActive)).toHaveBeenCalledWith(false)
    unmount()
  })

  it('reset / destroy stops audio and calls setNarrationActive(false)', async () => {
    const { c, unmount } = mountPrepared(() => ['https://example.com/a.mp3'])
    await c.play()
    await nextTick()
    await Promise.resolve()

    vi.mocked(setNarrationActive).mockClear()
    c.reset()

    expect(mockAudios[0]!.pause).toHaveBeenCalled()
    expect(c.isPlaying.value).toBe(false)
    expect(vi.mocked(setNarrationActive)).toHaveBeenCalledWith(false)

    await c.play()
    await nextTick()
    await Promise.resolve()
    vi.mocked(setNarrationActive).mockClear()
    c.destroy()
    expect(vi.mocked(setNarrationActive)).toHaveBeenCalledWith(false)
    unmount()
  })

  it('changing sources stops the old audio and stale onended does not continue playback', async () => {
    const srcs = ref<readonly string[] | undefined>([
      'https://example.com/a.mp3',
      'https://example.com/b.mp3',
    ])

    const { c, unmount } = mountPrepared(() => srcs.value)
    await c.play()
    await nextTick()
    await Promise.resolve()

    const first = mockAudios[0]!
    const nAfterFirst = mockAudios.length

    srcs.value = ['https://example.com/z.mp3']
    await nextTick()

    first.onended?.()
    await nextTick()
    await Promise.resolve()

    expect(mockAudios.length).toBe(nAfterFirst)
    expect(c.isPlaying.value).toBe(false)
    unmount()
  })
})
