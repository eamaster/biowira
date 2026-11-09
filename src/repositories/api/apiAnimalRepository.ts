import { apiClient, ApiError } from '@/services/apiClient'
import type { Animal, AnimalListItem, AnimalOccurrence } from '@/domain/animal'
import type { AnimalCategory } from '@/domain/enums'
import { AnimalCategory as AC } from '@/domain/enums'
import type { IAnimalRepository } from '../interfaces'
import type { PaginatedAnimalResult } from '../interfaces'
import {
  mapAnimalDetailFromApiDto,
  mapAnimalListItemFromCardApiDto,
  mapAnimalOccurrenceFromApiDto,
  type AnimalCardApiDto,
  type AnimalDetailApiDto,
  type AnimalOccurrenceApiDto,
  type PaginatedAnimalCardApiResponse,
} from '@/domain/animalApi.dto'
import { toBackendCategoryQuery } from '@/domain/animalCategoryMap'

const API_V2_BASE = '/api/v2'

export class ApiAnimalRepository implements IAnimalRepository {
  async getAll(): Promise<AnimalListItem[]> {
    return this.fetchAnimalList(AC.All)
  }

  async getByCategory(category: AnimalCategory): Promise<AnimalListItem[]> {
    return this.fetchAnimalList(category)
  }

  async getPage(
    category: AnimalCategory,
    offset: number,
    limit: number,
  ): Promise<PaginatedAnimalResult> {
    const backendCategory = toBackendCategoryQuery(category)
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    })
    if (backendCategory !== undefined) {
      params.set('animalClass', backendCategory)
    }
    const response = await apiClient.get<PaginatedAnimalCardApiResponse>(
      `/animals?${params.toString()}`,
      { baseUrl: API_V2_BASE },
    )
    return {
      items: (response.items ?? []).map(mapAnimalListItemFromCardApiDto),
      totalCount: response.totalCount,
    }
  }

  private async fetchAnimalList(category: AnimalCategory): Promise<AnimalListItem[]> {
    const backendCategory = toBackendCategoryQuery(category)
    const path =
      backendCategory === undefined
        ? '/animals'
        : `/animals?${new URLSearchParams({ animalClass: backendCategory }).toString()}`
    const dtos = await apiClient.get<AnimalCardApiDto[]>(path)
    return dtos.map(mapAnimalListItemFromCardApiDto)
  }

  async getById(id: string): Promise<Animal | null> {
    try {
      const dto = await apiClient.get<AnimalDetailApiDto>(
        `/animals/${encodeURIComponent(id)}`,
        { baseUrl: API_V2_BASE },
      )
      return mapAnimalDetailFromApiDto(dto, id)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    }
  }

  async getOccurrencesByAnimalId(animalId: string): Promise<AnimalOccurrence[]> {
    try {
      const dtos = await apiClient.get<AnimalOccurrenceApiDto[]>(
        `/animals/${encodeURIComponent(animalId)}/occurrence`,
      )
      return dtos.map((d, i) => mapAnimalOccurrenceFromApiDto(d, i))
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return []
      throw e
    }
  }
}
