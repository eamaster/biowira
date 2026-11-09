// ============================================================
// BioWira Storage Service
// Centralised localStorage abstraction with schema versioning.
// No other file in this codebase should call localStorage directly.
// ============================================================

const SCHEMA_VERSION = 1

interface StoredEnvelope<T> {
  v: number
  data: T
}

function isEnvelope<T>(value: unknown): value is StoredEnvelope<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'v' in value &&
    'data' in value &&
    typeof (value as StoredEnvelope<T>).v === 'number'
  )
}

export const storageService = {
  /**
   * Read a value from localStorage.
   * Returns null if the key does not exist, cannot be parsed,
   * or was stored with a different schema version.
   */
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return null
      const parsed: unknown = JSON.parse(raw)
      if (!isEnvelope<T>(parsed)) return null
      if (parsed.v !== SCHEMA_VERSION) {
        // Schema mismatch — discard stale data
        localStorage.removeItem(key)
        return null
      }
      return parsed.data
    } catch {
      return null
    }
  },

  /** Persist a value to localStorage wrapped in a versioned envelope. */
  set<T>(key: string, value: T): void {
    try {
      const envelope: StoredEnvelope<T> = { v: SCHEMA_VERSION, data: value }
      localStorage.setItem(key, JSON.stringify(envelope))
    } catch {
      // Storage full or unavailable — silent fail; app remains functional in memory
      console.warn(`[storageService] Could not persist key "${key}". Storage may be full.`)
    }
  },

  /** Remove a single key. */
  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // silent
    }
  },

  /** Remove multiple keys at once. */
  clearKeys(keys: readonly string[]): void {
    keys.forEach((k) => this.remove(k))
  },
}
