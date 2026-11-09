/**
 * Presentation helpers for user-visible strings (strip catalog flair, etc.).
 */

/** Remove emoji / pictographs so titles can pair with asset icons instead of duplicate emoji. */
export function stripDisplayEmoji(text: string): string {
  const trimmed = text
    // Unicode emoji & pictographs (modern targets — Vite ES2021+)
    .replace(/\p{Extended_Pictographic}/gu, '')
    // Common variation selectors sometimes left beside stripped chars
    .replace(/[\uFE0F\u200D]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return trimmed
}
