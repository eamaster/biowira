/**
 * Explorer animal icon resolver.
 *
 * Resolution order for the 8 allowed explorer animals:
 *  1. SVG from explorer registry (getAnimalIconUrl) — primary
 *  2. Discovery WEBP (getDiscoveryAnimalIconUrl) — fallback for animals without explorer SVGs
 *     (e.g. Leatherback Sea Turtle has a discovery WEBP but no explorer SVG)
 *  3. explicit iconUrl on caller site
 *  4. fallbackEmoji — last resort (always available from catalog)
 *
 * Usage:
 *   const url = resolveExplorerAnimalIconUrl({ visualKey: 'leatherback-sea-turtle', commonName: 'Leatherback Sea Turtle' })
 *   // Returns the discovery WEBP URL since there is no explorer SVG
 */
import { getAnimalIconUrl } from '@/app/iconRegistry'
import { getDiscoveryAnimalIconUrl } from '@/app/discoveryAnimalIconRegistry'

export interface ExplorerAnimalIconInput {
  visualKey: string
  commonName: string
}

/**
 * Resolve a display URL for an explorer animal.
 * Returns `undefined` when no icon can be found — caller must use fallback emoji.
 */
export function resolveExplorerAnimalIconUrl(input: ExplorerAnimalIconInput): string | undefined {
  // 1. Explorer SVG (primary — fast O(1) lookup)
  const svgUrl = getAnimalIconUrl(input.visualKey)
  if (svgUrl) return svgUrl

  // 2. Discovery WEBP (fallback for explorers without a dedicated SVG)
  const webpUrl = getDiscoveryAnimalIconUrl({
    visualKey: input.visualKey,
    commonName: input.commonName,
  })
  if (webpUrl) return webpUrl

  return undefined
}
