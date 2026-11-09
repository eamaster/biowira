// ============================================================
// BioWira Demo Fun Fact Unlock Configuration
//
// This is the ONLY place where the 3 demo unlock animals are
// configured. All quiz-unlock eligibility checks must go through
// this module — never hardcode animal names in components.
//
// DEMO ONLY: In the live product, unlocks are level-gated.
// For the 3 animals below, completing their quiz unlocks all facts.
// ============================================================

export interface DemoFunFactUnlockAnimal {
  /** Stable, URL-safe canonical ID used as the storage key. */
  canonicalId: string
  /** Human-readable display name. */
  displayName: string
  /** Known visual keys (animalVisualKey from profile / discover). */
  visualKeys: readonly string[]
  /** Known common name variants (case-insensitive match). */
  commonNameAliases: readonly string[]
  /** Known scientific name fragment (case-insensitive contains match). */
  scientificNameFragment?: string
}

/** The 3 animals eligible for demo fun-fact unlock via quiz completion. */
export const DEMO_FUN_FACT_UNLOCK_ANIMALS: readonly DemoFunFactUnlockAnimal[] = [
  {
    canonicalId: 'malayan-tiger',
    displayName: 'Malayan Tiger',
    visualKeys: ['malayan-tiger'],
    commonNameAliases: ['malayan tiger', 'tiger'],
    scientificNameFragment: 'panthera tigris jacksoni',
  },
  {
    canonicalId: 'bornean-orangutan',
    displayName: 'Bornean Orangutan',
    visualKeys: ['bornean-orangutan', 'orangutan'],
    commonNameAliases: ['bornean orangutan', 'orangutan'],
    scientificNameFragment: 'pongo pygmaeus',
  },
  {
    canonicalId: 'sun-bear',
    displayName: 'Sun Bear',
    visualKeys: ['sun-bear'],
    commonNameAliases: ['sun bear'],
    scientificNameFragment: 'helarctos malayanus',
  },
] as const

/**
 * Normalise a raw string (animalId, visual key, common name, etc.) to a
 * canonical demo-unlock ID, or return null if not recognised.
 */
export function normalizeDemoFunFactAnimalId(input: string | null | undefined): string | null {
  if (!input) return null
  const lower = input.trim().toLowerCase()
  for (const animal of DEMO_FUN_FACT_UNLOCK_ANIMALS) {
    if (animal.canonicalId === lower) return animal.canonicalId
    if (animal.visualKeys.some((k) => k === lower)) return animal.canonicalId
    if (animal.commonNameAliases.some((a) => a === lower)) return animal.canonicalId
  }
  return null
}

/** Whether the given input resolves to one of the 3 demo unlock animals. */
export function isDemoFunFactUnlockAnimal(input: string | null | undefined): boolean {
  return normalizeDemoFunFactAnimalId(input) !== null
}

/**
 * Resolve an animal context object to the matching demo-unlock animal, or null.
 * Resolution priority:
 *  1. animalVisualKey (most stable)
 *  2. animalId (backend id — may be numeric, so check visual key form)
 *  3. animalName (common name)
 *  4. scientificName (substring match, case-insensitive)
 */
export function resolveDemoFunFactUnlockAnimal(input: {
  animalId?: string | null
  animalName?: string | null
  animalVisualKey?: string | null
  scientificName?: string | null
}): DemoFunFactUnlockAnimal | null {
  // 1. Visual key
  if (input.animalVisualKey) {
    const lower = input.animalVisualKey.trim().toLowerCase()
    for (const animal of DEMO_FUN_FACT_UNLOCK_ANIMALS) {
      if (animal.visualKeys.some((k) => k === lower)) return animal
    }
  }

  // 2. animalId (treat as visual-key-style string)
  if (input.animalId) {
    const lower = input.animalId.trim().toLowerCase()
    for (const animal of DEMO_FUN_FACT_UNLOCK_ANIMALS) {
      if (animal.canonicalId === lower) return animal
      if (animal.visualKeys.some((k) => k === lower)) return animal
    }
  }

  // 3. Common name aliases
  if (input.animalName) {
    const lower = input.animalName.trim().toLowerCase()
    for (const animal of DEMO_FUN_FACT_UNLOCK_ANIMALS) {
      if (animal.commonNameAliases.some((a) => a === lower)) return animal
    }
  }

  // 4. Scientific name substring
  if (input.scientificName) {
    const lower = input.scientificName.trim().toLowerCase()
    for (const animal of DEMO_FUN_FACT_UNLOCK_ANIMALS) {
      if (animal.scientificNameFragment && lower.includes(animal.scientificNameFragment)) {
        return animal
      }
    }
  }

  return null
}
