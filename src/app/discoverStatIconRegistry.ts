// ── BioWira Discover Stat Icon Registry ────────────────────────────────────────
//
// Centralized resolver for pixel-art icons used in the Discover animal profile
// stat cards (Group, Habitat, Diet, Lifespan).
//
// Group / Habitat / Diet use the same trait normalization as Explorer Rescue
// (`animalTraitResolution` + `RESCUE_CLUE_REGISTRY`). Lifespan uses branding only.

import type { Animal } from '@/domain/animal'
import {
  resolveDietTraitClue,
  resolveGroupTraitClue,
  resolveHabitatTraitClue,
  getTraitFallbackEmojiForClueId,
} from '@/domain/animalTraitResolution'
import { EXPLORER_RESCUE_ASSETS } from '@/app/branding'
import { RESCUE_CLUE_REGISTRY } from '@/features/explorer-rescue-run/data/explorerRescueClues'
import type { RescueClueId } from '@/features/explorer-rescue-run/data/explorerRescueClues'

export type DiscoverStatIconKind = 'group' | 'habitat' | 'diet' | 'lifespan'

export interface DiscoverStatIconResult {
  /** Resolved public WebP URL, or undefined when no image is available. */
  src: string | undefined
  /** Safe text fallback — always a non-empty string. */
  fallbackText: string
  /** Accessible label used for aria-label on the icon element. */
  label: string
}

const CLUE_ICONS = EXPLORER_RESCUE_ASSETS.gameplay.clues

function statFromRegistry(
  kind: DiscoverStatIconKind,
  clueId: string,
  displayLabel: string,
): DiscoverStatIconResult {
  const entry = RESCUE_CLUE_REGISTRY[clueId as RescueClueId]
  const path = entry?.iconPath?.trim() ? entry.iconPath : undefined
  const fallbackText = entry?.fallbackEmoji ?? getTraitFallbackEmojiForClueId(clueId)
  const prefix =
    kind === 'group' ? 'Group' : kind === 'habitat' ? 'Habitat' : kind === 'diet' ? 'Diet' : 'Stat'
  return {
    src: path || undefined,
    fallbackText,
    label: `${prefix}: ${displayLabel}`,
  }
}

function resolveGroupIcon(animal: Animal): DiscoverStatIconResult {
  const { clueId, displayLabel } = resolveGroupTraitClue(animal)
  return statFromRegistry('group', clueId, displayLabel)
}

function resolveHabitatIcon(animal: Animal): DiscoverStatIconResult {
  const { clueId, displayLabel } = resolveHabitatTraitClue(animal)
  return statFromRegistry('habitat', clueId, displayLabel)
}

function resolveDietIcon(animal: Animal): DiscoverStatIconResult {
  const { clueId, displayLabel } = resolveDietTraitClue(animal)
  return statFromRegistry('diet', clueId, displayLabel)
}

function resolveLifespanIcon(animal: Animal): DiscoverStatIconResult {
  return {
    src: CLUE_ICONS.lifespan,
    fallbackText: '⏳',
    label: `Lifespan: ${animal.lifespan}`,
  }
}

/**
 * Resolve a pixel-art icon for the given stat kind and animal.
 *
 * Always returns a result with a `fallbackText`; `src` may be undefined when
 * no matching WebP is available.
 */
export function getDiscoverStatIcon(
  kind: DiscoverStatIconKind,
  animal: Animal,
): DiscoverStatIconResult {
  switch (kind) {
    case 'group':
      return resolveGroupIcon(animal)
    case 'habitat':
      return resolveHabitatIcon(animal)
    case 'diet':
      return resolveDietIcon(animal)
    case 'lifespan':
      return resolveLifespanIcon(animal)
  }
}
