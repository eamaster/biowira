/**
 * NarrationService — frontend abstraction over the BioWira backend TTS endpoint.
 *
 * The backend handles:
 *  - ElevenLabs API call
 *  - PostgreSQL cache (repeated text/voice/model/speed hits are served instantly)
 *  - Audio storage at /api/v1/tts/audio/{textHash}
 *  - Word-level timing alignment from ElevenLabs timestamp data
 *
 * The frontend only POSTs text + TTS params and plays the returned audioUrl.
 * ElevenLabs credentials MUST NEVER appear in this file or any frontend env var.
 */

import { apiClient } from '@/services/apiClient'
import { appConfig } from '@/app/config'

// ── Response types ────────────────────────────────────────────────────────────

export interface NarrationTtsTiming {
  word: string
  /** Start time in seconds */
  start: number
  /** End time in seconds */
  end: number
}

export interface NarrationTtsResponse {
  textHash: string
  voiceId: string
  modelId: string
  speed?: number
  mimeType: string
  cached: boolean
  audioUrl: string
  timings: NarrationTtsTiming[]
}

interface GenerateTtsRequest {
  text: string
  voiceId: string
  modelId: string
  speed: number
}

// ── generateNarrationTts ──────────────────────────────────────────────────────

/**
 * POST /api/v1/tts/generate — fetch JSON metadata for a narration.
 *
 * The relative path '/tts/generate' is joined with VITE_API_BASE_URL
 * (default '/api/v1') by apiClient.post → joinApiUrl, so no version prefix
 * is duplicated here.
 *
 * Returns JSON metadata including audioUrl and word-level timings.
 * ElevenLabs credentials are NEVER in this file.
 */
export async function generateNarrationTts(
  text: string,
  options?: { signal?: AbortSignal },
): Promise<NarrationTtsResponse> {
  const normalized = text.trim()
  if (!normalized) {
    throw new Error('Narration text must not be empty.')
  }

  const body: GenerateTtsRequest = {
    text: normalized,
    voiceId: appConfig.tts.voiceId,
    modelId: appConfig.tts.modelId,
    speed: appConfig.tts.speed,
  }

  const raw = await apiClient.post<NarrationTtsResponse>('/tts/generate', body, options)

  // Minimal validation — surface clear errors for contract mismatches
  if (!raw.audioUrl || typeof raw.audioUrl !== 'string') {
    throw new Error('TTS response is missing a valid audioUrl.')
  }
  if (!Array.isArray(raw.timings)) {
    raw.timings = []
  }

  return raw
}

// ── resolveNarrationAudioUrl ──────────────────────────────────────────────────

/**
 * Convert an audioUrl returned by the backend into a same-origin relative path
 * that the browser can fetch through the Vite dev proxy (or CloudFront in prod).
 *
 * Rules:
 *  - Empty string → throws
 *  - Absolute URL whose path starts with /api/ → strip scheme+host, keep path+query+hash
 *  - Relative path already starting with /api/ → return as-is
 *  - Any other relative path → return as-is
 *  - External CDN / signed URL (different path prefix) → keep absolute
 *
 * This function NEVER hardcodes localhost or any production domain.
 */
export function resolveNarrationAudioUrl(audioUrl: string): string {
  if (!audioUrl || typeof audioUrl !== 'string' || !audioUrl.trim()) {
    throw new Error('resolveNarrationAudioUrl: audioUrl must be a non-empty string.')
  }

  try {
    const parsed = new URL(audioUrl)
    // Only strip the host for same-API-path URLs — i.e. /api/...
    if (parsed.pathname.startsWith('/api/')) {
      return parsed.pathname + parsed.search + parsed.hash
    }
    // External CDN / signed URL — keep absolute
    return audioUrl
  } catch {
    // Not a valid absolute URL — treat as a relative path, return as-is
    return audioUrl
  }
}
