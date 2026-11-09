import {
  EXPLORER_ANIMAL_CATALOG,
  type ExplorerAnimalChoice,
} from '@/features/welcome/data/explorerAnimalCatalog'

/**
 * Loads the curated 8 explorer picker rows.
 * The picker is NOT derived from registered icon keys — it is a fixed curated list.
 * Profile creation resolves the API `animalId` separately via {@link resolveProfileAnimalWireId}.
 */
export async function loadExplorerAnimalChoices(): Promise<ExplorerAnimalChoice[]> {
  return [...EXPLORER_ANIMAL_CATALOG]
}
