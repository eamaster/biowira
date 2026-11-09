import { describe, it, expect } from 'vitest'
import { resolveProfileAnimalWireId } from '@/features/welcome/data/resolveProfileAnimalWireId'

describe('resolveProfileAnimalWireId', () => {
  it('returns catalog slug when animals repository is mock (test env)', async () => {
    const id = await resolveProfileAnimalWireId({
      displayNickname: 'Brave Panda',
      animalId: 'sun-bear',
      animalVisualKey: 'sun-bear',
    })
    expect(id).toBe('sun-bear')
  })
})
