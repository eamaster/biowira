import { describe, it, expect } from 'vitest'
import {
  pickBackendIdFromAnimalCardWire,
  mapAnimalListItemFromCardApiDto,
  mapAnimalDetailFromApiDto,
} from '@/domain/animalApi.dto'

describe('pickBackendIdFromAnimalCardWire', () => {
  it('reads id', () => {
    expect(pickBackendIdFromAnimalCardWire({ id: 12 })).toBe('12')
  })

  it('reads animalId when id is absent', () => {
    expect(
      pickBackendIdFromAnimalCardWire({
        animalId: 'malayan-tiger',
        commonName: 'Tiger',
        scientificName: 'P. tigris',
        animalClass: 'Mammals',
        statusCode: 'EN',
        statusLabel: 'Endangered',
      }),
    ).toBe('malayan-tiger')
  })

  it('reads animal_id', () => {
    expect(
      pickBackendIdFromAnimalCardWire({
        animal_id: 99,
        commonName: 'A',
        scientificName: 'B',
        animalClass: 'Mammals',
        statusCode: 'EN',
        statusLabel: 'Endangered',
      }),
    ).toBe('99')
  })

  it('prefers id over animalId when both set', () => {
    expect(
      pickBackendIdFromAnimalCardWire({
        id: 'first',
        animalId: 'second',
        commonName: 'A',
        scientificName: 'B',
        animalClass: 'Mammals',
        statusCode: 'EN',
        statusLabel: 'Endangered',
      }),
    ).toBe('first')
  })
})

describe('mapAnimalListItemFromCardApiDto', () => {
  it('sets backendId from animalId field', () => {
    const row = mapAnimalListItemFromCardApiDto({
      animalId: 42,
      commonName: 'Sun Bear',
      scientificName: 'Helarctos malayanus',
      animalClass: 'Mammals',
      statusCode: 'VU',
      statusLabel: 'Vulnerable',
    })
    expect(row.backendId).toBe('42')
    expect(row.listKey).toBe('42')
  })

  it('uses animalClass field (new contract, not category)', () => {
    const row = mapAnimalListItemFromCardApiDto({
      id: 5,
      commonName: 'Hornbill',
      scientificName: 'Buceros rhinoceros',
      animalClass: 'Birds',
      statusCode: 'EN',
      statusLabel: 'Endangered',
    })
    // category enum is resolved from animalClass
    expect(row.backendId).toBe('5')
  })

  it('maps imageUrl-only card to fallback BioWira image attribution (CloudFront heuristic)', () => {
    const row = mapAnimalListItemFromCardApiDto({
      id: 't1',
      commonName: 'Tiger',
      scientificName: 'P. tigris',
      animalClass: 'Mammals',
      statusCode: 'EN',
      statusLabel: 'Endangered',
      imageUrl: 'https://d111111abcdef8.cloudfront.net/hero.jpg',
    })
    expect(row.imageAttribution?.isFallback).toBe(true)
    expect(row.imageAttribution?.sourceName).toBe('BioWira image asset')
    expect(row.imageAttribution?.author).toBeUndefined()
    expect(row.imageAttribution?.licenseName).toBeUndefined()
  })

  it('maps Wikimedia imageUrl card to Wikimedia Commons fallback when no citation fields exist', () => {
    const row = mapAnimalListItemFromCardApiDto({
      id: 'w1',
      commonName: 'Quokka',
      scientificName: 'S. brachyurus',
      animalClass: 'Mammals',
      statusCode: 'LC',
      statusLabel: 'Least Concern',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Example.jpg',
    })
    expect(row.imageAttribution?.sourceName).toBe('Wikimedia Commons')
    expect(row.imageAttribution?.isFallback).toBe(true)
  })

  it('maps flat imageAuthor / license fields without inventing missing values', () => {
    const row = mapAnimalListItemFromCardApiDto({
      id: 'c1',
      commonName: 'Civet',
      scientificName: 'C. civet',
      animalClass: 'Mammals',
      statusCode: 'LC',
      statusLabel: 'Least Concern',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/X.jpg',
      imageAuthor: 'Field Biologist',
      imageLicense: 'CC BY-SA 4.0',
      imageLicenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    })
    expect(row.imageAttribution?.author).toBe('Field Biologist')
    expect(row.imageAttribution?.licenseName).toBe('CC BY-SA 4.0')
    expect(row.imageAttribution?.isFallback).toBeUndefined()
  })

  it('maps nested imageAttribution object from backend', () => {
    const row = mapAnimalListItemFromCardApiDto({
      id: 'n1',
      commonName: 'A',
      scientificName: 'A a',
      animalClass: 'Birds',
      statusCode: 'LC',
      statusLabel: 'LC',
      imageUrl: 'https://example.com/z.jpg',
      imageAttribution: { author: 'Pro', creditLine: 'Custom line.' },
    })
    expect(row.imageAttribution?.creditLine).toBe('Custom line.')
    expect(row.imageAttribution?.author).toBe('Pro')
  })
})

describe('mapAnimalDetailFromApiDto (image attribution)', () => {
  it('attaches photo citation for imageUrl-only detail payload', () => {
    const a = mapAnimalDetailFromApiDto(
      {
        commonName: 'Tiger',
        scientificName: 'P. tigris',
        className: 'Mammals',
        conservationCode: 'EN',
        conservationLabel: 'Endangered',
        conservationDescription: '—',
        imageUrl: 'https://d111111abcdef8.cloudfront.net/p.jpg',
        habitats: [],
        threats: [],
        diet: 'Carnivore',
        lifespan: '10y',
        description: 'Text',
      },
      'malayan-tiger',
    )
    expect(a.animalPhotoUrl).toBe('https://d111111abcdef8.cloudfront.net/p.jpg')
    expect(a.imageAttribution?.isFallback).toBe(true)
    expect(a.imageAttribution?.sourceName).toBe('BioWira image asset')
  })
})
