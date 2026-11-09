import { AnimalCategory } from './enums'

/** Backend query values for GET /api/animals?category=… */
export const BACKEND_CATEGORY_VALUES: Record<Exclude<AnimalCategory, AnimalCategory.All>, string> = {
  [AnimalCategory.Mammals]: 'Mammals',
  [AnimalCategory.Birds]: 'Birds',
  [AnimalCategory.Reptiles]: 'Reptiles',
  [AnimalCategory.MarineFreshwater]: 'Marine & Freshwater',
  [AnimalCategory.Amphibians]: 'Amphibians',
  [AnimalCategory.Insects]: 'Insects',
}

const BACKEND_LABEL_TO_CATEGORY: Record<string, AnimalCategory> = Object.fromEntries(
  Object.entries(BACKEND_CATEGORY_VALUES).map(([k, v]) => [v, k as AnimalCategory]),
) as Record<string, AnimalCategory>

/**
 * Maps internal category to the backend query string.
 * Returns undefined for "All" (no filter param).
 */
export function toBackendCategoryQuery(category: AnimalCategory): string | undefined {
  if (category === AnimalCategory.All) return undefined
  return BACKEND_CATEGORY_VALUES[category]
}

/**
 * Maps backend category label (list `category` or detail `categoryName`) to internal enum.
 */
export function fromBackendCategoryLabel(label: string): AnimalCategory {
  return BACKEND_LABEL_TO_CATEGORY[label] ?? AnimalCategory.Mammals
}
