import { appConfig, normalizeApiBaseUrl, STORAGE_KEYS } from '@/app/config'
import { storageService } from '@/services/storageService'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public bodyText?: string,
    public errorCode?: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export type ApiRequestOptions = {
  signal?: AbortSignal
  baseUrl?: string
}

function parseErrorPayload(text: string): { errorCode?: string; details?: unknown } {
  try {
    const j = JSON.parse(text) as {
      errorCode?: string
      details?: unknown
      // ASP.NET ProblemDetails shape
      title?: string
      detail?: string
      status?: number
    }
    // Prefer BioWira errorCode/details; fall back to ProblemDetails title/detail
    const errorCode = j.errorCode ?? undefined
    const details = j.details ?? (j.detail ? { message: j.detail } : undefined)
    return { errorCode, details }
  } catch {
    return {}
  }
}

/**
 * Join API base path with a repository path like `/animals`.
 * Prevents doubled prefixes (e.g. `/api/v1/api/v1/animals`) if a path
 * accidentally repeats the base already contained in appConfig.apiBaseUrl.
 * Repositories must always pass clean relative paths like `/animals`.
 */
export function joinApiUrl(base: string, path: string): string {
  const b = normalizeApiBaseUrl(base)
  let rel = path.startsWith('/') ? path : `/${path}`
  // Strip duplicated base prefix (handles both /api and /api/v1 cases)
  if (b !== '/' && rel.startsWith(b + '/')) {
    rel = rel.slice(b.length)
  }
  return `${b}${rel}`
}

/** Build shared request headers (Content-Type + optional session token). */
function buildHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  const token = storageService.get<string>(STORAGE_KEYS.SESSION_TOKEN)
  if (token) {
    headers['X-Session-Token'] = token
  }
  return headers
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: ApiRequestOptions,
  legacyBaseUrl?: string,
): Promise<T> {
  const finalBaseUrl = options?.baseUrl ?? legacyBaseUrl ?? appConfig.apiBaseUrl
  const url = joinApiUrl(finalBaseUrl, path)

  const res = await fetch(url, {
    method,
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  })

  const text = await res.text().catch(() => res.statusText)

  if (!res.ok) {
    const { errorCode, details } = parseErrorPayload(text)
    throw new ApiError(
      res.status,
      text || res.statusText,
      text,
      errorCode,
      details,
    )
  }

  if (!text.trim()) return undefined as T
  return JSON.parse(text) as T
}

/**
 * Like `request()` but returns a Blob instead of parsed JSON.
 * Used for binary responses such as the narration MP3 from
 * POST /api/v1/narration/synthesize.
 */
async function requestBlob(
  method: string,
  path: string,
  body?: unknown,
  options?: { signal?: AbortSignal },
): Promise<Blob> {
  const url = joinApiUrl(appConfig.apiBaseUrl, path)

  const res = await fetch(url, {
    method,
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    const { errorCode, details } = parseErrorPayload(text)
    throw new ApiError(
      res.status,
      text || res.statusText,
      text,
      errorCode,
      details,
    )
  }

  return await res.blob()
}

export const apiClient = {
  get<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    return request<T>('GET', path, undefined, options)
  },
  post<T>(path: string, body: unknown, options?: ApiRequestOptions): Promise<T> {
    return request<T>('POST', path, body, options)
  },
  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>('PUT', path, body)
  },
  delete<T>(path: string): Promise<T> {
    return request<T>('DELETE', path)
  },
  postBlob(path: string, body: unknown, options?: { signal?: AbortSignal }): Promise<Blob> {
    return requestBlob('POST', path, body, options)
  },
}
