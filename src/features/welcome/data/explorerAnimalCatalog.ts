/**
 * Explorer (profile) animals — exactly 8 curated canonical choices.
 *
 * This is the ONLY place where the allowed explorer list is defined.
 * Do NOT derive this list from getRegisteredAnimalIconKeys() or any other
 * auto-generated registry — the picker must remain exactly these 8 animals.
 *
 * Visual keys use canonical slugs that are registered in iconRegistry.ts.
 * Old alias keys (orangutan, hornbill, pangolin, crocodile) are supported
 * for migration/resolution only — they do NOT appear as picker rows.
 */

export interface ExplorerAnimalChoice {
  /**
   * Stable domain id (slug) — canonical local identifier; used for local catalog + API slug fallback.
   */
  backendAnimalId: string
  /** Stable key for v-for (always same as backendAnimalId) */
  choiceKey: string
  /** Registry key for AnimalIcon / icon resolution */
  animalVisualKey: string
  /** Short label for picker UI — exactly the canonical display name */
  label: string
  commonName: string
  fallbackEmoji: string
  /** Legacy alias visual keys that resolve to this entry (migration only) */
  readonly aliases?: readonly string[]
}

/**
 * The 8 allowed explorer animal choices, in the required display order.
 * All display names are canonical — no old/generic labels.
 */
export const EXPLORER_ANIMAL_CATALOG: readonly ExplorerAnimalChoice[] = [
  {
    backendAnimalId: 'malayan-tiger',
    choiceKey: 'malayan-tiger',
    animalVisualKey: 'malayan-tiger',
    label: 'Malayan Tiger',
    commonName: 'Malayan Tiger',
    fallbackEmoji: '🐯',
  },
  {
    backendAnimalId: 'bornean-orangutan',
    choiceKey: 'bornean-orangutan',
    animalVisualKey: 'bornean-orangutan',
    label: 'Bornean Orangutan',
    commonName: 'Bornean Orangutan',
    fallbackEmoji: '🦧',
    aliases: ['orangutan'],
  },
  {
    backendAnimalId: 'proboscis-monkey',
    choiceKey: 'proboscis-monkey',
    animalVisualKey: 'proboscis-monkey',
    label: 'Proboscis Monkey',
    commonName: 'Proboscis Monkey',
    fallbackEmoji: '🐒',
  },
  {
    backendAnimalId: 'rhinoceros-hornbill',
    choiceKey: 'rhinoceros-hornbill',
    animalVisualKey: 'rhinoceros-hornbill',
    label: 'Rhinoceros Hornbill',
    commonName: 'Rhinoceros Hornbill',
    fallbackEmoji: '🦅',
    aliases: ['hornbill'],
  },
  {
    backendAnimalId: 'sun-bear',
    choiceKey: 'sun-bear',
    animalVisualKey: 'sun-bear',
    label: 'Sun Bear',
    commonName: 'Sun Bear',
    fallbackEmoji: '🐻',
  },
  {
    backendAnimalId: 'sunda-pangolin',
    choiceKey: 'sunda-pangolin',
    animalVisualKey: 'sunda-pangolin',
    label: 'Sunda Pangolin',
    commonName: 'Sunda Pangolin',
    fallbackEmoji: '🦡',
    aliases: ['pangolin'],
  },
  {
    backendAnimalId: 'saltwater-crocodile',
    choiceKey: 'saltwater-crocodile',
    animalVisualKey: 'saltwater-crocodile',
    label: 'Saltwater Crocodile',
    commonName: 'Saltwater Crocodile',
    fallbackEmoji: '🐊',
    aliases: ['crocodile'],
  },
  {
    backendAnimalId: 'leatherback-sea-turtle',
    choiceKey: 'leatherback-sea-turtle',
    animalVisualKey: 'leatherback-sea-turtle',
    label: 'Leatherback Sea Turtle',
    commonName: 'Leatherback Sea Turtle',
    fallbackEmoji: '🐢',
  },
] as const

// ── Resolution maps ──────────────────────────────────────────────────────────

/** Index by backendAnimalId for O(1) lookup */
const byBackendId = new Map<string, ExplorerAnimalChoice>(
  EXPLORER_ANIMAL_CATALOG.map((e) => [e.backendAnimalId, e]),
)

/** Index by animalVisualKey for O(1) lookup */
const byVisualKey = new Map<string, ExplorerAnimalChoice>(
  EXPLORER_ANIMAL_CATALOG.map((e) => [e.animalVisualKey, e]),
)

/** Index by legacy alias keys (orangutan → bornean-orangutan, hornbill → rhinoceros-hornbill, etc.) */
const byAlias = new Map<string, ExplorerAnimalChoice>()
for (const entry of EXPLORER_ANIMAL_CATALOG) {
  for (const alias of entry.aliases ?? []) {
    byAlias.set(alias, entry)
  }
}

/**
 * Resolve a catalog row by:
 *  1. canonical backendAnimalId
 *  2. canonical animalVisualKey
 *  3. legacy alias visual key (orangutan → Bornean Orangutan, hornbill → Rhinoceros Hornbill, etc.)
 *  4. case-insensitive common name match
 *
 * Disallowed old IDs (tapir, mousedeer, dugong, sea-turtle, sea-turtle-hawksbill) return undefined.
 * Disallowed aliases never appear as picker rows.
 */
export function findExplorerAnimalChoice(id: string): ExplorerAnimalChoice | undefined {
  if (!id) return undefined
  return (
    byBackendId.get(id) ??
    byVisualKey.get(id) ??
    byAlias.get(id) ??
    EXPLORER_ANIMAL_CATALOG.find(
      (e) => e.commonName.toLowerCase() === id.toLowerCase(),
    )
  )
}

/** @deprecated Use {@link findExplorerAnimalChoice} — alias for compatibility */
export function getExplorerAnimalById(animalId: string): ExplorerAnimalChoice | undefined {
  return findExplorerAnimalChoice(animalId)
}

/**
 * Throws if `animalId` is not a valid canonical explorer animal id or approved alias.
 * Disallowed old IDs (tapir, mousedeer, dugong, sea-turtle, etc.) will throw.
 */
export function assertValidExplorerAnimalId(animalId: string): void {
  if (!findExplorerAnimalChoice(animalId)) {
    throw new Error(`Unknown explorer animal: "${animalId}"`)
  }
}

/**
 * Resolves the explorer animal profile to the specific string expected by the Chat API.
 */
export function resolveExplorerChatAnimalType(input: { animalId?: string; animalVisualKey?: string }): string {
  const identifier = input.animalId || input.animalVisualKey
  if (!identifier) return 'tiger'

  const choice = findExplorerAnimalChoice(identifier)
  if (!choice) return 'tiger'

  switch (choice.backendAnimalId) {
    case 'malayan-tiger':
      return 'tiger'
    case 'bornean-orangutan':
      return 'orangutan'
    case 'proboscis-monkey':
      return 'proboscis-monkey'
    case 'rhinoceros-hornbill':
      return 'hornbill'
    case 'sun-bear':
      return 'sun-bear'
    case 'sunda-pangolin':
      return 'pangolin'
    case 'saltwater-crocodile':
      return 'crocodile'
    case 'leatherback-sea-turtle':
      return 'turtle'
    default:
      return 'tiger'
  }
}
