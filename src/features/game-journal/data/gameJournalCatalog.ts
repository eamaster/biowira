// ============================================================
// BioWira Game Journal — Central Stamp Catalog
//
// Single source of truth for all journal stamps.
// rainforestRestoredPercent is computed dynamically as:
//   unlockedAvailableStamps / totalAvailableStamps * 100
//
// When new stamps are added with availableForRestoration: true,
// the denominator automatically grows — no manual percentage
// constants needed anywhere.
// ============================================================

import type {
  GameJournalStampDefinition,
  GameJournalCategoryDefinition,
  GameJournalCategoryId,
} from '@/domain/gameJournal'

export const GAME_JOURNAL_STAMP_CATALOG: readonly GameJournalStampDefinition[] = [
  // ── Nature Mission (featured animal paths — menu chip uses journalMenuProgress !== false)
  {
    stampId: 'mission-tiger-territory',
    title: 'Tiger Territory Walk',
    description: 'Completed the Malayan Tiger territory mission and helped protect the rainforest.',
    categoryId: 'nature-mission',
    availableForRestoration: true,
  },
  {
    stampId: 'mission-sun-bear-honey',
    title: 'Sun Bear Honey Hunt',
    description: 'Completed the Sun Bear honey hunt mission and helped protect the rainforest.',
    categoryId: 'nature-mission',
    availableForRestoration: true,
  },
  {
    stampId: 'mission-orangutan-tree',
    title: 'Orangutan Tree Spotter',
    description: 'Completed the Bornean Orangutan tree spotter mission and helped protect the rainforest.',
    categoryId: 'nature-mission',
    availableForRestoration: true,
  },
  {
    stampId: 'nature-mission-helper',
    title: 'Nature Mission Helper',
    description: 'Completed a nature mission and helped the rainforest.',
    categoryId: 'nature-mission',
    availableForRestoration: true,
    journalMenuProgress: false,
  },

  // ── Explorer Rescue Run ──────────────────────────────────────────────────────
  // stampId 'wild-match-finder' matches DEFAULT_RESCUE_REWARDS.journalStamp
  // for backward-compatibility with existing explorerRescueProgress data.
  {
    stampId: 'wild-match-finder',
    title: 'Wild Match Finder',
    description: "Completed an Explorer Rescue Run and found the animal's Wild Match.",
    categoryId: 'explorer-rescue-run',
    availableForRestoration: true,
  },
  {
    stampId: 'wild-match-sun-bear',
    title: 'Sun Bear Wild Match',
    description: 'Completed the Sun Bear Explorer Rescue Run and found its Wild Match.',
    categoryId: 'explorer-rescue-run',
    availableForRestoration: true,
  },

  // ── Eco-Comic: The Secret in the Wooden Crate ────────────────────────────────
  {
    stampId: 'family-team-hero',
    title: 'Family Team Hero',
    description: 'Saved the pangolin with family help.',
    leafPoints: 50,
    categoryId: 'eco-comic',
    availableForRestoration: true,
    storyId: 'secret-wooden-crate',
    endingId: 'call-a-parent',
  },
  {
    stampId: 'pangolin-guardian',
    title: 'Pangolin Guardian',
    description: 'Helped the pangolin reach PERHILITAN safely.',
    leafPoints: 30,
    categoryId: 'eco-comic',
    availableForRestoration: true,
    storyId: 'secret-wooden-crate',
    endingId: 'contact-wildlife-dept',
  },
  {
    stampId: 'wildlife-secret-agent',
    title: 'Wildlife Secret Agent',
    description: 'Reported evidence safely and helped officers catch the trafficker.',
    leafPoints: 80,
    categoryId: 'eco-comic',
    availableForRestoration: true,
    storyId: 'secret-wooden-crate',
    endingId: 'photograph-and-report',
  },
] as const

export const GAME_JOURNAL_CATEGORIES: readonly GameJournalCategoryDefinition[] = [
  {
    id: 'nature-mission',
    title: 'Nature Mission',
    description: 'Small real-world actions that help nature.',
    icon: '🌿',
  },
  {
    id: 'eco-comic',
    title: 'Eco-Comic',
    description: "Pixel stories about protecting Malaysia's wildlife.",
    icon: '📖',
  },
  {
    id: 'explorer-rescue-run',
    title: 'Explorer Rescue Run',
    description: 'Run, jump, and find your Wild Match!',
    icon: '🐾',
    stampPageCtaLabel: 'Back to Nature Mission',
  },
]

/** Total stamps that count toward the unified rainforest restoration %. */
export const TOTAL_AVAILABLE_STAMPS: number = GAME_JOURNAL_STAMP_CATALOG.filter(
  (s) => s.availableForRestoration,
).length

/** Look up a stamp definition by ID. Returns undefined if not found. */
export function getStampById(stampId: string): GameJournalStampDefinition | undefined {
  return GAME_JOURNAL_STAMP_CATALOG.find((s) => s.stampId === stampId)
}

/** Stamps counted on the journal menu “x/y” chip for a category (excludes e.g. nature-mission-helper). */
export function getStampsForJournalMenuTally(categoryId: GameJournalCategoryId): GameJournalStampDefinition[] {
  return getStampsByCategory(categoryId).filter((s) => s.journalMenuProgress !== false)
}

/** All stamp definitions for a given category. */
export function getStampsByCategory(categoryId: string): GameJournalStampDefinition[] {
  return GAME_JOURNAL_STAMP_CATALOG.filter((s) => s.categoryId === categoryId)
}

/** Category definition by id. */
export function getCategoryById(
  id: string,
): GameJournalCategoryDefinition | undefined {
  return GAME_JOURNAL_CATEGORIES.find((c) => c.id === id)
}
