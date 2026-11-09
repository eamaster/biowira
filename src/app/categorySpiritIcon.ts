// ── Discover category filter — spirit clue icons (same art as Explorer Rescue) ─
import { AnimalCategory } from '@/domain/enums'
import { EXPLORER_RESCUE_ASSETS } from '@/app/branding'
import { CATEGORY_EMOJI } from '@/app/config'

const CLUES = EXPLORER_RESCUE_ASSETS.gameplay.clues

export interface CategorySpiritIcon {
  /** Pixel clue WebP when available */
  iconSrc?: string
  /** Shown only when `iconSrc` is absent (e.g. "All") */
  emoji?: string
}

/**
 * Map a Discover category tab id to a spirit icon path or emoji fallback.
 */
export function getCategorySpiritIcon(categoryId: string): CategorySpiritIcon {
  switch (categoryId) {
    case AnimalCategory.Mammals:
      return { iconSrc: CLUES.groupMammal }
    case AnimalCategory.Birds:
      return { iconSrc: CLUES.groupBird }
    case AnimalCategory.MarineFreshwater:
      return { iconSrc: CLUES.groupMarine }
    case AnimalCategory.Reptiles:
      return { iconSrc: CLUES.groupReptiles }
    case AnimalCategory.Amphibians:
      return { iconSrc: CLUES.groupAmphibians }
    case AnimalCategory.Insects:
      return { iconSrc: CLUES.groupInsects }
    case AnimalCategory.All:
    default:
      return { emoji: CATEGORY_EMOJI[categoryId] ?? '🌿' }
  }
}
