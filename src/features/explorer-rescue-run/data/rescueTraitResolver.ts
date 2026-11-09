// ── Explorer Rescue Run — Generic Trait Resolver ──────────────────────────────
//
// Converts a real `Animal` detail object (from the backend discovery layer) into
// exactly three `RescueTrait`s: habitat, diet, and group.
//
// Rules:
//   - NEVER hardcode per-animal biological facts here.
//   - RESCUE_CLUE_REGISTRY is used ONLY as an icon/label registry for known IDs.
//   - Unknown values keep the correct API label and fall back to emoji.

import type { Animal } from '@/domain/animal'
import {
  getTraitFallbackEmojiForClueId,
  resolveDietTraitClue,
  resolveGroupTraitClue,
  resolveHabitatTraitClue,
} from '@/domain/animalTraitResolution'
import type { RescueChoice, RescueTrait } from '../game/types'
import { RESCUE_CLUE_REGISTRY } from './explorerRescueClues'
import type { RescueClueId } from './explorerRescueClues'

// ── Trait factory ─────────────────────────────────────────────────────────────
/**
 * Build a RescueTrait: registry supplies icon path / stable id; `displayLabel`
 * keeps API wording when present (e.g. diet qualifiers).
 */
function makeTrait(clueId: string, displayLabel: string, fallbackEmoji: string): RescueTrait {
  const registryEntry = RESCUE_CLUE_REGISTRY[clueId as RescueClueId]
  if (registryEntry) {
    const label = displayLabel.trim() || registryEntry.label
    return {
      id: registryEntry.id,
      label,
      emoji: registryEntry.fallbackEmoji,
      iconPath: registryEntry.iconPath || undefined,
    }
  }
  return { id: clueId, label: displayLabel.trim() || clueId, emoji: fallbackEmoji }
}

// ── Public trait builders ─────────────────────────────────────────────────────
function resolveHabitatTrait(animal: Animal): RescueTrait {
  const { clueId, displayLabel } = resolveHabitatTraitClue(animal)
  const emoji = getTraitFallbackEmojiForClueId(clueId)
  return makeTrait(clueId, displayLabel, emoji)
}

function resolveDietTrait(animal: Animal): RescueTrait {
  const { clueId, displayLabel } = resolveDietTraitClue(animal)
  const emoji = getTraitFallbackEmojiForClueId(clueId)
  return makeTrait(clueId, displayLabel, emoji)
}

function resolveGroupTrait(animal: Animal): RescueTrait {
  const { clueId, displayLabel } = resolveGroupTraitClue(animal)
  const emoji = getTraitFallbackEmojiForClueId(clueId)
  return makeTrait(clueId, displayLabel, emoji)
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Convert a real backend-loaded Animal detail into exactly 3 RescueTrait objects:
 * [habitat, diet, group].
 *
 * This is the ONLY authoritative source of animal trait facts in Explorer Rescue
 * Run runtime code. Do NOT hardcode per-animal facts anywhere else.
 */
export function buildRescueTraitsFromAnimal(animal: Animal): RescueTrait[] {
  return [resolveHabitatTrait(animal), resolveDietTrait(animal), resolveGroupTrait(animal)]
}

/**
 * Return trait IDs that appear in both arrays (intersection by trait.id).
 */
export function sharedTraitIds(a: RescueTrait[], b: RescueTrait[]): string[] {
  const bIds = new Set(b.map((t) => t.id))
  return a.filter((t) => bIds.has(t.id)).map((t) => t.id)
}

/**
 * Number of traits shared between two animals (0–3).
 */
export function traitScore(a: RescueTrait[], b: RescueTrait[]): number {
  return sharedTraitIds(a, b).length
}

/**
 * True when a choice shares every explorer clue trait (full Wild Match).
 * Used at click time so any visually matching animal is accepted, not only
 * the single `isCorrect` flag chosen during round building.
 */
export function isFullWildMatch(
  explorerTraits: RescueTrait[],
  choiceSharedTraitIds: string[],
): boolean {
  if (explorerTraits.length === 0 || choiceSharedTraitIds.length !== explorerTraits.length) {
    return false
  }
  const shared = new Set(choiceSharedTraitIds)
  return explorerTraits.every((trait) => shared.has(trait.id))
}

/**
 * Evaluate a Wild Match pick using the choice card's full trait set (habitat + diet + group).
 * Never scores a single clue row — the entire card is one answer unit.
 */
export function evaluateWildMatchChoice(
  explorerTraits: RescueTrait[],
  choice: Pick<RescueChoice, 'choiceTraits'>,
): { isMatch: boolean; sharedTraits: RescueTrait[] } {
  const sharedIds = sharedTraitIds(explorerTraits, choice.choiceTraits)
  const isMatch = isFullWildMatch(explorerTraits, sharedIds)
  const sharedTraits = explorerTraits.filter((trait) => sharedIds.includes(trait.id))
  return { isMatch, sharedTraits }
}
