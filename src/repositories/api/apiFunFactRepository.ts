import { apiClient } from '@/services/apiClient'
import { mapFunFactFromApiDto, type FunFact, type FunFactApiDto } from '@/domain/funFact'
import type { IFunFactRepository } from '../interfaces'
import { storageService } from '@/services/storageService'
import { STORAGE_KEYS } from '@/app/config'
import type { AnimalCardApiDto } from '@/domain/animalApi.dto'
import { mapAnimalListItemFromCardApiDto, pickBackendIdFromAnimalCardWire } from '@/domain/animalApi.dto'
import type { ImageAttribution } from '@/domain/imageAttribution'

type AnimalEnrichContext = {
  commonName: string
  categoryEmoji: string
  visualKey?: string
  imageUrl?: string
  imageAttribution?: ImageAttribution
}

export class ApiFunFactRepository implements IFunFactRepository {
  // ── Per-animal lazy cache ──────────────────────────────────────────────────
  // Key: `${sessionToken}:${animalId}` — automatically stale on explorer switch.
  private animalFactsCache = new Map<string, FunFact[]>()

  // ── All-facts cache (used by getAll) ──────────────────────────────────────
  private allCache: FunFact[] | null = null
  private allCacheToken: string | null = null

  private getCurrentToken(): string | null {
    return storageService.get<string>(STORAGE_KEYS.SESSION_TOKEN) ?? null
  }

  private perAnimalKey(animalId: string): string {
    return `${this.getCurrentToken() ?? ''}:${animalId}`
  }

  /**
   * GET /api/fun-facts/{animalId}
   * Lazy-loaded when the child flips a card.
   * Cached by session token + animalId.
   */
  async getByAnimalId(
    animalId: string,
    animalContext: AnimalEnrichContext,
    force = false,
  ): Promise<FunFact[]> {
    const key = this.perAnimalKey(animalId)

    if (!force && this.animalFactsCache.has(key)) {
      return this.animalFactsCache.get(key)!
    }

    try {
      const dtos = await apiClient.get<FunFactApiDto[]>(`/fun-facts/${animalId}`)
      const facts = dtos.map((dto) =>
        mapFunFactFromApiDto(dto, {
          id: animalId,
          ...animalContext,
        }),
      )
      this.animalFactsCache.set(key, facts)
      return facts
    } catch (e) {
      console.warn(`[apiFunFactRepository] Failed to fetch facts for animal ${animalId}`, e)
      return []
    }
  }

  /**
   * GET /api/fun-facts — collection endpoint.
   * The collection response does NOT include animal identity per item.
   * This method is kept for interface compliance and legacy use.
   * The main page flow uses getByAnimalId() lazily instead.
   *
   * Because animal identity is missing from the collection response, this
   * method fetches GET /api/animals first to build the enrichment context,
   * then fetches per-animal facts. This is less efficient than using
   * GET /api/fun-facts directly, but it is the only truthful option.
   */
  async getAll(): Promise<FunFact[]> {
    const currentToken = this.getCurrentToken()
    if (this.allCache !== null && this.allCacheToken === currentToken) {
      return this.allCache
    }

    try {
      // Build animal enrichment context from the animals list
      const animalDtos = await apiClient.get<AnimalCardApiDto[]>('/animals')
      const contextMap = new Map<string, AnimalEnrichContext & { id: string }>()
      for (const dto of animalDtos) {
        const id = pickBackendIdFromAnimalCardWire(dto)
        if (!id) continue
        const row = mapAnimalListItemFromCardApiDto(dto)
        contextMap.set(id, {
          id,
          commonName: row.commonName,
          categoryEmoji: row.iconEmoji,
          visualKey: row.visualKey,
          imageUrl: row.imageUrl,
          imageAttribution: row.imageAttribution,
        })
      }

      // Populate per-animal cache where not yet loaded, and merge all facts
      const factArrays = await Promise.all(
        [...contextMap.entries()].map(async ([animalId, ctx]) => {
          const key = this.perAnimalKey(animalId)
          if (this.animalFactsCache.has(key)) {
            return this.animalFactsCache.get(key)!
          }
          try {
            const dtos = await apiClient.get<FunFactApiDto[]>(`/fun-facts/${animalId}`)
            const facts = dtos.map((dto) => mapFunFactFromApiDto(dto, ctx))
            this.animalFactsCache.set(key, facts)
            return facts
          } catch {
            return []
          }
        }),
      )

      const result = factArrays.flat()
      this.allCache = result
      this.allCacheToken = currentToken
      return result
    } catch (e) {
      console.warn('[apiFunFactRepository] Failed to load all fun facts', e)
      return []
    }
  }

  async getById(id: string): Promise<FunFact | null> {
    // Search the per-animal cache first, then fall back to getAll
    for (const facts of this.animalFactsCache.values()) {
      const found = facts.find((f) => f.id === id)
      if (found) return found
    }
    if (this.allCache) {
      return this.allCache.find((f) => f.id === id) ?? null
    }
    return null
  }

  /**
   * Purge all internal caches.
   * Called by funFactStore.invalidateFactsCache() after a profile level-up so
   * the next getByAnimalId() re-fetches personalised access state from the backend.
   * Without this, the in-memory Map would keep returning stale userLevel / accessStatus
   * even after the store-level cache is cleared.
   */
  clearCache(): void {
    this.animalFactsCache.clear()
    this.allCache = null
    this.allCacheToken = null
  }
}
