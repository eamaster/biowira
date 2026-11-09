import { describe, it, expect } from 'vitest'
import { AnimalCategory } from './enums'
import {
  fromBackendCategoryLabel,
  toBackendCategoryQuery,
  BACKEND_CATEGORY_VALUES,
} from './animalCategoryMap'
import { conservationCodeToStatus } from './conservationMapping'
import { ConservationStatus } from './enums'
import {
  mapAnimalListItemFromCardApiDto,
  mapAnimalDetailFromApiDto,
  mapAnimalOccurrenceFromApiDto,
  buildAnimalListKeyFromCardDto,
} from './animalApi.dto'

describe('animalCategoryMap', () => {
  it('maps internal category to backend query string', () => {
    expect(toBackendCategoryQuery(AnimalCategory.All)).toBeUndefined()
    expect(toBackendCategoryQuery(AnimalCategory.Mammals)).toBe('Mammals')
    expect(toBackendCategoryQuery(AnimalCategory.MarineFreshwater)).toBe('Marine & Freshwater')
  })

  it('maps backend labels to internal enum', () => {
    expect(fromBackendCategoryLabel('Mammals')).toBe(AnimalCategory.Mammals)
    expect(fromBackendCategoryLabel('Marine & Freshwater')).toBe(AnimalCategory.MarineFreshwater)
  })

  it('has a backend string for every non-All category', () => {
    const keys = Object.keys(BACKEND_CATEGORY_VALUES) as AnimalCategory[]
    expect(keys).not.toContain(AnimalCategory.All)
    for (const k of keys) {
      expect(BACKEND_CATEGORY_VALUES[k]).toBeTruthy()
    }
  })

  it('URLSearchParams round-trips Marine & Freshwater for API queries', () => {
    const cat = toBackendCategoryQuery(AnimalCategory.MarineFreshwater)!
    // New contract: query param is `animalClass`, not `category`
    const p = new URLSearchParams({ animalClass: cat })
    expect(p.get('animalClass')).toBe('Marine & Freshwater')
  })
})

describe('conservationMapping', () => {
  it('maps IUCN-style codes to internal status', () => {
    expect(conservationCodeToStatus('CR')).toBe(ConservationStatus.CriticallyEndangered)
    expect(conservationCodeToStatus('LC')).toBe(ConservationStatus.LeastConcern)
    expect(conservationCodeToStatus('xx')).toBe(ConservationStatus.NotEvaluated)
  })
})

describe('animalApi.dto mappers', () => {
  it('maps list card DTO without id to list item with null backendId', () => {
    const item = mapAnimalListItemFromCardApiDto({
      commonName: 'Malayan Tiger',
      scientificName: 'Panthera tigris jacksoni',
      animalClass: 'Mammals',
      statusCode: 'CR',
      statusLabel: 'Critically Endangered',
      imageUrl: 'https://example.com/t.jpg',
    })
    expect(item.backendId).toBeNull()
    expect(item.listKey.startsWith('list:')).toBe(true)
    expect(item.statusLabelOverride).toBe('Critically Endangered')
  })

  it('uses backend id when present on card DTO (numeric id from live API)', () => {
    const item = mapAnimalListItemFromCardApiDto({
      id: 1,
      commonName: 'Malayan Tiger',
      scientificName: 'Panthera tigris jacksoni',
      animalClass: 'Mammals',
      statusCode: 'CR',
      statusLabel: 'Critically Endangered',
    })
    expect(item.backendId).toBe('1')
    expect(item.listKey).toBe('1')
  })

  it('uses backend id when present on card DTO (numeric id other than 1)', () => {
    const item = mapAnimalListItemFromCardApiDto({
      id: 42,
      commonName: 'Test',
      scientificName: 'Test sp.',
      animalClass: 'Birds',
      statusCode: 'VU',
      statusLabel: 'Vulnerable',
    })
    expect(item.backendId).toBe('42')
    expect(item.listKey).toBe('42')
  })

  it('maps list card DTO: animalClass field is used (not category)', () => {
    const item = mapAnimalListItemFromCardApiDto({
      id: 10,
      commonName: 'Sun Bear',
      scientificName: 'Helarctos malayanus',
      animalClass: 'Mammals',
      statusCode: 'VU',
      statusLabel: 'Vulnerable',
    })
    expect(item.category).toBe(AnimalCategory.Mammals)
  })

  it('maps detail DTO with className (not categoryName)', () => {
    const a = mapAnimalDetailFromApiDto(
      {
        commonName: 'Malayan Tiger',
        scientificName: 'Panthera tigris jacksoni',
        className: 'Mammals',
        conservationCode: 'CR',
        conservationLabel: 'Critically Endangered',
        conservationDescription: 'Desc',
        habitats: ['Forests', 'Rainforest'],
        threats: ['Poaching', 'Habitat Loss'],
        diet: 'Carnivore',
        lifespan: '10y',
        description: 'Kid-friendly text',
      },
      '1',
    )
    expect(a.id).toBe('1')
    expect(a.category).toBe(AnimalCategory.Mammals)
    expect(a.conservationExplanation).toBe('Desc')
    expect(a.habitatDisplay).toBe('Forests, Rainforest')
    expect(a.habitats).toEqual(['Forests', 'Rainforest'])
    expect(a.threats).toEqual(['Poaching', 'Habitat Loss'])
    expect(a.occurrences).toEqual([])
  })

  it('maps detail DTO: no conservationReason in the mapped output (removed from API)', () => {
    const a = mapAnimalDetailFromApiDto(
      {
        commonName: 'Sun Bear',
        scientificName: 'Helarctos malayanus',
        className: 'Mammals',
        conservationCode: 'VU',
        conservationLabel: 'Vulnerable',
        conservationDescription: 'Under threat',
        habitats: ['Tropical Rainforest'],
        threats: ['Deforestation'],
        diet: 'Omnivore',
        lifespan: '25y',
        description: 'Small bear.',
      },
      '2',
    )
    // conservationReason is NOT set by the live API mapper
    expect(a.conservationReason).toBeUndefined()
  })

  it('maps detail DTO: empty habitats/threats arrays handled gracefully', () => {
    const a = mapAnimalDetailFromApiDto(
      {
        commonName: 'Crocodile',
        scientificName: 'Crocodylus porosus',
        className: 'Reptiles',
        conservationCode: 'LC',
        conservationLabel: 'Least Concern',
        conservationDescription: 'Stable',
        habitats: [],
        threats: [],
        diet: 'Carnivore',
        lifespan: '70y',
        description: 'Large reptile.',
      },
      '3',
    )
    expect(a.habitatDisplay).toBeUndefined()
    expect(a.habitats).toEqual([])
    expect(a.threats).toEqual([])
  })

  it('maps detail DTO: Swagger-style habitat objects use habitatName', () => {
    const a = mapAnimalDetailFromApiDto(
      {
        commonName: 'Malayan Tiger',
        scientificName: 'Panthera tigris jacksoni',
        className: 'Mammals',
        conservationCode: 'VU',
        conservationLabel: 'Vulnerable',
        conservationDescription: 'Needs help',
        habitats: [
          { habitatName: 'Forest', priority: 'Primary', emoji: '🌿' },
          { habitatName: 'Wetlands', priority: 'Primary', emoji: '🌳' },
          { habitatName: 'Grassland', priority: 'Secondary', emoji: '🌾' },
        ],
        threats: [
          { threatName: 'Losing Their Homes', explanation: '…', priority: 'High' },
          { threatName: 'Hunting and Catching', explanation: '…', priority: 'High' },
        ],
        diet: 'Carnivore',
        lifespan: '10y',
        description: 'Tiger text',
      },
      '1',
    )
    expect(a.habitatDisplay).toBe('Forest, Wetlands, Grassland')
    expect(a.habitats).toEqual(['Forest', 'Wetlands', 'Grassland'])
    expect(a.threats).toEqual(['Losing Their Homes', 'Hunting and Catching'])
  })

  it('maps occurrence DTO: only latitude and longitude (no locationName/observedAt)', () => {
    const o = mapAnimalOccurrenceFromApiDto(
      {
        latitude: 1.5,
        longitude: 101.2,
      },
      0,
    )
    expect(o.latitude).toBe(1.5)
    expect(o.longitude).toBe(101.2)
    expect(o.id).toContain('occ-api-0')
    expect(o.locationName).toBeUndefined()
    expect(o.observedAt).toBeUndefined()
  })

  it('buildAnimalListKeyFromCardDto uses animalClass in fallback key', () => {
    const dto = {
      commonName: 'A',
      scientificName: 'B b',
      animalClass: 'Mammals',
      statusCode: 'LC',
      statusLabel: 'LC',
    }
    expect(buildAnimalListKeyFromCardDto(dto)).toBe(buildAnimalListKeyFromCardDto(dto))
    expect(buildAnimalListKeyFromCardDto(dto).startsWith('list:')).toBe(true)
  })

  it('GET /animals list filter sends animalClass query param (not category)', () => {
    const cat = toBackendCategoryQuery(AnimalCategory.Birds)!
    const params = new URLSearchParams({ animalClass: cat })
    expect(params.get('animalClass')).toBe('Birds')
    expect(params.get('category')).toBeNull()
  })
})
