/**
 * demoFunFactUnlocks.test.ts
 *
 * Tests for the centralised demo fun-fact unlock resolver.
 */
import { describe, it, expect } from 'vitest'
import {
  normalizeDemoFunFactAnimalId,
  isDemoFunFactUnlockAnimal,
  resolveDemoFunFactUnlockAnimal,
  DEMO_FUN_FACT_UNLOCK_ANIMALS,
} from '@/domain/demoFunFactUnlocks'

describe('DEMO_FUN_FACT_UNLOCK_ANIMALS', () => {
  it('contains exactly 3 animals', () => {
    expect(DEMO_FUN_FACT_UNLOCK_ANIMALS).toHaveLength(3)
  })

  it('has canonical IDs: malayan-tiger, bornean-orangutan, sun-bear', () => {
    const ids = DEMO_FUN_FACT_UNLOCK_ANIMALS.map((a) => a.canonicalId)
    expect(ids).toContain('malayan-tiger')
    expect(ids).toContain('bornean-orangutan')
    expect(ids).toContain('sun-bear')
  })
})

describe('normalizeDemoFunFactAnimalId', () => {
  it('resolves canonical id malayan-tiger', () => {
    expect(normalizeDemoFunFactAnimalId('malayan-tiger')).toBe('malayan-tiger')
  })

  it('resolves common name Malayan Tiger (case-insensitive)', () => {
    // normalizeDemoFunFactAnimalId lowercases the input before matching aliases
    expect(normalizeDemoFunFactAnimalId('Malayan Tiger')).toBe('malayan-tiger')
    expect(normalizeDemoFunFactAnimalId('malayan tiger')).toBe('malayan-tiger')
    expect(normalizeDemoFunFactAnimalId('MALAYAN TIGER')).toBe('malayan-tiger')
  })

  it('resolves canonical id bornean-orangutan', () => {
    expect(normalizeDemoFunFactAnimalId('bornean-orangutan')).toBe('bornean-orangutan')
  })

  it('resolves alias orangutan -> bornean-orangutan', () => {
    expect(normalizeDemoFunFactAnimalId('orangutan')).toBe('bornean-orangutan')
  })

  it('resolves visual key orangutan -> bornean-orangutan', () => {
    expect(normalizeDemoFunFactAnimalId('orangutan')).toBe('bornean-orangutan')
  })

  it('resolves canonical id sun-bear', () => {
    expect(normalizeDemoFunFactAnimalId('sun-bear')).toBe('sun-bear')
  })

  it('returns null for saltwater-crocodile', () => {
    expect(normalizeDemoFunFactAnimalId('saltwater-crocodile')).toBeNull()
  })

  it('returns null for sunda-pangolin', () => {
    expect(normalizeDemoFunFactAnimalId('sunda-pangolin')).toBeNull()
  })

  it('returns null for dugong', () => {
    expect(normalizeDemoFunFactAnimalId('dugong')).toBeNull()
  })

  it('returns null for tapir', () => {
    expect(normalizeDemoFunFactAnimalId('tapir')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(normalizeDemoFunFactAnimalId(null)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(normalizeDemoFunFactAnimalId('')).toBeNull()
  })
})

describe('isDemoFunFactUnlockAnimal', () => {
  it('returns true for malayan-tiger', () => {
    expect(isDemoFunFactUnlockAnimal('malayan-tiger')).toBe(true)
  })

  it('returns true for bornean-orangutan', () => {
    expect(isDemoFunFactUnlockAnimal('bornean-orangutan')).toBe(true)
  })

  it('returns true for orangutan (alias)', () => {
    expect(isDemoFunFactUnlockAnimal('orangutan')).toBe(true)
  })

  it('returns true for sun-bear', () => {
    expect(isDemoFunFactUnlockAnimal('sun-bear')).toBe(true)
  })

  it('returns false for saltwater-crocodile', () => {
    expect(isDemoFunFactUnlockAnimal('saltwater-crocodile')).toBe(false)
  })

  it('returns false for dugong', () => {
    expect(isDemoFunFactUnlockAnimal('dugong')).toBe(false)
  })
})

describe('resolveDemoFunFactUnlockAnimal', () => {
  it('resolves by animalVisualKey malayan-tiger', () => {
    const result = resolveDemoFunFactUnlockAnimal({ animalVisualKey: 'malayan-tiger' })
    expect(result).not.toBeNull()
    expect(result!.canonicalId).toBe('malayan-tiger')
  })

  it('resolves by animalVisualKey orangutan -> bornean-orangutan', () => {
    const result = resolveDemoFunFactUnlockAnimal({ animalVisualKey: 'orangutan' })
    expect(result).not.toBeNull()
    expect(result!.canonicalId).toBe('bornean-orangutan')
  })

  it('resolves by animalName "Malayan Tiger"', () => {
    const result = resolveDemoFunFactUnlockAnimal({ animalName: 'Malayan Tiger' })
    expect(result).not.toBeNull()
    expect(result!.canonicalId).toBe('malayan-tiger')
  })

  it('resolves by animalName "Bornean Orangutan"', () => {
    const result = resolveDemoFunFactUnlockAnimal({ animalName: 'Bornean Orangutan' })
    expect(result).not.toBeNull()
    expect(result!.canonicalId).toBe('bornean-orangutan')
  })

  it('resolves by animalId bornean-orangutan', () => {
    const result = resolveDemoFunFactUnlockAnimal({ animalId: 'bornean-orangutan' })
    expect(result).not.toBeNull()
    expect(result!.canonicalId).toBe('bornean-orangutan')
  })

  it('resolves sun-bear by visualKey', () => {
    const result = resolveDemoFunFactUnlockAnimal({ animalVisualKey: 'sun-bear' })
    expect(result).not.toBeNull()
    expect(result!.canonicalId).toBe('sun-bear')
  })

  it('returns null for saltwater-crocodile', () => {
    expect(resolveDemoFunFactUnlockAnimal({ animalVisualKey: 'saltwater-crocodile' })).toBeNull()
  })

  it('returns null for empty context', () => {
    expect(resolveDemoFunFactUnlockAnimal({})).toBeNull()
  })
})
