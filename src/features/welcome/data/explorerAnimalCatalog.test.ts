import { describe, it, expect } from 'vitest'
import { resolveExplorerChatAnimalType, EXPLORER_ANIMAL_CATALOG } from './explorerAnimalCatalog'

describe('resolveExplorerChatAnimalType', () => {
  it('resolves Malayan Tiger to tiger', () => {
    expect(resolveExplorerChatAnimalType({ animalId: 'malayan-tiger' })).toBe('tiger')
  })

  it('covers all 8 explorer animals with non-empty string', () => {
    for (const animal of EXPLORER_ANIMAL_CATALOG) {
      const chatType = resolveExplorerChatAnimalType({ animalId: animal.backendAnimalId })
      expect(chatType).toBeTruthy()
      expect(chatType).not.toBe('')
    }
  })

  it('resolves legacy aliases correctly', () => {
    expect(resolveExplorerChatAnimalType({ animalId: 'orangutan' })).toBe('orangutan')
    expect(resolveExplorerChatAnimalType({ animalId: 'hornbill' })).toBe('hornbill')
    expect(resolveExplorerChatAnimalType({ animalId: 'pangolin' })).toBe('pangolin')
    expect(resolveExplorerChatAnimalType({ animalId: 'crocodile' })).toBe('crocodile')
  })

  it('falls back to tiger if no animalId provided', () => {
    expect(resolveExplorerChatAnimalType({})).toBe('tiger')
  })
})
