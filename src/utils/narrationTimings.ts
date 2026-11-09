/**
 * Backend TTS word timings (milliseconds) → active word index for read-along.
 * Pure functions — unit-tested without HTMLAudioElement or Vue scheduler quirks.
 */

export type WordTimingMs = {
  word: string
  startMs: number
  endMs: number
}

/**
 * Find the index of the word active at `ms` using backend timing data.
 * Returns -1 if before the first word; last index if past the final word end.
 */
export function wordIndexFromTimings(ms: number, timings: WordTimingMs[]): number {
  if (timings.length === 0) return -1

  if (ms < timings[0]!.startMs) return -1

  for (let i = 0; i < timings.length; i++) {
    const timing = timings[i]!
    if (ms >= timing.startMs && ms < timing.endMs) {
      return i
    }
    const next = timings[i + 1]
    if (next && ms >= timing.endMs && ms < next.startMs) {
      return i
    }
  }

  return timings.length - 1
}
