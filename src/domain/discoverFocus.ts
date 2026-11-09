import type { AnimalListItem } from './animal'

/**
 * Match a saved "last visited" animal id to a discover list row.
 * `focusId` may be a backend id, listKey, or visual key depending on data source.
 */
export function findAnimalListItemForFocusId(
  items: AnimalListItem[],
  focusId: string,
): AnimalListItem | null {
  const raw = focusId.trim()
  if (!raw) return null
  const lower = raw.toLowerCase()

  for (const item of items) {
    if (item.backendId != null && item.backendId !== '') {
      if (item.backendId === raw || item.backendId.toLowerCase() === lower) return item
    }
    if (item.listKey === raw || item.listKey.toLowerCase() === lower) return item
    if (item.visualKey && (item.visualKey === raw || item.visualKey.toLowerCase() === lower)) {
      return item
    }
  }
  return null
}
