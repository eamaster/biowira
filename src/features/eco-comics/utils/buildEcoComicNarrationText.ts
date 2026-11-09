/**
 * Build a natural-language narration string from an Eco-Comic panel.
 *
 * The resulting string is suitable for TTS via `useNarrationAudio` when a panel has no
 * prepared MP3 clips (`narrationAudioSrcs`). It remains useful for accessibility even when
 * prepared audio is used.
 * Speaker names are included naturally ("Fatimah says: ...") so the
 * audio narration sounds natural when voiced.
 *
 * Rules:
 * - Returns an empty string for null/empty panels (not passed to TTS).
 * - Narration text (scene description) is included verbatim.
 * - Each dialogue line is prefixed with "<Speaker> says: " when a speaker is set.
 * - Choice prompts are omitted — the child reads those on screen.
 * - Ending title/description are omitted — the completion screen handles those.
 */

import type { EcoComicPanel } from '../data/ecoComicStoryCatalog'

export function buildEcoComicNarrationText(panel: EcoComicPanel | null): string {
  if (!panel) return ''

  const parts: string[] = []

  if (panel.narration?.trim()) {
    parts.push(panel.narration.trim())
  }

  for (const d of panel.dialogues ?? []) {
    const text = d.text?.trim()
    if (!text) continue
    if (d.speaker?.trim()) {
      parts.push(`${d.speaker.trim()} says: ${text}`)
    } else {
      parts.push(text)
    }
  }

  return parts.join(' ')
}
