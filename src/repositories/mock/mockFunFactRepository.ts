import { MOCK_FUN_FACTS } from '@/mocks/funFacts'
import type { FunFact } from '@/domain/funFact'
import type { IFunFactRepository } from '../interfaces'
import type { ImageAttribution } from '@/domain/imageAttribution'

const store: FunFact[] = structuredClone(MOCK_FUN_FACTS)

export class MockFunFactRepository implements IFunFactRepository {
  async getAll(): Promise<FunFact[]> {
    return structuredClone(store).sort((a: FunFact, b: FunFact) => b.unlockLevel - a.unlockLevel)
  }

  async getById(id: string): Promise<FunFact | null> {
    return store.find((f) => f.id === id) ?? null
  }

  async getByAnimalId(
    animalId: string,
    _animalContext?: {
      commonName: string
      categoryEmoji: string
      visualKey?: string
      imageUrl?: string
      imageAttribution?: ImageAttribution
    },
    _force?: boolean,
  ): Promise<FunFact[]> {
    // Filter mock facts by animalId slug
    return structuredClone(store.filter((f) => f.animalId === animalId))
  }

  /** Mock repo holds no cache — no-op to satisfy IFunFactRepository contract. */
  clearCache(): void {
    // no-op
  }
}
