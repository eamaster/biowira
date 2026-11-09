import { MOCK_ANIMALS } from '@/mocks/animals'
import type { Animal, AnimalListItem, AnimalOccurrence } from '@/domain/animal'
import { mapAnimalToListItem } from '@/domain/animal'
import { finalizeImageAttribution } from '@/domain/imageAttribution'
import type { AnimalCategory } from '@/domain/enums'
import { AnimalCategory as AC } from '@/domain/enums'
import type { IAnimalRepository, PaginatedAnimalResult } from '../interfaces'

export class MockAnimalRepository implements IAnimalRepository {
  async getAll(): Promise<AnimalListItem[]> {
    return MOCK_ANIMALS.map((a) => mapAnimalToListItem(a))
  }

  async getByCategory(category: AnimalCategory): Promise<AnimalListItem[]> {
    const source =
      category === AC.All ? MOCK_ANIMALS : MOCK_ANIMALS.filter((a) => a.category === category)
    return source.map((a) => mapAnimalToListItem(a))
  }

  async getPage(
    category: AnimalCategory,
    offset: number,
    limit: number,
  ): Promise<PaginatedAnimalResult> {
    const source =
      category === AC.All ? MOCK_ANIMALS : MOCK_ANIMALS.filter((a) => a.category === category)
    const all = source.map((a) => mapAnimalToListItem(a))
    return {
      items: all.slice(offset, offset + limit),
      totalCount: all.length,
    }
  }

  async getById(id: string): Promise<Animal | null> {
    const raw = MOCK_ANIMALS.find((a) => a.id === id)
    if (!raw) return null
    const animal = structuredClone(raw)
    const photoUrl = animal.animalPhotoUrl?.trim()
    if (photoUrl && !animal.imageAttribution) {
      animal.imageAttribution = finalizeImageAttribution(undefined, photoUrl, 'BioWira image asset')
    } else if (!photoUrl) {
      const merged = animal.imageUrl?.trim()
      if (merged && !animal.imageAttribution) {
        animal.imageAttribution = finalizeImageAttribution(undefined, merged, 'BioWira image asset')
      }
    }
    const av = animal.avatarPath?.trim()
    if (av && !animal.avatarAttribution) {
      animal.avatarAttribution = finalizeImageAttribution(undefined, av, 'BioWira avatar asset')
    }
    return animal
  }

  async getOccurrencesByAnimalId(animalId: string): Promise<AnimalOccurrence[]> {
    const animal = MOCK_ANIMALS.find((a) => a.id === animalId)
    return structuredClone(animal?.occurrences ?? [])
  }
}
