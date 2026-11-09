// ── Explorer Rescue Run — Centralized Clue Registry ──────────────────────────
//
// Single source of truth for all clue definitions used in the Explorer Rescue
// Run game. Phaser scenes and Vue components import from here — no raw paths
// are hardcoded in either place.
//
// Clue icon WebP files live in:
//   public/games/explorer-rescue/clues/
//
// To add a new clue:
//  1. Drop the WebP in the clues folder.
//  2. Add a new entry to RESCUE_CLUE_REGISTRY below.
//  3. Add the new ID to the RescueClueId union.

import { EXPLORER_RESCUE_ASSETS } from '@/app/branding'

// ── Clue ID union ─────────────────────────────────────────────────────────────
export type RescueClueId =
  | 'habitat_forest'
  | 'habitat_wetlands'
  | 'habitat_ocean'
  | 'habitat_river'
  | 'habitat_mangrove'
  | 'diet_carnivore'
  | 'diet_herbivore'
  | 'diet_insectivore'
  | 'diet_omnivore'
  | 'group_mammal'
  | 'group_bird'
  | 'group_marine'
  | 'group_reptiles'
  | 'group_amphibians'
  | 'group_insects'
  | 'threat_habitat_loss'
  | 'threat_pollution'
  | 'threat_poaching'
  | 'threat_fishing_gear'

export type RescueClueKind = 'habitat' | 'diet' | 'group' | 'threat'

// ── Clue object shape ─────────────────────────────────────────────────────────
export interface RescueClue {
  id: RescueClueId
  label: string
  kind: RescueClueKind
  iconKey: string
  /** Resolved public-folder path. Use this in both Vue and Phaser. */
  iconPath: string
  /** Fallback only when the image cannot load. Not the primary UI. */
  fallbackEmoji: string
}

// ── Registry ──────────────────────────────────────────────────────────────────
export const RESCUE_CLUE_REGISTRY: Readonly<Record<RescueClueId, RescueClue>> = Object.freeze({
  habitat_forest: {
    id: 'habitat_forest',
    label: 'Forest',
    kind: 'habitat',
    iconKey: 'habitat_forest_clue',
    iconPath: EXPLORER_RESCUE_ASSETS.gameplay.clues.habitatForest,
    fallbackEmoji: '🌳',
  },
  habitat_wetlands: {
    id: 'habitat_wetlands',
    label: 'Wetlands',
    kind: 'habitat',
    iconKey: 'habitat_wetlands_clue',
    iconPath: EXPLORER_RESCUE_ASSETS.gameplay.clues.habitatWetlands,
    fallbackEmoji: '🏞️',
  },
  habitat_ocean: {
    id: 'habitat_ocean',
    label: 'Ocean',
    kind: 'habitat',
    iconKey: 'habitat_ocean_clue',
    iconPath: EXPLORER_RESCUE_ASSETS.gameplay.clues.habitatOcean,
    fallbackEmoji: '🌊',
  },
  habitat_river: {
    id: 'habitat_river',
    label: 'River',
    kind: 'habitat',
    iconKey: 'habitat_river_clue',
    // TODO: add public/games/explorer-rescue/clues/habitat-river-clue.webp when art ships
    iconPath: '',
    fallbackEmoji: '🌊',
  },
  habitat_mangrove: {
    id: 'habitat_mangrove',
    label: 'Mangrove',
    kind: 'habitat',
    iconKey: 'habitat_mangrove_clue',
    // TODO: add public/games/explorer-rescue/clues/habitat-mangrove-clue.webp when art ships
    iconPath: '',
    fallbackEmoji: '🌿',
  },
  diet_carnivore: {
    id: 'diet_carnivore',
    label: 'Carnivore',
    kind: 'diet',
    iconKey: 'diet_carnivore_clue',
    iconPath: EXPLORER_RESCUE_ASSETS.gameplay.clues.dietCarnivore,
    fallbackEmoji: '🥩',
  },
  diet_herbivore: {
    id: 'diet_herbivore',
    label: 'Herbivore',
    kind: 'diet',
    iconKey: 'diet_herbivore_clue',
    iconPath: EXPLORER_RESCUE_ASSETS.gameplay.clues.dietHerbivore,
    fallbackEmoji: '🥬',
  },
  diet_insectivore: {
    id: 'diet_insectivore',
    label: 'Insectivore',
    kind: 'diet',
    iconKey: 'diet_insectivore_clue',
    iconPath: EXPLORER_RESCUE_ASSETS.gameplay.clues.dietInsectivore,
    fallbackEmoji: '🐞',
  },
  diet_omnivore: {
    id: 'diet_omnivore',
    label: 'Omnivore',
    kind: 'diet',
    iconKey: 'diet_omnivore_clue',
    iconPath: EXPLORER_RESCUE_ASSETS.gameplay.clues.dietOmnivore,
    fallbackEmoji: '🍎',
  },
  group_mammal: {
    id: 'group_mammal',
    label: 'Mammals',
    kind: 'group',
    iconKey: 'group_mammal_clue',
    iconPath: EXPLORER_RESCUE_ASSETS.gameplay.clues.groupMammal,
    fallbackEmoji: '🐾',
  },
  group_bird: {
    id: 'group_bird',
    label: 'Birds',
    kind: 'group',
    iconKey: 'group_bird_clue',
    iconPath: EXPLORER_RESCUE_ASSETS.gameplay.clues.groupBird,
    fallbackEmoji: '🐦',
  },
  group_marine: {
    id: 'group_marine',
    label: 'Marine & Freshwater',
    kind: 'group',
    iconKey: 'group_marine_clue',
    iconPath: EXPLORER_RESCUE_ASSETS.gameplay.clues.groupMarine,
    fallbackEmoji: '🐠',
  },
  group_reptiles: {
    id: 'group_reptiles',
    label: 'Reptiles',
    kind: 'group',
    iconKey: 'group_reptiles_clue',
    iconPath: EXPLORER_RESCUE_ASSETS.gameplay.clues.groupReptiles,
    fallbackEmoji: '🦎',
  },
  group_amphibians: {
    id: 'group_amphibians',
    label: 'Amphibians',
    kind: 'group',
    iconKey: 'group_amphibians_clue',
    iconPath: EXPLORER_RESCUE_ASSETS.gameplay.clues.groupAmphibians,
    fallbackEmoji: '🐸',
  },
  group_insects: {
    id: 'group_insects',
    label: 'Insects',
    kind: 'group',
    iconKey: 'group_insects_clue',
    iconPath: EXPLORER_RESCUE_ASSETS.gameplay.clues.groupInsects,
    fallbackEmoji: '🦋',
  },
  threat_habitat_loss: {
    id: 'threat_habitat_loss',
    label: 'Habitat Loss',
    kind: 'threat',
    iconKey: 'threat_habitat_loss_clue',
    iconPath: '',
    fallbackEmoji: '🪵',
  },
  threat_pollution: {
    id: 'threat_pollution',
    label: 'Pollution',
    kind: 'threat',
    iconKey: 'threat_pollution_clue',
    iconPath: '',
    fallbackEmoji: '♻️',
  },
  threat_poaching: {
    id: 'threat_poaching',
    label: 'Poaching',
    kind: 'threat',
    iconKey: 'threat_poaching_clue',
    iconPath: '',
    fallbackEmoji: '⚠️',
  },
  threat_fishing_gear: {
    id: 'threat_fishing_gear',
    label: 'Fishing Gear',
    kind: 'threat',
    iconKey: 'threat_fishing_gear_clue',
    iconPath: '',
    fallbackEmoji: '🎣',
  },
})

/**
 * Look up a clue by its ID. Returns undefined for unknown IDs.
 */
export function getClueById(id: RescueClueId): RescueClue {
  return RESCUE_CLUE_REGISTRY[id]
}

/**
 * Convert an ordered list of clue IDs into full RescueTrait objects.
 *
 * This is the single mapping function used by both the round builder
 * (for explorer clueTraits and choice choiceTraits) and any helper
 * that needs to resolve traits from profile clueIds. Do not duplicate
 * this mapping inline in Vue components or Phaser scenes.
 */
export function clueIdsToTraits(clueIds: readonly RescueClueId[]): import('../game/types').RescueTrait[] {
  return clueIds.map((id) => {
    const clue = RESCUE_CLUE_REGISTRY[id]
    return {
      id: clue.id,
      label: clue.label,
      emoji: clue.fallbackEmoji,
      iconPath: clue.iconPath || undefined,
    }
  })
}

/**
 * Convert clue registry objects to legacy RescueTrait format for
 * backward-compat with Phaser scene and result types.
 */
export function clueToLegacyTrait(clue: RescueClue): { id: string; label: string; emoji: string; iconPath?: string } {
  return {
    id: clue.id,
    label: clue.label,
    emoji: clue.fallbackEmoji,
    iconPath: clue.iconPath || undefined,
  }
}

// ── Journal / label → sprite resolution (single source for clue WebPs) ────────

export interface RescueClueVisual {
  iconPath: string
  fallbackEmoji: string
}

const ALL_RESCUE_CLUES: readonly RescueClue[] = Object.values(RESCUE_CLUE_REGISTRY)

/** Legacy mock-round trait ids → canonical registry ids. */
const LEGACY_TRAIT_ID_TO_CLUE_ID: Partial<Record<string, RescueClueId>> = {
  rainforest: 'habitat_forest',
  omnivore: 'diet_omnivore',
  habitatLoss: 'threat_habitat_loss',
}

function normalizeClueLabelKey(label: string): string {
  return label.trim().toLowerCase()
}

/** Head word before qualifiers, e.g. "Omnivore (fruits…)" → "omnivore". */
function clueLabelHead(displayLabel: string): string {
  return displayLabel.split(/[,(]/)[0]!.trim().toLowerCase()
}

/**
 * Resolve clue WebP + emoji from a stable trait id (`diet_omnivore`, …).
 */
export function resolveClueVisualByTraitId(traitId: string): RescueClueVisual & { label: string } {
  const canonicalId = (LEGACY_TRAIT_ID_TO_CLUE_ID[traitId] ?? traitId) as RescueClueId
  const clue = RESCUE_CLUE_REGISTRY[canonicalId]
  if (clue) {
    return {
      iconPath: clue.iconPath,
      fallbackEmoji: clue.fallbackEmoji,
      label: clue.label,
    }
  }
  return { iconPath: '', fallbackEmoji: '🔍', label: traitId }
}

/**
 * Resolve clue WebP from a display label (may include API qualifiers).
 * Used by Games Journal when only labels were persisted on older records.
 */
export function resolveClueVisualByDisplayLabel(displayLabel: string): RescueClueVisual {
  const trimmed = displayLabel.trim()
  if (!trimmed) return { iconPath: '', fallbackEmoji: '🔍' }

  const byId = resolveClueVisualByTraitId(trimmed)
  if (byId.iconPath) {
    return { iconPath: byId.iconPath, fallbackEmoji: byId.fallbackEmoji }
  }

  const lower = normalizeClueLabelKey(trimmed)
  const exact = ALL_RESCUE_CLUES.find((c) => normalizeClueLabelKey(c.label) === lower)
  if (exact) {
    return { iconPath: exact.iconPath, fallbackEmoji: exact.fallbackEmoji }
  }

  const byPrefix = ALL_RESCUE_CLUES.find((c) =>
    lower.startsWith(normalizeClueLabelKey(c.label)),
  )
  if (byPrefix) {
    return { iconPath: byPrefix.iconPath, fallbackEmoji: byPrefix.fallbackEmoji }
  }

  const head = clueLabelHead(trimmed)
  const byHead = ALL_RESCUE_CLUES.find((c) => normalizeClueLabelKey(c.label) === head)
  if (byHead) {
    return { iconPath: byHead.iconPath, fallbackEmoji: byHead.fallbackEmoji }
  }

  const byHeadPrefix = ALL_RESCUE_CLUES.find(
    (c) =>
      head.startsWith(normalizeClueLabelKey(c.label)) ||
      normalizeClueLabelKey(c.label).startsWith(head),
  )
  if (byHeadPrefix) {
    return {
      iconPath: byHeadPrefix.iconPath,
      fallbackEmoji: byHeadPrefix.fallbackEmoji,
    }
  }

  return { iconPath: '', fallbackEmoji: '🔍' }
}

export interface SharedClueJournalBadge {
  label: string
  iconPath: string
  fallbackEmoji: string
}

/**
 * Shared clue row for Explorer Rescue journal records.
 * Prefers `sharedTraitIds` when present; falls back to label resolution for older saves.
 */
export function resolveSharedClueBadgesForJournal(input: {
  sharedTraitIds?: string[]
  sharedTraitLabels?: string[]
}): SharedClueJournalBadge[] {
  const ids = input.sharedTraitIds ?? []
  const labels = input.sharedTraitLabels ?? []

  if (ids.length > 0) {
    return ids.map((id, index) => {
      const visual = resolveClueVisualByTraitId(id)
      const label = labels[index]?.trim() || visual.label
      return {
        label,
        iconPath: visual.iconPath,
        fallbackEmoji: visual.fallbackEmoji,
      }
    })
  }

  return labels.map((label) => {
    const visual = resolveClueVisualByDisplayLabel(label)
    return { label, ...visual }
  })
}
