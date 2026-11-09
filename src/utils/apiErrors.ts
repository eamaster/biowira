import { ApiError } from '@/services/apiClient'

const GENERIC_EXPLORER_CREATE =
  "We couldn't create your explorer yet. Please try again."

/**
 * Short, calm copy for children. Detailed API payloads stay in console / ApiError.
 */
export function messageForExplorerCreateFailure(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status >= 500) {
      return 'The server is having a little trouble. Please try again in a moment.'
    }
    return GENERIC_EXPLORER_CREATE
  }
  if (error instanceof Error) {
    const m = error.message?.trim() ?? ''
    if (m.startsWith('{') || m.includes('"errorCode"')) {
      return GENERIC_EXPLORER_CREATE
    }
    if (m.length > 0 && m.length < 120) {
      return m
    }
  }
  return GENERIC_EXPLORER_CREATE
}

// ── Mission error helpers ──────────────────────────────────────────────────────

/**
 * Calm message when the weather-adaptive mission fetch fails.
 */
export function messageForMissionFetchFailure(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return 'We couldn\'t find a mission for your location right now. Try a different spot!'
    }
    if (error.status === 401) {
      return 'Your explorer session has expired. Please restore your explorer to continue.'
    }
    if (error.status >= 500) {
      return 'The server is having a little trouble. Please try again in a moment.'
    }
  }
  return 'We couldn\'t load your mission right now. Please try again!'
}

/**
 * Calm message when assign/start fails.
 */
export function messageForMissionStartFailure(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Your explorer session has expired. Please restore your explorer to continue.'
    }
    if (error.status === 400) {
      return 'Something went wrong starting the mission. Please try again.'
    }
    if (error.status >= 500) {
      return 'The server is having a little trouble. Please try again in a moment.'
    }
  }
  return 'We couldn\'t start your mission right now. Please try again!'
}

/**
 * Calm message when mission completion fails.
 */
export function messageForMissionCompleteFailure(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Your explorer session has expired. Please restore your explorer to continue.'
    }
    if (error.status === 404) {
      return 'We couldn\'t find your mission. Please try getting a new one.'
    }
    if (error.status >= 500) {
      return 'The server is having a little trouble. Please try again in a moment.'
    }
  }
  return 'We couldn\'t save your mission result right now. Please try again!'
}

// ── Badge error helpers ────────────────────────────────────────────────────────

/**
 * Calm message when badge fetch fails.
 */
export function messageForBadgeFetchFailure(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Your explorer session has expired. Please restore your explorer to continue.'
    }
    if (error.status >= 500) {
      return 'The server is having a little trouble loading your badges.'
    }
  }
  return 'We couldn\'t load your badges right now.'
}

// ── Quiz error helpers ─────────────────────────────────────────────────────────

/**
 * Calm message when quiz save-progress fails.
 */
export function messageForQuizSaveFailure(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Your explorer session has expired. Please restore your explorer to continue.'
    }
    if (error.status === 400) {
      if (error.errorCode === 'INVALID_TOTAL_QUESTIONS') {
        return 'Something went wrong saving your quiz. Please try again.'
      }
      if (error.errorCode === 'INVALID_CORRECT_ANSWERS') {
        return 'Something went wrong saving your quiz. Please try again.'
      }
      return 'Something went wrong saving your quiz. Please try again.'
    }
    if (error.status >= 500) {
      return 'The server is having a little trouble. Please try again in a moment.'
    }
  }
  return 'We couldn\'t save your quiz progress right now. Your score is still shown!'
}
