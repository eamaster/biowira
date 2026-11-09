import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { joinApiUrl } from './apiClient'

describe('joinApiUrl', () => {
  // ── Legacy /api base (still supported) ────────────────────────────────────

  it('joins same-origin /api base with /animals', () => {
    expect(joinApiUrl('/api', '/animals')).toBe('/api/animals')
  })

  it('strips duplicate /api prefix on path when base is /api', () => {
    expect(joinApiUrl('/api', '/api/animals')).toBe('/api/animals')
  })

  it('joins absolute API base with path', () => {
    expect(joinApiUrl('https://example.com/api', '/session/restore')).toBe(
      'https://example.com/api/session/restore',
    )
  })

  it('normalizes path without leading slash', () => {
    expect(joinApiUrl('/api', 'animals')).toBe('/api/animals')
  })

  it('joins /api base with /Chat/ask preserving capitalization', () => {
    expect(joinApiUrl('/api', '/Chat/ask')).toBe('/api/Chat/ask')
  })

  it('joins /api base with /Chat/ask?sessionId=123 preserving query', () => {
    expect(joinApiUrl('/api', '/Chat/ask?sessionId=123')).toBe('/api/Chat/ask?sessionId=123')
  })

  // ── /api/v1 base (default since Swagger v1 contract) ──────────────────────

  it('joins /api/v1 base with clean /animals path', () => {
    expect(joinApiUrl('/api/v1', '/animals')).toBe('/api/v1/animals')
  })

  it('strips duplicate /api/v1 prefix when path accidentally repeats the base', () => {
    expect(joinApiUrl('/api/v1', '/api/v1/animals')).toBe('/api/v1/animals')
  })

  it('joins /api/v1 base with /profiles', () => {
    expect(joinApiUrl('/api/v1', '/profiles')).toBe('/api/v1/profiles')
  })

  it('joins /api/v1 base with /quizzes/save-progress', () => {
    expect(joinApiUrl('/api/v1', '/quizzes/save-progress')).toBe('/api/v1/quizzes/save-progress')
  })

  it('joins /api/v1 base with /missions/weather-adaptive', () => {
    expect(joinApiUrl('/api/v1', '/missions/weather-adaptive')).toBe(
      '/api/v1/missions/weather-adaptive',
    )
  })

  it('joins /api/v1 base with /fun-facts/42', () => {
    expect(joinApiUrl('/api/v1', '/fun-facts/42')).toBe('/api/v1/fun-facts/42')
  })

  it('joins /api/v1 base with /badges', () => {
    expect(joinApiUrl('/api/v1', '/badges')).toBe('/api/v1/badges')
  })

  it('normalizes path without leading slash for /api/v1 base', () => {
    expect(joinApiUrl('/api/v1', 'animals')).toBe('/api/v1/animals')
  })

  // ── TTS endpoint ───────────────────────────────────────────────────────────

  it('joins /api/v1 base with /tts/generate', () => {
    expect(joinApiUrl('/api/v1', '/tts/generate')).toBe('/api/v1/tts/generate')
  })

  it('strips duplicate /api/v1 prefix for tts path', () => {
    expect(joinApiUrl('/api/v1', '/api/v1/tts/generate')).toBe('/api/v1/tts/generate')
  })

  it('joins /api/v1 base with /tts/audio/{textHash}', () => {
    expect(joinApiUrl('/api/v1', '/tts/audio/abc123')).toBe('/api/v1/tts/audio/abc123')
  })

  // ── Default config base ────────────────────────────────────────────────────

  it('joinApiUrl with /api/v1 base produces correct URL for all repository paths', () => {
    const paths = [
      ['/animals', '/api/v1/animals'],
      ['/profiles', '/api/v1/profiles'],
      ['/profiles/restore', '/api/v1/profiles/restore'],
      ['/profiles/session', '/api/v1/profiles/session'],
      ['/quizzes', '/api/v1/quizzes'],
      ['/quizzes/save-progress', '/api/v1/quizzes/save-progress'],
      ['/missions/weather-adaptive', '/api/v1/missions/weather-adaptive'],
      ['/missions/assign', '/api/v1/missions/assign'],
      ['/missions/start', '/api/v1/missions/start'],
      ['/missions/complete', '/api/v1/missions/complete'],
      ['/missions/history', '/api/v1/missions/history'],
      ['/badges', '/api/v1/badges'],
      ['/fun-facts', '/api/v1/fun-facts'],
      ['/fun-facts/42', '/api/v1/fun-facts/42'],
      ['/tts/generate', '/api/v1/tts/generate'],
      ['/tts/audio/hash', '/api/v1/tts/audio/hash'],
    ]
    for (const [path, expected] of paths) {
      expect(joinApiUrl('/api/v1', path!), `path: ${path}`).toBe(expected)
    }
  })

  it('normalizeApiBaseUrl strips trailing slashes', async () => {
    const { normalizeApiBaseUrl } = await import('@/app/config')
    expect(normalizeApiBaseUrl('/api/v1/')).toBe('/api/v1')
    expect(normalizeApiBaseUrl('/api/v1//')).toBe('/api/v1')
    expect(normalizeApiBaseUrl('/api/v1')).toBe('/api/v1')
  })
})

describe('apiClient.post', () => {
  let apiClient: typeof import('@/services/apiClient').apiClient

  beforeEach(async () => {
    const mod = await import('@/services/apiClient')
    apiClient = mod.apiClient
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('calls correct URL when baseUrl option is provided', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    await apiClient.post('/Chat/ask', { msg: 'hi' }, { baseUrl: '/api' })

    const firstCall = fetchSpy.mock.calls[0]
    expect(firstCall).toBeDefined()
    const [url, init] = firstCall!
    expect(String(url)).toBe('/api/Chat/ask')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init!.body as string)).toEqual({ msg: 'hi' })
  })

  it('preserves query string when making a request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    )

    await apiClient.post('/Chat/ask?sessionId=xyz', { msg: 'hi' }, { baseUrl: '/api' })

    const firstCall = fetchSpy.mock.calls[0]
    expect(String(firstCall![0])).toBe('/api/Chat/ask?sessionId=xyz')
  })

  it('parses JSON successfully even if server returns text/plain but valid JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('{"reply":"hello"}', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    )

    const res = await apiClient.post('/Chat/ask', { msg: 'hi' }, { baseUrl: '/api' })
    expect(res).toEqual({ reply: 'hello' })
  })
})

// ── generateNarrationTts ──────────────────────────────────────────────────────
// Modules are imported once outside the tests to avoid ESM cache ordering issues.
// Fetch is stubbed/spied per-test and always restored in afterEach.

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

describe('generateNarrationTts', () => {
  let generateNarrationTts: (
    text: string,
    opts?: { signal?: AbortSignal },
  ) => Promise<import('@/services/narrationService').NarrationTtsResponse>
  let ApiError: typeof import('@/services/apiClient').ApiError

  beforeEach(async () => {
    const narrationMod = await import('@/services/narrationService')
    generateNarrationTts = narrationMod.generateNarrationTts
    const clientMod = await import('@/services/apiClient')
    ApiError = clientMod.ApiError
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('POSTs to /api/v1/tts/generate with JSON body and returns parsed JSON metadata', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(MOCK_TTS_RESPONSE), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

    const result = await generateNarrationTts('Hello world')

    expect(fetchSpy).toHaveBeenCalledOnce()

    const firstCall = fetchSpy.mock.calls[0]
    expect(firstCall, 'fetch must have been called with arguments').toBeDefined()
    const [url, init] = firstCall!

    expect(String(url)).toContain('/tts/generate')
    expect(init?.method).toBe('POST')
    expect(typeof init?.body).toBe('string')

    const body = JSON.parse(init!.body as string)
    expect(body).toMatchObject({
      text: 'Hello world',
      voiceId: expect.any(String),
      modelId: expect.any(String),
      speed: expect.any(Number),
    })

    // Returns parsed JSON metadata, not a Blob
    expect(result).not.toBeInstanceOf(Blob)
    expect(result.audioUrl).toBe('http://localhost:5215/api/v1/tts/audio/hash')
    expect(Array.isArray(result.timings)).toBe(true)
    expect(result.timings).toHaveLength(6)
  })

  it('passes AbortSignal to fetch when provided', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(MOCK_TTS_RESPONSE), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )

    const controller = new AbortController()
    await generateNarrationTts('Test text', { signal: controller.signal })

    const firstCall = fetchSpy.mock.calls[0]
    expect(firstCall).toBeDefined()
    const [, init] = firstCall!
    expect(init?.signal).toBe(controller.signal)
  })

  it('throws for empty/whitespace-only text without calling fetch', async () => {
    const fakeFetch = vi.fn()
    vi.stubGlobal('fetch', fakeFetch)

    await expect(generateNarrationTts('   ')).rejects.toThrow('must not be empty')
    expect(fakeFetch).not.toHaveBeenCalled()
  })

  it('throws ApiError on 400 JSON error response', async () => {
    const errorBody = JSON.stringify({ errorCode: 'INVALID_TEXT', details: null })
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(errorBody, {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(generateNarrationTts('Hello')).rejects.toBeInstanceOf(ApiError)
  })

  it('throws ApiError with status 400 and errorCode on bad request', async () => {
    const errorBody = JSON.stringify({ errorCode: 'INVALID_TEXT', details: null })
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(errorBody, {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const err = await generateNarrationTts('Hello').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as InstanceType<typeof ApiError>).status).toBe(400)
    expect((err as InstanceType<typeof ApiError>).errorCode).toBe('INVALID_TEXT')
  })

  it('throws ApiError on 500 ProblemDetails-style response', async () => {
    const problemDetails = JSON.stringify({
      title: 'Internal Server Error',
      detail: 'TTS service unavailable',
      status: 500,
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(problemDetails, {
        status: 500,
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    )

    const err = await generateNarrationTts('Hello').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as InstanceType<typeof ApiError>).status).toBe(500)
  })

  it('normalizes missing timings to empty array instead of throwing', async () => {
    const noTimings = { ...MOCK_TTS_RESPONSE, timings: undefined }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(noTimings), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const result = await generateNarrationTts('Hello')
    expect(Array.isArray(result.timings)).toBe(true)
    expect(result.timings).toHaveLength(0)
  })
})

// ── resolveNarrationAudioUrl ──────────────────────────────────────────────────

describe('resolveNarrationAudioUrl', () => {
  let resolveNarrationAudioUrl: (audioUrl: string) => string

  beforeEach(async () => {
    const mod = await import('@/services/narrationService')
    resolveNarrationAudioUrl = mod.resolveNarrationAudioUrl
  })

  it('converts absolute localhost URL to same-origin path', () => {
    expect(resolveNarrationAudioUrl('http://localhost:5215/api/v1/tts/audio/hash')).toBe(
      '/api/v1/tts/audio/hash',
    )
  })

  it('preserves query and hash when stripping host', () => {
    expect(
      resolveNarrationAudioUrl('http://localhost:5215/api/v1/tts/audio/hash?v=1#frag'),
    ).toBe('/api/v1/tts/audio/hash?v=1#frag')
  })

  it('returns /api/v1/tts/audio/hash unchanged if already relative', () => {
    expect(resolveNarrationAudioUrl('/api/v1/tts/audio/hash')).toBe('/api/v1/tts/audio/hash')
  })

  it('returns a short relative path unchanged', () => {
    expect(resolveNarrationAudioUrl('/tts/audio/hash')).toBe('/tts/audio/hash')
  })

  it('keeps external CDN URL absolute', () => {
    const cdn = 'https://cdn.example.com/audio.mp3'
    expect(resolveNarrationAudioUrl(cdn)).toBe(cdn)
  })

  it('throws for empty string', () => {
    expect(() => resolveNarrationAudioUrl('')).toThrow()
  })
})
