// ── Shared animal trait normalization (Discover + Explorer Rescue) ────────────
//
// Maps API-backed Animal fields to stable clue IDs and display labels.
// Icon paths live in RESCUE_CLUE_REGISTRY — this module must not import features.

import type { Animal } from '@/domain/animal'
import { AnimalCategory, HabitatZone } from '@/domain/enums'

// ── Public shape ───────────────────────────────────────────────────────────────
export interface TraitClueResolution {
  /** Stable clue id, e.g. habitat_forest, diet_insectivore, group_reptiles */
  clueId: string
  /** Human-readable label from API or category/habitat vocabulary */
  displayLabel: string
}

// ── Habitat label → clue ID (exact single-token keys from API) ────────────────
const HABITAT_LABEL_TO_ID: Readonly<Record<string, string>> = {
  forest: 'habitat_forest',
  rainforest: 'habitat_forest',
  ocean: 'habitat_ocean',
  sea: 'habitat_ocean',
  marine: 'habitat_ocean',
  coastal: 'habitat_ocean',
  'coastal area': 'habitat_ocean',
  wetlands: 'habitat_wetlands',
  wetland: 'habitat_wetlands',
  river: 'habitat_river',
  freshwater: 'habitat_river',
  mangrove: 'habitat_mangrove',
}

/**
 * Match combined habitat copy (e.g. "Wetlands, Ocean") against clue IDs.
 * First matching rule wins — order is deliberate (terrestrial before marine, etc.).
 */
const HABITAT_TEXT_TO_CLUE_ID: readonly { pattern: RegExp; id: string }[] = [
  { pattern: /\bmangrove\b/i, id: 'habitat_mangrove' },
  { pattern: /\b(rainforest|forest)\b/i, id: 'habitat_forest' },
  { pattern: /\b(river|freshwater)\b/i, id: 'habitat_river' },
  {
    pattern:
      /\b(wetland|wetlands|salt\s*marsh|mudflat|mudflats|bog|swamp)\b/i,
    id: 'habitat_wetlands',
  },
  {
    pattern:
      /\b(ocean|marine|sea|seas|coastal|estuary|estuarine|intertidal|reef)\b/i,
    id: 'habitat_ocean',
  },
]

// ── HabitatZone enum → display label ─────────────────────────────────────────
const HABITAT_ZONE_TO_LABEL: Readonly<Record<string, string>> = {
  [HabitatZone.Rainforest]: 'Forest',
  [HabitatZone.River]: 'River',
  [HabitatZone.Mangrove]: 'Mangrove',
  [HabitatZone.MarineReserve]: 'Ocean',
  [HabitatZone.CoastalArea]: 'Ocean',
  [HabitatZone.Mountain]: 'Mountain',
}

// ── Diet label → clue ID (full-string lowercase keys) ───────────────────────
const DIET_LABEL_TO_ID: Readonly<Record<string, string>> = {
  carnivore: 'diet_carnivore',
  herbivore: 'diet_herbivore',
  omnivore: 'diet_omnivore',
  insectivore: 'diet_insectivore',
  insectivorous: 'diet_insectivore',
}

/**
 * Map backend diet text to a canonical diet clue ID when a known word appears.
 * More specific tokens first (e.g. herbivore qualifiers before carnivore).
 */
const DIET_KEYWORD_TO_ID: readonly { pattern: RegExp; id: string }[] = [
  { pattern: /\bherbivore\b/i, id: 'diet_herbivore' },
  { pattern: /\bherbivorous\b/i, id: 'diet_herbivore' },
  { pattern: /\bnectarivore\b/i, id: 'diet_herbivore' },
  { pattern: /\bfolivore\b/i, id: 'diet_herbivore' },
  { pattern: /\bgranivore\b/i, id: 'diet_herbivore' },
  { pattern: /\bfrugivore\b/i, id: 'diet_herbivore' },
  { pattern: /\bomnivore\b/i, id: 'diet_omnivore' },
  { pattern: /\binsectivorous\b/i, id: 'diet_insectivore' },
  { pattern: /\binsectivore\b/i, id: 'diet_insectivore' },
  { pattern: /\bcarnivore\b/i, id: 'diet_carnivore' },
  { pattern: /\bpiscivore\b/i, id: 'diet_carnivore' },
]

export function resolveDietClueIdFromText(dietRaw: string): string {
  const normalized = dietRaw.trim().toLowerCase()
  if (normalized && DIET_LABEL_TO_ID[normalized]) return DIET_LABEL_TO_ID[normalized]!

  for (const { pattern, id } of DIET_KEYWORD_TO_ID) {
    if (pattern.test(dietRaw)) return id
  }

  return `diet_${normalized.replace(/[^a-z0-9]+/g, '_') || 'unknown'}`
}

// ── AnimalCategory → clue ID and display label ───────────────────────────────
const CATEGORY_TO_ID: Readonly<Record<string, string>> = {
  [AnimalCategory.Mammals]: 'group_mammal',
  [AnimalCategory.Birds]: 'group_bird',
  [AnimalCategory.MarineFreshwater]: 'group_marine',
  [AnimalCategory.Reptiles]: 'group_reptiles',
  [AnimalCategory.Amphibians]: 'group_amphibians',
  [AnimalCategory.Insects]: 'group_insects',
  [AnimalCategory.All]: 'group_unknown',
}

const CATEGORY_TO_LABEL: Readonly<Record<string, string>> = {
  [AnimalCategory.Mammals]: 'Mammals',
  [AnimalCategory.Birds]: 'Birds',
  [AnimalCategory.MarineFreshwater]: 'Marine & Freshwater',
  [AnimalCategory.Reptiles]: 'Reptiles',
  [AnimalCategory.Amphibians]: 'Amphibians',
  [AnimalCategory.Insects]: 'Insects',
  [AnimalCategory.All]: 'Unknown',
}

// ── Emoji fallbacks when clue is unknown or has no asset (Discover UI backup) ─
const HABITAT_FALLBACK_EMOJI: Readonly<Record<string, string>> = {
  habitat_forest: '🌳',
  habitat_wetlands: '🏞️',
  habitat_ocean: '🌊',
  habitat_river: '🌊',
  habitat_mangrove: '🌿',
}

const DIET_FALLBACK_EMOJI: Readonly<Record<string, string>> = {
  diet_carnivore: '🥩',
  diet_herbivore: '🥬',
  diet_omnivore: '🍎',
  diet_insectivore: '🐞',
}

const GROUP_FALLBACK_EMOJI: Readonly<Record<string, string>> = {
  group_mammal: '🐾',
  group_bird: '🐦',
  group_marine: '🐠',
  group_reptiles: '🦎',
  group_amphibians: '🐸',
  group_insects: '🦋',
  group_unknown: '❓',
}

/** Fallback emoji for Discover when registry has no entry or empty iconPath. */
export function getTraitFallbackEmojiForClueId(clueId: string): string {
  if (clueId.startsWith('habitat_')) return HABITAT_FALLBACK_EMOJI[clueId] ?? '🌿'
  if (clueId.startsWith('diet_')) return DIET_FALLBACK_EMOJI[clueId] ?? '🍽️'
  if (clueId.startsWith('group_')) return GROUP_FALLBACK_EMOJI[clueId] ?? '❓'
  return '❓'
}

// ── Habitat resolution ───────────────────────────────────────────────────────
function collectHabitatDisplayLabel(animal: Animal): string {
  const disp = animal.habitatDisplay?.trim()
  if (disp) return disp
  if (animal.habitats && animal.habitats.length > 0) {
    return animal.habitats
      .map((h) => h.trim())
      .filter((h) => h.length > 0)
      .join(', ')
  }
  const zone = HABITAT_ZONE_TO_LABEL[animal.habitat]
  if (zone) return zone
  return 'Unknown Habitat'
}

function resolveHabitatClueIdFromCombinedLabel(displayLabel: string): string {
  const trimmed = displayLabel.trim()
  if (!trimmed) return 'habitat_unknown'

  for (const { pattern, id } of HABITAT_TEXT_TO_CLUE_ID) {
    if (pattern.test(trimmed)) return id
  }

  const firstToken = trimmed.split(',')[0]!.trim().toLowerCase()
  if (HABITAT_LABEL_TO_ID[firstToken]) return HABITAT_LABEL_TO_ID[firstToken]!

  const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_')
  return `habitat_${slug || 'unknown'}`
}

// ── Resolvers ─────────────────────────────────────────────────────────────────
export function resolveHabitatTraitClue(animal: Animal): TraitClueResolution {
  const displayLabel = collectHabitatDisplayLabel(animal)
  const clueId = resolveHabitatClueIdFromCombinedLabel(displayLabel)
  return { clueId, displayLabel }
}

export function resolveDietTraitClue(animal: Animal): TraitClueResolution {
  const dietLabel = animal.diet?.trim() || 'Unknown Diet'
  const clueId = resolveDietClueIdFromText(dietLabel)
  return { clueId, displayLabel: dietLabel }
}

export function resolveGroupTraitClue(animal: Animal): TraitClueResolution {
  const category = animal.category
  const clueId = CATEGORY_TO_ID[category] ?? 'group_unknown'
  const label = CATEGORY_TO_LABEL[category] ?? 'Unknown'
  return { clueId, displayLabel: label }
}
