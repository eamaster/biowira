/**
 * Narration tokenization for Web Speech API read-along.
 * Word spans preserve character offsets into the exact string passed to SpeechSynthesisUtterance
 * so charIndex from onboundary can be mapped reliably.
 */

export interface WordSpan {
  word: string
  /** Inclusive start index in the normalized narration string */
  start: number
  /** Exclusive end index */
  end: number
}

/**
 * Split into non-whitespace tokens (words + attached punctuation), with offsets.
 * Matches typical browser word boundaries better than split(/\s+/) alone.
 */
export function tokenizeToWordSpans(text: string): WordSpan[] {
  const normalized = text.trim()
  if (!normalized) return []

  const spans: WordSpan[] = []
  const re = /\S+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(normalized)) !== null) {
    spans.push({
      word: m[0],
      start: m.index,
      end: m.index + m[0].length,
    })
  }
  return spans
}

/**
 * Map a character index from SpeechSynthesisUtterance boundary events to a word index.
 * `charIndex` is relative to the utterance string (or substring when seeking).
 * Pass absoluteCharIndex = utteranceCharOffset + (event.charIndex ?? 0).
 */
export function wordIndexFromCharIndex(spans: WordSpan[], absoluteCharIndex: number): number {
  if (spans.length === 0) return -1

  const c = Math.max(0, absoluteCharIndex)

  for (let i = 0; i < spans.length; i++) {
    const s = spans[i]
    if (c >= s.start && c < s.end) return i
  }

  if (c >= spans[spans.length - 1].end) return spans.length - 1
  if (c < spans[0].start) return 0

  for (let i = 0; i < spans.length - 1; i++) {
    if (c >= spans[i].end && c < spans[i + 1].start) return i + 1
  }

  return spans.length - 1
}

/**
 * Fallback when word boundaries are unavailable: map linear progress through the string
 * to a word index (coarser than true TTS sync, but stable vs equal-ms-per-word).
 */
export function wordIndexFromLinearCharProgress(
  spans: WordSpan[],
  textLength: number,
  progress01: number,
): number {
  if (spans.length === 0) return -1
  const len = Math.max(1, textLength)
  const t = Math.min(1, Math.max(0, progress01))
  const charPos = Math.min(len - 1, Math.floor(t * len))
  return wordIndexFromCharIndex(spans, charPos)
}
