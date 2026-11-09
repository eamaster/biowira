import { describe, it, expect } from 'vitest'
import { findAnimalListItemForFocusId } from '@/domain/discoverFocus'
import type { AnimalListItem } from '@/domain/animal'
import { AnimalCategory } from '@/domain/enums'

function item(partial: Partial<AnimalListItem> & Pick<AnimalListItem, 'listKey'>): AnimalListItem {
  return {
    commonName: 'Tiger',
    scientificName: 'Panthera tigris',
    category: AnimalCategory.Mammals,
    conservationStatus: 'endangered',
    iconEmoji: '🐯',
    backendId: null,
    ...partial,
  }
}

describe('findAnimalListItemForFocusId', () => {
  it('matches backend id', () => {
    const items: AnimalListItem[] = [
      item({ listKey: '42', backendId: '42', commonName: 'A' }),
      item({ listKey: '99', backendId: '99', commonName: 'B' }),
    ]
    expect(findAnimalListItemForFocusId(items, '42')?.commonName).toBe('A')
  })

  it('matches listKey when backend id differs', () => {
    const items: AnimalListItem[] = [item({ listKey: 'list:foo', backendId: null, commonName: 'X' })]
    expect(findAnimalListItemForFocusId(items, 'list:foo')?.commonName).toBe('X')
  })

  it('matches visual key case-insensitively', () => {
    const items: AnimalListItem[] = [
      item({ listKey: 'k1', backendId: '1', visualKey: 'malayan-tiger', commonName: 'T' }),
    ]
    expect(findAnimalListItemForFocusId(items, 'Malayan-Tiger')?.visualKey).toBe('malayan-tiger')
  })

  it('returns null when nothing matches', () => {
    const items: AnimalListItem[] = [item({ listKey: 'a', backendId: '1', commonName: 'Z' })]
    expect(findAnimalListItemForFocusId(items, 'missing')).toBeNull()
  })
})
