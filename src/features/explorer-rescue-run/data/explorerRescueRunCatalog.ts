// Central catalog for playable Explorer Rescue Runs (game-specific, not Welcome/profile).

export type ExplorerRescueRunCatalogItem = {
  id: string
  animalId: string
  animalName: string
  visualKey: string
  description: string
  /** First-time completion stamp in the unified game journal (see gameJournalCatalog). */
  journalStampId: string
  difficultyLabel?: string
  fallbackEmoji?: string
  /**
   * Discovery WEBP spirits are mirrored from velocity using a default authored facing.
   * Set true when a run's spirit SVG/WebP artwork faces −world X at positive scaleX (Phaser),
   * so movement still lines up with Larut Torrent Frog–style conventions.
   */
  runnerDiscoveryMirrorInvert?: boolean
}

/** Single source of demo rescue-run entries — never duplicate these literals in Vue. */
export const EXPLORER_RESCUE_RUN_CATALOG: readonly ExplorerRescueRunCatalogItem[] = Object.freeze([
  {
    id: 'larut-torrent-frog',
    animalId: 'larut-torrent-frog',
    animalName: 'Larut Torrent Frog',
    visualKey: 'larut-torrent-frog',
    description: 'Find the Wild Match for the Larut Torrent Frog.',
    journalStampId: 'wild-match-finder',
    fallbackEmoji: '🐸',
  },
  {
    id: 'sun-bear',
    animalId: 'sun-bear',
    animalName: 'Sun Bear',
    visualKey: 'sun-bear',
    description: 'Find the Wild Match for the Sun Bear.',
    journalStampId: 'wild-match-sun-bear',
    fallbackEmoji: '🐻',
    runnerDiscoveryMirrorInvert: true,
  },
])

export const DEFAULT_EXPLORER_RESCUE_RUN_ID = 'larut-torrent-frog' as const

export function findExplorerRescueRunById(
  id?: string | null,
): ExplorerRescueRunCatalogItem | undefined {
  if (!id) return undefined
  return EXPLORER_RESCUE_RUN_CATALOG.find((r) => r.id === id)
}

/** Route query → catalog run, or the catalog default when missing/unknown. */
export function resolveExplorerRescueRunFromRouteQuery(
  queryValue: unknown,
): ExplorerRescueRunCatalogItem {
  const raw = Array.isArray(queryValue) ? queryValue[0] : queryValue
  const id = typeof raw === 'string' ? raw.trim() : ''
  return findExplorerRescueRunById(id) ?? EXPLORER_RESCUE_RUN_CATALOG.find((r) => r.id === DEFAULT_EXPLORER_RESCUE_RUN_ID)!
}

/** Throws only when callers intentionally require a validated id string. */
export function assertExplorerRescueRunId(id: string): asserts id is ExplorerRescueRunCatalogItem['id'] {
  if (!findExplorerRescueRunById(id)) {
    throw new Error(`Unknown Explorer Rescue run id: ${id}`)
  }
}

/** Map API-backed animal ids back onto catalog entries (replay routing, migrated saves). */
export function findExplorerRescueRunByAnimalId(animalId: string): ExplorerRescueRunCatalogItem | undefined {
  const id = animalId.trim()
  if (!id) return undefined
  return EXPLORER_RESCUE_RUN_CATALOG.find((r) => r.animalId === id || r.id === id)
}

/** Journal stamp for first completion of this rescue animal — matches {@link GameJournalStampDefinition.stampId}. */
export function getExplorerRescueJournalStampIdForAnimalId(animalId: string): string {
  return findExplorerRescueRunByAnimalId(animalId)?.journalStampId ?? 'wild-match-finder'
}

function explorerSnapshotMatchesRescueRunCatalogItem(
  explorer: { id: string; visualKey?: string | null },
  run: ExplorerRescueRunCatalogItem,
): boolean {
  if (explorer.id === run.animalId || explorer.id === run.id) return true
  const vk = (explorer.visualKey ?? '').trim()
  if (!vk) return false
  return vk === run.visualKey || vk === run.animalId
}

/**
 * Journal stamp for a session — prefers route catalog id when API `Animal.id` differs from catalog slugs.
 */
export function resolveExplorerRescueJournalStampIdForSession(
  rescueRunCatalogId: string | undefined | null,
  explorerFromApi: { id: string; visualKey?: string | null },
): string {
  const run = findExplorerRescueRunById(rescueRunCatalogId)
  if (run && explorerSnapshotMatchesRescueRunCatalogItem(explorerFromApi, run)) {
    return run.journalStampId
  }
  return getExplorerRescueJournalStampIdForAnimalId(explorerFromApi.id)
}
