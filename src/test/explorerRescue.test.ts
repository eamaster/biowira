import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent } from 'vue'
import { repositories } from '@/repositories'
import {
  getExplorerRescueSpritePath,
  resolveExplorerRescueSprite,
  rescueExplorerFacingPositiveTowardWorldX,
  resolveRescueExplorerPlayerIconResolution,
} from '@/features/explorer-rescue-run/utils/explorerRescueSprites'
import { loadProgress, saveProgress, isFirstCompletion } from '@/features/explorer-rescue-run/utils/explorerRescueStorage'
import { DEFAULT_EXPLORER_RESCUE_PROGRESS } from '@/features/explorer-rescue-run/game/types'
import { STORAGE_KEYS, ROUTE_NAMES } from '@/app/config'
import { EXPLORER_RESCUE_ASSETS } from '@/app/branding'
import {
  RESCUE_CLUE_REGISTRY,
  getClueById,
  resolveClueVisualByDisplayLabel,
  resolveClueVisualByTraitId,
} from '@/features/explorer-rescue-run/data/explorerRescueClues'
import { getDiscoverStatIcon } from '@/app/discoverStatIconRegistry'
import { AnimalCategory, HabitatZone, ConservationStatus } from '@/domain/enums'
import { LEAF_POINTS_GAMEPLAY_ICON_KEY } from '@/domain/pointsCurrency'
import { getGameplayIconUrl } from '@/app/iconRegistry'
import RescueInfoChips from '@/features/explorer-rescue-run/components/RescueInfoChips.vue'
import RescueProgressPanel from '@/features/explorer-rescue-run/components/RescueProgressPanel.vue'
import ExplorerRescueStagePreview from '@/features/explorer-rescue-run/components/ExplorerRescueStagePreview.vue'
import ExplorerRescueStepCard from '@/features/explorer-rescue-run/components/ExplorerRescueStepCard.vue'
import RescueTraitBadge from '@/features/explorer-rescue-run/components/RescueTraitBadge.vue'
import ExplorerRescueResultPage from '@/features/explorer-rescue-run/ExplorerRescueResultPage.vue'
import { useSessionStore } from '@/stores/sessionStore'
import { useProgressStore } from '@/stores/progressStore'
import type { ChildProfile } from '@/domain/session'
import RescueChoiceTraitList from '@/features/explorer-rescue-run/components/RescueChoiceTraitList.vue'
import { clueIdsToTraits } from '@/features/explorer-rescue-run/data/explorerRescueClues'
import { computeExplorerRescueWorldMetrics } from '@/features/explorer-rescue-run/game/explorerRescueLevelLayout'
import {
  computeBackgroundTileLayout,
  computeExplorerRescueVisualScale,
} from '@/features/explorer-rescue-run/game/explorerRescueVisualScale'
import { buildRescueTraitsFromAnimal, sharedTraitIds, traitScore, isFullWildMatch, evaluateWildMatchChoice } from '@/features/explorer-rescue-run/data/rescueTraitResolver'
import { loadExplorerRescueRound, clearExplorerRescueAnimalCache } from '@/features/explorer-rescue-run/data/explorerRescueRoundBuilder'
import { DEFAULT_RESCUE_REWARDS } from '@/features/explorer-rescue-run/data/explorerRescueRewards'
import type { Animal } from '@/domain/animal'
import ExplorerRescueChapterPage from '@/features/explorer-rescue-run/ExplorerRescueChapterPage.vue'
import {
  DEFAULT_EXPLORER_RESCUE_RUN_ID,
  EXPLORER_RESCUE_RUN_CATALOG,
  findExplorerRescueRunByAnimalId,
  findExplorerRescueRunById,
  getExplorerRescueJournalStampIdForAnimalId,
  resolveExplorerRescueRunFromRouteQuery,
} from '@/features/explorer-rescue-run/data/explorerRescueRunCatalog'
// ── Mock storageService ───────────────────────────────────────────────────────
vi.mock('@/services/storageService', () => ({
  storageService: {
    get: vi.fn((key: string) => {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (!parsed || parsed.v !== 1) return null
        return parsed.data
      } catch {
        return null
      }
    }),
    set: vi.fn((key: string, value: unknown) => {
      localStorage.setItem(key, JSON.stringify({ v: 1, data: value }))
    }),
    remove: vi.fn((key: string) => localStorage.removeItem(key)),
    clearKeys: vi.fn(),
  },
}))

// ── Realistic API-style animal fixtures ───────────────────────────────────────
function makeAnimal(overrides: Partial<Animal>): Animal {
  return {
    id: 'mock-id',
    commonName: 'Mock Animal',
    scientificName: 'Mock scientificus',
    category: AnimalCategory.Mammals,
    habitat: HabitatZone.Rainforest,
    habitats: ['Forest'],
    habitatDisplay: 'Forest',
    diet: 'Carnivore',
    lifespan: '10-15 yrs',
    conservationStatus: ConservationStatus.Endangered,
    conservationExplanation: 'Test explanation',
    description: 'Test description',
    funFact: 'Test fact',
    iconEmoji: '🐾',
    mapPosition: { desktop: { x: 0, y: 0 } },
    occurrences: [],
    visualKey: 'mock-id',
    ...overrides,
  }
}

const MALAYAN_TIGER: Animal = makeAnimal({
  id: 'malayan-tiger',
  commonName: 'Malayan Tiger',
  scientificName: 'Panthera tigris jacksoni',
  category: AnimalCategory.Mammals,
  habitats: ['Forest'],
  habitatDisplay: 'Forest',
  diet: 'Carnivore',
  iconEmoji: '🐯',
  visualKey: 'malayan-tiger',
})

const SUN_BEAR: Animal = makeAnimal({
  id: 'sun-bear',
  commonName: 'Sun Bear',
  scientificName: 'Helarctos malayanus',
  category: AnimalCategory.Mammals,
  habitats: ['Forest'],
  habitatDisplay: 'Forest',
  diet: 'Omnivore',
  iconEmoji: '🐻',
  visualKey: 'sun-bear',
})

const BORNEAN_ORANGUTAN: Animal = makeAnimal({
  id: 'bornean-orangutan',
  commonName: 'Bornean Orangutan',
  scientificName: 'Pongo pygmaeus',
  category: AnimalCategory.Mammals,
  habitats: ['Forest'],
  habitatDisplay: 'Forest',
  diet: 'Herbivore',
  iconEmoji: '🦧',
  visualKey: 'orangutan',
})

const SALTWATER_CROCODILE: Animal = makeAnimal({
  id: 'saltwater-crocodile',
  commonName: 'Saltwater Crocodile',
  scientificName: 'Crocodylus porosus',
  category: AnimalCategory.Reptiles,
  habitats: ['River'],
  habitatDisplay: 'River',
  diet: 'Carnivore',
  iconEmoji: '🐊',
  visualKey: 'saltwater-crocodile',
})

const RHINOCEROS_HORNBILL: Animal = makeAnimal({
  id: 'rhinoceros-hornbill',
  commonName: 'Rhinoceros Hornbill',
  scientificName: 'Buceros rhinoceros',
  category: AnimalCategory.Birds,
  habitats: ['Forest'],
  habitatDisplay: 'Forest',
  diet: 'Omnivore',
  iconEmoji: '🦅',
  visualKey: 'rhinoceros-hornbill',
})

const WHALE_SHARK: Animal = makeAnimal({
  id: 'whale-shark',
  commonName: 'Whale Shark',
  scientificName: 'Rhincodon typus',
  category: AnimalCategory.MarineFreshwater,
  habitats: ['Ocean'],
  habitatDisplay: 'Ocean',
  diet: 'Omnivore',
  iconEmoji: '🐠',
  visualKey: 'whale-shark',
})

// ── Amphibian fixtures for Larut Torrent Frog rescue run ──────────────────────
const LARUT_TORRENT_FROG: Animal = makeAnimal({
  id: 'larut-torrent-frog',
  commonName: 'Larut Torrent Frog',
  scientificName: 'Limnonectes larutensis',
  category: AnimalCategory.Amphibians,
  habitats: ['Forest'],
  habitatDisplay: 'Forest',
  diet: 'Insectivore',
  iconEmoji: '🐸',
  visualKey: 'larut-torrent-frog',
})

const ASIAN_COMMON_TOAD: Animal = makeAnimal({
  id: 'asian-common-toad',
  commonName: 'Asian Common Toad',
  scientificName: 'Duttaphrynus melanostictus',
  category: AnimalCategory.Amphibians,
  habitats: ['Forest'],
  habitatDisplay: 'Forest',
  diet: 'Insectivore',
  iconEmoji: '🐸',
  visualKey: 'asian-common-toad',
})

// Wrong-choice animal 1: same habitat but different diet and group
const WALLACES_FLYING_FROG: Animal = makeAnimal({
  id: 'wallaces-flying-frog',
  commonName: "Wallace's Flying Frog",
  scientificName: 'Rhacophorus nigropalmatus',
  category: AnimalCategory.Amphibians,
  habitats: ['Forest'],
  habitatDisplay: 'Forest',
  diet: 'Carnivore',
  iconEmoji: '🐸',
  visualKey: 'wallaces-flying-frog',
})

// Second exact Wild Match for Larut Torrent Frog — used to guard against
// full-match animals appearing as wrong choices.
const MALAYAN_HORNED_FROG: Animal = makeAnimal({
  id: 'malayan-horned-frog',
  commonName: 'Malayan Horned Frog',
  scientificName: 'Megophrys nasuta',
  category: AnimalCategory.Amphibians,
  habitats: ['Forest'],
  habitatDisplay: 'Forest',
  diet: 'Insectivore',
  iconEmoji: '🐸',
  visualKey: 'malayan-horned-frog',
})

const API_POOL = [MALAYAN_TIGER, SUN_BEAR, BORNEAN_ORANGUTAN, SALTWATER_CROCODILE, RHINOCEROS_HORNBILL, WHALE_SHARK]

// Pool that includes the Larut Torrent Frog rescue run animals
const API_POOL_WITH_FROGS = [
  LARUT_TORRENT_FROG,
  ASIAN_COMMON_TOAD,
  WALLACES_FLYING_FROG,
  SALTWATER_CROCODILE,
  RHINOCEROS_HORNBILL,
  WHALE_SHARK,
]

function setupRepositoryMocks(animals: Animal[] = API_POOL) {
  vi.spyOn(repositories.animals, 'getAll').mockResolvedValue(
    animals.map((a) => ({
      listKey: a.id,
      backendId: a.id,
      commonName: a.commonName,
      scientificName: a.scientificName,
      category: a.category,
      conservationStatus: a.conservationStatus,
      iconEmoji: a.iconEmoji,
      imageUrl: a.imageUrl,
      avatarPath: a.avatarPath,
      visualKey: a.visualKey,
    })),
  )
  vi.spyOn(repositories.animals, 'getById').mockImplementation(async (id) => {
    return animals.find((a) => a.id === id) ?? null
  })
}

// ── Explorer Rescue Run catalog (route-selection source of truth) ─────────────
describe('explorerRescueRunCatalog', () => {
  it('DEFAULT_EXPLORER_RESCUE_RUN_ID is larut-torrent-frog', () => {
    expect(DEFAULT_EXPLORER_RESCUE_RUN_ID).toBe('larut-torrent-frog')
  })

  it('catalog lists exactly two demo rescue runs: larut-torrent-frog and sun-bear', () => {
    expect(EXPLORER_RESCUE_RUN_CATALOG.map((r) => r.id)).toEqual([
      'larut-torrent-frog',
      'sun-bear',
    ])
  })

  it('Malayan Tiger is not the default rescue run', () => {
    expect(DEFAULT_EXPLORER_RESCUE_RUN_ID).not.toBe('malayan-tiger')
    expect(EXPLORER_RESCUE_RUN_CATALOG.map((r) => r.id)).not.toContain('malayan-tiger')
  })

  it('catalog contains Larut Torrent Frog as first entry', () => {
    expect(EXPLORER_RESCUE_RUN_CATALOG[0]?.id).toBe('larut-torrent-frog')
    expect(EXPLORER_RESCUE_RUN_CATALOG[0]?.animalName).toBe('Larut Torrent Frog')
  })

  it('findExplorerRescueRunById resolves Larut Torrent Frog and Sun Bear entries', () => {
    expect(findExplorerRescueRunById('larut-torrent-frog')?.animalName).toBe('Larut Torrent Frog')
    expect(findExplorerRescueRunById('sun-bear')?.animalName).toBe('Sun Bear')
  })

  it('findExplorerRescueRunById returns undefined for malayan-tiger (removed from catalog)', () => {
    expect(findExplorerRescueRunById('malayan-tiger')).toBeUndefined()
  })

  it('findExplorerRescueRunById returns undefined for bogus ids', () => {
    expect(findExplorerRescueRunById('not-a-real-run')).toBeUndefined()
  })

  it('resolver falls back only through resolveExplorerRescueRunFromRouteQuery', () => {
    expect(resolveExplorerRescueRunFromRouteQuery(undefined).id).toBe(DEFAULT_EXPLORER_RESCUE_RUN_ID)
    expect(resolveExplorerRescueRunFromRouteQuery('garbage-slug').id).toBe(DEFAULT_EXPLORER_RESCUE_RUN_ID)
    expect(resolveExplorerRescueRunFromRouteQuery('malayan-tiger').id).toBe(DEFAULT_EXPLORER_RESCUE_RUN_ID)
    expect(resolveExplorerRescueRunFromRouteQuery('sun-bear').id).toBe('sun-bear')
    expect(resolveExplorerRescueRunFromRouteQuery('larut-torrent-frog').id).toBe('larut-torrent-frog')
  })

  it('journal stamp ids differ per rescue animal (menu 2/2 denominator)', () => {
    expect(getExplorerRescueJournalStampIdForAnimalId('larut-torrent-frog')).toBe('wild-match-finder')
    expect(getExplorerRescueJournalStampIdForAnimalId('sun-bear')).toBe('wild-match-sun-bear')
  })

  it('animal id lookup maps larut-torrent-frog and sun-bear deterministically', () => {
    expect(findExplorerRescueRunByAnimalId('larut-torrent-frog')!.id).toBe('larut-torrent-frog')
    expect(findExplorerRescueRunByAnimalId('sun-bear')!.id).toBe('sun-bear')
    expect(findExplorerRescueRunByAnimalId('malayan-tiger')).toBeUndefined()
  })
})

// ── buildRescueTraitsFromAnimal ───────────────────────────────────────────────
describe('buildRescueTraitsFromAnimal', () => {
  it('Sun Bear returns Forest, Omnivore, Mammals (not Carnivore)', () => {
    const traits = buildRescueTraitsFromAnimal(SUN_BEAR)
    const labels = traits.map((t) => t.label)
    expect(labels).toEqual(['Forest', 'Omnivore', 'Mammals'])
  })

  it('Malayan Tiger returns Forest, Carnivore, Mammals', () => {
    const traits = buildRescueTraitsFromAnimal(MALAYAN_TIGER)
    const labels = traits.map((t) => t.label)
    expect(labels).toEqual(['Forest', 'Carnivore', 'Mammals'])
  })

  it('Saltwater Crocodile returns River, Carnivore, Reptiles', () => {
    const traits = buildRescueTraitsFromAnimal(SALTWATER_CROCODILE)
    const labels = traits.map((t) => t.label)
    expect(labels).toEqual(['River', 'Carnivore', 'Reptiles'])
  })

  it('Saltwater Crocodile group trait is group_reptiles with reptiles clue WebP', () => {
    const traits = buildRescueTraitsFromAnimal(SALTWATER_CROCODILE)
    const group = traits[2]!
    expect(group.id).toBe('group_reptiles')
    expect(group.iconPath).toMatch(/group-reptiles-clue\.webp/)
  })

  it('Saltwater Crocodile River habitat keeps label River without ocean icon', () => {
    const traits = buildRescueTraitsFromAnimal(SALTWATER_CROCODILE)
    const habitat = traits[0]!
    expect(habitat.label).toBe('River')
    expect(habitat.id).toBe('habitat_river')
    expect(habitat.iconPath).toBeUndefined()
  })

  it('insectivore diet maps to diet_insectivore with WebP, not carnivore', () => {
    const a = makeAnimal({
      id: 'insect-bat',
      diet: 'Insectivore',
      category: AnimalCategory.Mammals,
    })
    const traits = buildRescueTraitsFromAnimal(a)
    const diet = traits[1]!
    expect(diet.id).toBe('diet_insectivore')
    expect(diet.id).not.toBe('diet_carnivore')
    expect(diet.iconPath).toMatch(/diet-insectivore-clue\.webp/)
  })

  it('insectivorous diet keyword maps to diet_insectivore', () => {
    const a = makeAnimal({
      id: 'x',
      diet: 'Mostly insectivorous',
      category: AnimalCategory.Birds,
    })
    expect(buildRescueTraitsFromAnimal(a)[1]!.id).toBe('diet_insectivore')
  })

  it('qualified herbivore diets map to diet_herbivore with herbivore clue WebP', () => {
    const nectar = makeAnimal({ id: 'n', diet: 'Herbivore (nectar)', category: AnimalCategory.Birds })
    const leaves = makeAnimal({
      id: 'l',
      diet: 'Herbivore (leaves and fruits)',
      category: AnimalCategory.Mammals,
    })
    for (const animal of [nectar, leaves]) {
      const diet = buildRescueTraitsFromAnimal(animal)[1]!
      expect(diet.id).toBe('diet_herbivore')
      expect(diet.iconPath).toMatch(/diet-herbivore-clue\.webp/)
    }
    const nect = makeAnimal({ id: 'nv', diet: 'Nectarivore', category: AnimalCategory.Birds })
    expect(buildRescueTraitsFromAnimal(nect)[1]!.id).toBe('diet_herbivore')
  })

  it('habitat "Wetlands, Ocean" resolves to habitat_wetlands with wetlands clue WebP (wetland tokens precede marine)', () => {
    const a = makeAnimal({
      id: 'wet-ocean',
      habitatDisplay: 'Wetlands, Ocean',
      habitats: ['Wetlands', 'Ocean'],
      category: AnimalCategory.MarineFreshwater,
      diet: 'Omnivore',
    })
    const traits = buildRescueTraitsFromAnimal(a)
    expect(traits[0]!.id).toBe('habitat_wetlands')
    expect(traits[0]!.label).toBe('Wetlands, Ocean')
    expect(traits[0]!.iconPath).toMatch(/habitat-wetlands-clue\.webp/)
  })

  it('habitat display "Wetlands" alone resolves to wetlands clue WebP', () => {
    const a = makeAnimal({
      id: 'wet-only',
      habitatDisplay: 'Wetlands',
      habitats: ['Wetlands'],
      category: AnimalCategory.Reptiles,
      diet: 'Carnivore',
    })
    const traits = buildRescueTraitsFromAnimal(a)
    expect(traits[0]!.id).toBe('habitat_wetlands')
    expect(traits[0]!.iconPath).toMatch(/habitat-wetlands-clue\.webp/)
  })

  it('Amphibian animal returns group_amphibians with iconPath', () => {
    const frog = makeAnimal({
      id: 'asian-painted-frog',
      commonName: 'Asian Painted Frog',
      category: AnimalCategory.Amphibians,
      habitats: ['Forest'],
      habitatDisplay: 'Forest',
      diet: 'Insectivore',
    })
    const traits = buildRescueTraitsFromAnimal(frog)
    expect(traits[2]!.id).toBe('group_amphibians')
    expect(traits[2]!.iconPath).toMatch(/group-amphibians-clue\.webp/)
  })

  it('Insect animal returns group_insects with iconPath', () => {
    const butterfly = makeAnimal({
      id: 'monarch',
      commonName: 'Monarch',
      category: AnimalCategory.Insects,
      habitats: ['Forest'],
      habitatDisplay: 'Forest',
      diet: 'Herbivore',
    })
    const traits = buildRescueTraitsFromAnimal(butterfly)
    expect(traits[2]!.id).toBe('group_insects')
    expect(traits[2]!.iconPath).toMatch(/group-insects-clue\.webp/)
  })

  it('Rhinoceros Hornbill returns Forest, Omnivore, Birds', () => {
    const traits = buildRescueTraitsFromAnimal(RHINOCEROS_HORNBILL)
    const labels = traits.map((t) => t.label)
    expect(labels).toEqual(['Forest', 'Omnivore', 'Birds'])
  })

  it('Whale Shark returns Ocean, Omnivore, Marine & Freshwater', () => {
    const traits = buildRescueTraitsFromAnimal(WHALE_SHARK)
    const labels = traits.map((t) => t.label)
    expect(labels).toEqual(['Ocean', 'Omnivore', 'Marine & Freshwater'])
  })

  it('always returns exactly 3 traits', () => {
    for (const animal of API_POOL) {
      const traits = buildRescueTraitsFromAnimal(animal)
      expect(traits).toHaveLength(3)
    }
  })

  it('each trait has id, label, emoji', () => {
    const traits = buildRescueTraitsFromAnimal(SUN_BEAR)
    for (const t of traits) {
      expect(t.id).toBeTruthy()
      expect(t.label).toBeTruthy()
      expect(t.emoji).toBeTruthy()
    }
  })

  it('Sun Bear habitat trait id is habitat_forest', () => {
    const traits = buildRescueTraitsFromAnimal(SUN_BEAR)
    expect(traits[0]!.id).toBe('habitat_forest')
  })

  it('Sun Bear diet trait id is diet_omnivore (not diet_carnivore)', () => {
    const traits = buildRescueTraitsFromAnimal(SUN_BEAR)
    expect(traits[1]!.id).toBe('diet_omnivore')
    expect(traits[1]!.id).not.toBe('diet_carnivore')
    expect(traits[1]!.iconPath).toMatch(/diet-omnivore-clue\.webp/)
  })

  it('Sun Bear group trait id is group_mammal', () => {
    const traits = buildRescueTraitsFromAnimal(SUN_BEAR)
    expect(traits[2]!.id).toBe('group_mammal')
  })

  it('uses iconPath from clue registry when ID is known', () => {
    const traits = buildRescueTraitsFromAnimal(MALAYAN_TIGER)
    const habitatTrait = traits.find((t) => t.id === 'habitat_forest')
    expect(habitatTrait?.iconPath).toBeTruthy()
  })

  it('compound API omnivore text maps to diet_omnivore and uses omnivore clue WebP', () => {
    const bear = makeAnimal({
      id: 'sun-bear-api',
      commonName: 'Sun Bear',
      diet: 'Omnivore (fruits + insects)',
    })
    const traits = buildRescueTraitsFromAnimal(bear)
    const diet = traits[1]!
    expect(diet.id).toBe('diet_omnivore')
    expect(diet.label).toBe('Omnivore (fruits + insects)')
    expect(diet.iconPath).toMatch(/diet-omnivore-clue\.webp/)
  })

  it('herbivore diet uses herbivore clue WebP', () => {
    const elephant = makeAnimal({
      id: 'test-herb',
      diet: 'Herbivore',
      category: AnimalCategory.Mammals,
    })
    const traits = buildRescueTraitsFromAnimal(elephant)
    const diet = traits[1]!
    expect(diet.id).toBe('diet_herbivore')
    expect(diet.iconPath).toMatch(/diet-herbivore-clue\.webp/)
  })

  it('unknown habitat/diet values keep correct label; known group uses registry icon', () => {
    const reptile = makeAnimal({
      id: 'test-reptile',
      category: AnimalCategory.Reptiles,
      habitats: ['Mountain'],
      habitatDisplay: 'Mountain',
      diet: 'Nectarivore specialist',
    })
    const traits = buildRescueTraitsFromAnimal(reptile)
    expect(traits[0]!.label).toBe('Mountain')
    expect(traits[1]!.label).toBe('Nectarivore specialist')
    expect(traits[2]!.label).toBe('Reptiles')
    expect(traits[2]!.id).toBe('group_reptiles')
    expect(traits[2]!.iconPath).toMatch(/group-reptiles-clue\.webp/)
    for (const t of traits) {
      expect(t.emoji).toBeTruthy()
    }
  })

  it('falls back to HabitatZone enum when habitats array is absent', () => {
    const animalNoHabitats = makeAnimal({
      id: 'no-habitats',
      habitats: undefined,
      habitatDisplay: undefined,
      habitat: HabitatZone.River,
    })
    const traits = buildRescueTraitsFromAnimal(animalNoHabitats)
    expect(traits[0]!.label).toBe('River')
    expect(traits[0]!.id).toBe('habitat_river')
  })
})

// ── sharedTraitIds and traitScore helpers ─────────────────────────────────────
describe('sharedTraitIds / traitScore', () => {
  it('Tiger and Sun Bear share habitat_forest and group_mammal (different diet)', () => {
    const tigerTraits = buildRescueTraitsFromAnimal(MALAYAN_TIGER)
    const sunBearTraits = buildRescueTraitsFromAnimal(SUN_BEAR)
    const shared = sharedTraitIds(tigerTraits, sunBearTraits)
    expect(shared).toContain('habitat_forest')
    expect(shared).toContain('group_mammal')
    expect(shared).not.toContain('diet_carnivore')
    expect(shared).not.toContain('diet_omnivore')
  })

  it('traitScore Tiger vs Crocodile is 1 (only diet_carnivore shared)', () => {
    const tigerTraits = buildRescueTraitsFromAnimal(MALAYAN_TIGER)
    const crocTraits = buildRescueTraitsFromAnimal(SALTWATER_CROCODILE)
    expect(traitScore(tigerTraits, crocTraits)).toBe(1)
  })

  it('traitScore Sun Bear vs Hornbill is 2 (Forest + Omnivore shared, different group)', () => {
    const sunBearTraits = buildRescueTraitsFromAnimal(SUN_BEAR)
    const hornbillTraits = buildRescueTraitsFromAnimal(RHINOCEROS_HORNBILL)
    // Sun Bear: Forest/Omnivore/Mammals — Hornbill: Forest/Omnivore/Birds
    // Shared: habitat_forest + diet_omnivore = 2
    expect(traitScore(sunBearTraits, hornbillTraits)).toBe(2)
  })
})

describe('isFullWildMatch', () => {
  it('returns true when all 3 explorer traits are shared', () => {
    const explorerTraits = buildRescueTraitsFromAnimal(LARUT_TORRENT_FROG)
    const toadTraits = buildRescueTraitsFromAnimal(ASIAN_COMMON_TOAD)
    expect(isFullWildMatch(explorerTraits, sharedTraitIds(explorerTraits, toadTraits))).toBe(true)
  })

  it('returns false for partial matches', () => {
    const explorerTraits = buildRescueTraitsFromAnimal(LARUT_TORRENT_FROG)
    const partialTraits = buildRescueTraitsFromAnimal(WALLACES_FLYING_FROG)
    expect(isFullWildMatch(explorerTraits, sharedTraitIds(explorerTraits, partialTraits))).toBe(false)
  })
})

describe('evaluateWildMatchChoice', () => {
  it('matches using the card full choiceTraits, not a single clue row', () => {
    const explorerTraits = buildRescueTraitsFromAnimal(LARUT_TORRENT_FROG)
    const toadTraits = buildRescueTraitsFromAnimal(ASIAN_COMMON_TOAD)
    const partialTraits = buildRescueTraitsFromAnimal(WALLACES_FLYING_FROG)

    const fullMatch = evaluateWildMatchChoice(explorerTraits, { choiceTraits: toadTraits })
    expect(fullMatch.isMatch).toBe(true)
    expect(fullMatch.sharedTraits).toHaveLength(3)

    const partialOnly = evaluateWildMatchChoice(explorerTraits, { choiceTraits: partialTraits })
    expect(partialOnly.isMatch).toBe(false)
    expect(partialOnly.sharedTraits.length).toBeLessThan(3)
  })

  it('derives shared traits from choiceTraits at pick time', () => {
    const explorerTraits = buildRescueTraitsFromAnimal(LARUT_TORRENT_FROG)
    const toadTraits = buildRescueTraitsFromAnimal(ASIAN_COMMON_TOAD)

    const result = evaluateWildMatchChoice(explorerTraits, {
      choiceTraits: toadTraits,
    })
    expect(result.isMatch).toBe(true)
    expect(result.sharedTraits.map((t) => t.id)).toEqual(
      sharedTraitIds(explorerTraits, toadTraits),
    )
  })
})

// ── loadExplorerRescueRound — API-backed round builder ────────────────────────
describe('loadExplorerRescueRound — API-backed', () => {
  beforeEach(() => {
    clearExplorerRescueAnimalCache()
    vi.clearAllMocks()
    setupRepositoryMocks(API_POOL_WITH_FROGS)
  })

  it('builds a round for Larut Torrent Frog with 3 clueTraits', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    expect(round.clueTraits).toHaveLength(3)
  })

  it('builds a round with exactly 3 choices', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    expect(round.choices).toHaveLength(3)
  })

  it('every choice has exactly 3 choiceTraits', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    for (const choice of round.choices) {
      expect(choice.choiceTraits).toHaveLength(3)
    }
  })

  it('exactly 1 correct choice per round', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    const correct = round.choices.filter((c) => c.isCorrect)
    expect(correct).toHaveLength(1)
  })

  it('no duplicate choice names', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    const names = round.choices.map((c) => c.name)
    const unique = new Set(names)
    expect(unique.size).toBe(3)
  })

  it('explorer is not included in choices', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    const choiceNames = round.choices.map((c) => c.name)
    expect(choiceNames).not.toContain('Larut Torrent Frog')
  })

  it('Larut Torrent Frog clueTraits labels are Forest, Insectivore, Amphibians', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    const labels = round.clueTraits.map((t) => t.label)
    expect(labels).toEqual(['Forest', 'Insectivore', 'Amphibians'])
  })

  it('Larut Torrent Frog explorer trait IDs are habitat_forest, diet_insectivore, group_amphibians', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    const ids = round.clueTraits.map((t) => t.id)
    expect(ids).toEqual(['habitat_forest', 'diet_insectivore', 'group_amphibians'])
  })

  it('correct choice is Asian Common Toad (exact 3-trait match)', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    const correct = round.choices.find((c) => c.isCorrect)!
    expect(correct.name).toBe('Asian Common Toad')
    expect(correct.sharedTraitIds).toHaveLength(3)
    expect(correct.sharedTraitIds).toContain('habitat_forest')
    expect(correct.sharedTraitIds).toContain('diet_insectivore')
    expect(correct.sharedTraitIds).toContain('group_amphibians')
  })

  it('correct choice has sharedTraitIds.length === 3 (exact full match)', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    const correct = round.choices.find((c) => c.isCorrect)!
    expect(correct.sharedTraitIds.length).toBe(3)
  })

  it('every wrong choice has fewer than 3 shared traits', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    const wrong = round.choices.filter((c) => !c.isCorrect)
    for (const wc of wrong) {
      expect(wc.sharedTraitIds.length).toBeLessThan(3)
    }
  })

  it('never puts a second full-match animal in the wrong choice pool', async () => {
    clearExplorerRescueAnimalCache()
    setupRepositoryMocks([
      ...API_POOL_WITH_FROGS,
      MALAYAN_HORNED_FROG,
    ])
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    const wrong = round.choices.filter((c) => !c.isCorrect)
    for (const wc of wrong) {
      expect(wc.sharedTraitIds.length).toBeLessThan(3)
    }
    const fullMatchesInChoices = round.choices.filter((c) => c.sharedTraitIds.length === 3)
    expect(fullMatchesInChoices.length).toBeGreaterThanOrEqual(1)
    expect(fullMatchesInChoices.some((c) => c.isCorrect)).toBe(true)
  })

  it('correct choice has more shared traits than wrong choices', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    const correct = round.choices.find((c) => c.isCorrect)!
    const wrong = round.choices.filter((c) => !c.isCorrect)
    for (const wc of wrong) {
      expect(wc.sharedTraitIds.length).toBeLessThanOrEqual(correct.sharedTraitIds.length)
    }
  })

  it('matchInstruction is the exact-match wording (not "best matching")', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    expect(round.matchInstruction).toBe('Pick the animal with the same habitat, diet, and group.')
    expect(round.matchInstruction).not.toMatch(/best matching/)
  })

  it('choice order is deterministic for the same explorerAnimalId', async () => {
    const round1 = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    const round2 = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    expect(round1.choices.map((c) => c.name)).toEqual(round2.choices.map((c) => c.name))
  })

  it('Asian Common Toad shows Insectivore diet (not Carnivore) in choice traits', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    const toadChoice = round.choices.find((c) => c.name === 'Asian Common Toad')
    if (toadChoice) {
      const dietTrait = toadChoice.choiceTraits.find((t) => t.id.startsWith('diet_'))
      expect(dietTrait?.label).toBe('Insectivore')
      expect(dietTrait?.label).not.toBe('Carnivore')
    }
  })

  it('uses API-backed explorerAnimalId (not static string)', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    expect(round.explorerAnimalId).toBe('larut-torrent-frog')
    expect(round.explorerName).toBe('Larut Torrent Frog')
  })

  it('round includes matchInstruction', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    expect(round.matchInstruction).toBeTruthy()
  })

  it('round includes DEFAULT_RESCUE_REWARDS', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    expect(round.rewards.firstCompletionLeafPoints).toBe(DEFAULT_RESCUE_REWARDS.firstCompletionLeafPoints)
    expect(round.rewards.replayLeafPoints).toBe(DEFAULT_RESCUE_REWARDS.replayLeafPoints)
    expect(round.rewards.restorationIncrease).toBe(DEFAULT_RESCUE_REWARDS.restorationIncrease)
    expect(round.rewards.journalStamp).toBe(DEFAULT_RESCUE_REWARDS.journalStamp)
  })

  it('resolves explorer by visualKey when animalId is not found', async () => {
    const round = await loadExplorerRescueRound({
      explorerAnimalId: null,
      explorerVisualKey: 'larut-torrent-frog',
    })
    expect(round.explorerName).toBe('Larut Torrent Frog')
  })

  it('throws when explorer animal cannot be found in API pool', async () => {
    await expect(
      loadExplorerRescueRound({ explorerAnimalId: 'unknown-creature-xyz' }),
    ).rejects.toThrow(/could not find the selected rescue animal/)
  })

  it('throws when no exact Wild Match exists for the rescue animal', async () => {
    // Malayan Tiger (Forest/Carnivore/Mammals) has no exact 3-trait match in this pool
    clearExplorerRescueAnimalCache()
    setupRepositoryMocks(API_POOL)
    await expect(
      loadExplorerRescueRound({ explorerAnimalId: 'malayan-tiger' }),
    ).rejects.toThrow(/no exact Wild Match found/)
  })

  it('no legacy mock-only animal names appear in choices (Tapir, Mousedeer, Dugong, etc.)', async () => {
    const round = await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    const choiceNames = round.choices.map((c) => c.name)
    const legacyNames = ['Tapir', 'Mousedeer', 'Dugong', 'Green Sea Turtle', 'Hawksbill Sea Turtle']
    for (const name of legacyNames) {
      expect(choiceNames).not.toContain(name)
    }
  })

  it('throws when pool has fewer than 4 valid animals', async () => {
    clearExplorerRescueAnimalCache()
    setupRepositoryMocks([LARUT_TORRENT_FROG, ASIAN_COMMON_TOAD, WALLACES_FLYING_FROG])
    await expect(
      loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' }),
    ).rejects.toThrow(/at least 4 valid API animals/)
  })

  it('forceRefresh re-fetches the pool', async () => {
    clearExplorerRescueAnimalCache()
    const getAllSpy = vi.spyOn(repositories.animals, 'getAll').mockResolvedValue(
      API_POOL_WITH_FROGS.map((a) => ({
        listKey: a.id,
        backendId: a.id,
        commonName: a.commonName,
        scientificName: a.scientificName,
        category: a.category,
        conservationStatus: a.conservationStatus,
        iconEmoji: a.iconEmoji,
        visualKey: a.visualKey,
      })),
    )
    vi.spyOn(repositories.animals, 'getById').mockImplementation(async (id) => {
      return API_POOL_WITH_FROGS.find((a) => a.id === id) ?? null
    })

    await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' })
    expect(getAllSpy).toHaveBeenCalledTimes(1)

    await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog' }) // cached
    expect(getAllSpy).toHaveBeenCalledTimes(1)

    await loadExplorerRescueRound({ explorerAnimalId: 'larut-torrent-frog', forceRefresh: true })
    expect(getAllSpy).toHaveBeenCalledTimes(2)
  })
})

// ── DEFAULT_RESCUE_REWARDS ────────────────────────────────────────────────────
describe('DEFAULT_RESCUE_REWARDS', () => {
  it('firstCompletionLeafPoints is 50', () => {
    expect(DEFAULT_RESCUE_REWARDS.firstCompletionLeafPoints).toBe(50)
  })

  it('replayLeafPoints is 5', () => {
    expect(DEFAULT_RESCUE_REWARDS.replayLeafPoints).toBe(5)
  })

  it('restorationIncrease is 15', () => {
    expect(DEFAULT_RESCUE_REWARDS.restorationIncrease).toBe(15)
  })

  it('journalStamp is wild-match-finder', () => {
    expect(DEFAULT_RESCUE_REWARDS.journalStamp).toBe('wild-match-finder')
  })
})

// ── Level layout ──────────────────────────────────────────────────────────────
describe('explorerRescueLevelLayout', () => {
  it('anchors wild match gates shortly after trailing jump-log edge (not far world tail)', () => {
    const m = computeExplorerRescueWorldMetrics(1400)
    expect(m.gateStartX).toBe(2710)
    expect(m.choosePhaseTriggerX).toBe(2890)
    expect(m.choosePhaseTriggerX).toBeGreaterThan(m.gateStartX)
    expect(m.choosePhaseTriggerX).toBeLessThan(m.worldWidth - 120)
    expect(m.gateStartX).toBeLessThan(Math.floor(m.worldWidth * 0.85))
  })

  it('widened gate footprint expands world width without breaking gate anchors', () => {
    const base = computeExplorerRescueWorldMetrics(1400)
    const wide = computeExplorerRescueWorldMetrics(1400, {
      gateHalfWidthApprox: 140,
      gateSpacingPx: 320,
    })
    expect(wide.gateStartX).toBe(base.gateStartX)
    expect(wide.worldWidth).toBeGreaterThanOrEqual(base.worldWidth)
    expect(wide.choosePhaseTriggerX).toBeGreaterThan(wide.gateStartX)
  })
})

// ── explorerRescueVisualScale ────────────────────────────────────────────────
describe('explorerRescueVisualScale', () => {
  it('desktop-like viewport increases clue, player, and choice icon sizes past legacy baselines', () => {
    const s = computeExplorerRescueVisualScale(1366, 520)
    expect(s.clueIconSize).toBeGreaterThan(40)
    expect(s.playerSpriteSize).toBeGreaterThan(48)
    expect(s.choiceAnimalIconSize).toBeGreaterThan(92)
    expect(s.resultAnimalIconCss).toMatch(/clamp\(|px/)
  })

  it('clamp keeps mobile sizes in safe ranges and never yields NaN', () => {
    const s = computeExplorerRescueVisualScale(390, 667)
    expect(s.clueIconSize).toBeGreaterThan(24)
    expect(s.clueIconSize).toBeLessThan(60)
    expect(Number.isFinite(s.playerSpriteSize)).toBe(true)
    expect(Number.isNaN(s.choiceTraitIconSize)).toBe(false)
    expect(s.choiceTraitIconSize).toBeGreaterThan(16)
  })

  it('computeBackgroundTileLayout preserves image aspect ratio when fitting height', () => {
    const srcW = 1983
    const srcH = 793
    const L = computeBackgroundTileLayout(srcW, srcH, 420, 3000)
    const srcRatio = srcW / srcH
    const dispRatio = L.displayWidth / L.displayHeight
    expect(dispRatio).toBeCloseTo(srcRatio, 2)
    expect(L.tileAdvanceX).toBeLessThanOrEqual(L.displayWidth)
    expect(L.tileAdvanceX).toBeGreaterThan(0)
  })
})
// ── Storage utils ─────────────────────────────────────────────────────────────
describe('explorerRescueStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('loadProgress returns default when no saved data', () => {
    const p = loadProgress('profile-1')
    expect(p.profileId).toBe('profile-1')
    expect(p.rainforestRestored).toBe(25)
    expect(p.completedExplorerIds).toEqual([])
    expect(p.journalStamps).toEqual([])
  })

  it('saveProgress uses STORAGE_KEYS.explorerRescueProgress', () => {
    const key = STORAGE_KEYS.explorerRescueProgress('profile-abc')
    expect(typeof key).toBe('string')
    expect(key).toBe('bw_explorer_rescue_profile-abc')
  })

  it('saveProgress and loadProgress round-trip correctly', () => {
    const progress = {
      profileId: 'p1',
      rainforestRestored: 40,
      completedExplorerIds: ['malayan-tiger'],
      journalStamps: ['wild-match-finder'],
      updatedAt: new Date().toISOString(),
    }
    saveProgress(progress)
    const loaded = loadProgress('p1')
    expect(loaded.rainforestRestored).toBe(40)
    expect(loaded.completedExplorerIds).toContain('malayan-tiger')
    expect(loaded.journalStamps).toContain('wild-match-finder')
  })

  it('isFirstCompletion returns true when not in completedExplorerIds', () => {
    expect(isFirstCompletion('p1', 'malayan-tiger')).toBe(true)
  })

  it('isFirstCompletion returns false after saving as completed', () => {
    saveProgress({
      profileId: 'p1',
      rainforestRestored: 40,
      completedExplorerIds: ['malayan-tiger'],
      journalStamps: [],
      updatedAt: new Date().toISOString(),
    })
    expect(isFirstCompletion('p1', 'malayan-tiger')).toBe(false)
  })
})

// ── Reward logic (authoritative via DEFAULT_RESCUE_REWARDS) ───────────────────
describe('reward logic', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('first completion gives firstCompletionLeafPoints (50)', () => {
    expect(DEFAULT_RESCUE_REWARDS.firstCompletionLeafPoints).toBe(50)
  })

  it('replay completion gives replayLeafPoints (5)', () => {
    expect(DEFAULT_RESCUE_REWARDS.replayLeafPoints).toBe(5)
  })

  it('first completion increases restoration by restorationIncrease (15)', () => {
    const before = 25
    const after = Math.min(100, before + DEFAULT_RESCUE_REWARDS.restorationIncrease)
    expect(after).toBe(40)
  })

  it('isFirstCompletion returns false after first completion is persisted', () => {
    saveProgress({
      profileId: 'p2',
      rainforestRestored: 40,
      completedExplorerIds: ['malayan-tiger'],
      journalStamps: ['wild-match-finder'],
      updatedAt: new Date().toISOString(),
    })
    expect(isFirstCompletion('p2', 'malayan-tiger')).toBe(false)
  })

  it('replay does not increase restoration — restorationAfter equals before', () => {
    saveProgress({
      profileId: 'p3',
      rainforestRestored: 40,
      completedExplorerIds: ['malayan-tiger'],
      journalStamps: [],
      updatedAt: new Date().toISOString(),
    })
    const isFirst = isFirstCompletion('p3', 'malayan-tiger')
    expect(isFirst).toBe(false)

    const current = loadProgress('p3')
    const restorationAfter = isFirst
      ? Math.min(100, current.rainforestRestored + DEFAULT_RESCUE_REWARDS.restorationIncrease)
      : current.rainforestRestored
    expect(restorationAfter).toBe(40)
  })

  it('authoritative record uses DEFAULT_RESCUE_REWARDS, not stale result.pointsEarned', () => {
    const profileId = 'p4'
    saveProgress({
      profileId,
      rainforestRestored: 40,
      completedExplorerIds: ['malayan-tiger'],
      journalStamps: ['wild-match-finder'],
      updatedAt: new Date().toISOString(),
    })
    const isFirstVal = isFirstCompletion(profileId, 'malayan-tiger')
    const authoritative = isFirstVal
      ? DEFAULT_RESCUE_REWARDS.firstCompletionLeafPoints
      : DEFAULT_RESCUE_REWARDS.replayLeafPoints
    expect(authoritative).toBe(5)
  })
})

// ── Clue icon registry ────────────────────────────────────────────────────────
describe('Rescue clue icon registry', () => {
  it('habitat_forest clue has a non-empty iconPath', () => {
    const clue = getClueById('habitat_forest')
    expect(clue.iconPath).toBeTruthy()
    expect(clue.iconPath).toMatch(/habitat-forest-clue\.webp/)
  })

  it('habitat_wetlands clue has a non-empty iconPath', () => {
    const clue = getClueById('habitat_wetlands')
    expect(clue.iconPath).toBeTruthy()
    expect(clue.iconPath).toMatch(/habitat-wetlands-clue\.webp/)
  })

  it('habitat_ocean clue has a non-empty iconPath', () => {
    const clue = getClueById('habitat_ocean')
    expect(clue.iconPath).toBeTruthy()
    expect(clue.iconPath).toMatch(/habitat-ocean-clue\.webp/)
  })

  it('diet_carnivore clue has a non-empty iconPath', () => {
    const clue = getClueById('diet_carnivore')
    expect(clue.iconPath).toBeTruthy()
    expect(clue.iconPath).toMatch(/diet-carnivore-clue\.webp/)
  })

  it('diet_herbivore clue has a non-empty iconPath', () => {
    const clue = getClueById('diet_herbivore')
    expect(clue.iconPath).toBeTruthy()
    expect(clue.iconPath).toMatch(/diet-herbivore-clue\.webp/)
  })

  it('diet_omnivore clue uses diet-omnivore-clue.webp', () => {
    const clue = getClueById('diet_omnivore')
    expect(clue.iconPath).toBeTruthy()
    expect(clue.iconPath).toMatch(/diet-omnivore-clue\.webp/)
  })

  it('group_reptiles exists with group-reptiles-clue.webp', () => {
    const clue = getClueById('group_reptiles')
    expect(clue.iconPath).toBe('/games/explorer-rescue/clues/group-reptiles-clue.webp')
  })

  it('group_amphibians exists with group-amphibians-clue.webp', () => {
    const clue = getClueById('group_amphibians')
    expect(clue.iconPath).toBe('/games/explorer-rescue/clues/group-amphibians-clue.webp')
  })

  it('group_insects exists with group-insects-clue.webp', () => {
    const clue = getClueById('group_insects')
    expect(clue.iconPath).toBe('/games/explorer-rescue/clues/group-insects-clue.webp')
  })

  it('diet_insectivore exists with diet-insectivore-clue.webp', () => {
    const clue = getClueById('diet_insectivore')
    expect(clue.iconPath).toBe('/games/explorer-rescue/clues/diet-insectivore-clue.webp')
  })

  it('group_mammal clue has a non-empty iconPath', () => {
    const clue = getClueById('group_mammal')
    expect(clue.iconPath).toBeTruthy()
    expect(clue.iconPath).toMatch(/group_mammal-clue\.webp/)
  })

  it('group_bird clue has a non-empty iconPath', () => {
    const clue = getClueById('group_bird')
    expect(clue.iconPath).toBeTruthy()
    expect(clue.iconPath).toMatch(/group-bird-clue\.webp/)
  })

  it('group_marine clue has a non-empty iconPath', () => {
    const clue = getClueById('group_marine')
    expect(clue.iconPath).toBeTruthy()
    expect(clue.iconPath).toMatch(/group-marine-clue\.webp/)
  })

  it('all registered clues have a label and fallbackEmoji', () => {
    for (const clue of Object.values(RESCUE_CLUE_REGISTRY)) {
      expect(clue.label).toBeTruthy()
      expect(clue.fallbackEmoji).toBeTruthy()
    }
  })

  it('resolveClueVisualByDisplayLabel maps qualified omnivore diet text to diet-omnivore WebP', () => {
    const visual = resolveClueVisualByDisplayLabel('Omnivore (fruits, insects, small animals)')
    expect(visual.iconPath).toMatch(/diet-omnivore-clue\.webp/)
    expect(visual.fallbackEmoji).toBe('🍎')
  })

  it('resolveClueVisualByTraitId resolves diet_omnivore', () => {
    const visual = resolveClueVisualByTraitId('diet_omnivore')
    expect(visual.iconPath).toMatch(/diet-omnivore-clue\.webp/)
    expect(visual.label).toBe('Omnivore')
  })
})

// ── RescueTraitBadge renders icon image ──────────────────────────────────────
describe('RescueTraitBadge', () => {
  it('renders an img when trait has an iconPath', () => {
    const trait = { id: 'habitat_forest', label: 'Forest', emoji: '🌳', iconPath: '/games/explorer-rescue/clues/habitat-forest-clue.webp' }
    const w = mount(RescueTraitBadge, { props: { trait } })
    expect(w.find('img.rescue-trait-badge__icon').exists()).toBe(true)
    expect(w.find('img.rescue-trait-badge__icon').attributes('src')).toMatch(/habitat-forest-clue\.webp/)
  })

  it('renders emoji span when trait has no iconPath', () => {
    const trait = { id: 'rainforest', label: 'Rainforest', emoji: '🌳' }
    const w = mount(RescueTraitBadge, { props: { trait } })
    expect(w.find('.rescue-trait-badge__emoji').exists()).toBe(true)
    expect(w.find('img.rescue-trait-badge__icon').exists()).toBe(false)
  })

  it('has aria-label matching the trait label', () => {
    const trait = { id: 'habitat_forest', label: 'Forest', emoji: '🌳', iconPath: '/some/path.webp' }
    const w = mount(RescueTraitBadge, { props: { trait } })
    expect(w.attributes('aria-label')).toBe('Forest')
  })
})

// ── Asset registry ────────────────────────────────────────────────────────────
describe('EXPLORER_RESCUE_ASSETS registry', () => {
  it('has all required landing asset keys', () => {
    const { landing } = EXPLORER_RESCUE_ASSETS
    expect(landing.explorerMascot).toBeTruthy()
    expect(landing.stagePreviewBackground).toBeTruthy()
    expect(landing.passportIcon).toBeTruthy()
    expect(landing.pawIcon).toBeTruthy()
    expect(landing.pawTrailIcon).toBeTruthy()
  })

  it('explorerMascot points to a file in the explorer-rescue folder', () => {
    expect(EXPLORER_RESCUE_ASSETS.landing.explorerMascot).toMatch(/\/games\/explorer-rescue\//)
  })

  it('stagePreviewBackground is registered', () => {
    expect(EXPLORER_RESCUE_ASSETS.landing.stagePreviewBackground).toMatch(/stage-preview-background/)
  })

  it('passportIcon, pawIcon, and pawTrailIcon are all registered', () => {
    expect(EXPLORER_RESCUE_ASSETS.landing.passportIcon).toMatch(/passport-icon/)
    expect(EXPLORER_RESCUE_ASSETS.landing.pawIcon).toMatch(/paw-icon/)
    expect(EXPLORER_RESCUE_ASSETS.landing.pawTrailIcon).toMatch(/paw-trail-icon/)
  })

  it('has all required gameplay asset keys', () => {
    const { gameplay } = EXPLORER_RESCUE_ASSETS
    expect(gameplay.background).toMatch(/game-background\.webp/)
    expect(gameplay.portalGate).toMatch(/portal-gate\.webp/)
    expect(gameplay.vineLogBanner).toMatch(/vine-log-banner\.webp/)
    expect(gameplay.tigerExplorerSprite).toMatch(/tiger-explorer-sprite\.webp/)
  })

  it('has all required clue asset paths in gameplay.clues', () => {
    const { clues } = EXPLORER_RESCUE_ASSETS.gameplay
    expect(clues.habitatForest).toMatch(/habitat-forest-clue\.webp/)
    expect(clues.habitatWetlands).toMatch(/habitat-wetlands-clue\.webp/)
    expect(clues.habitatOcean).toMatch(/habitat-ocean-clue\.webp/)
    expect(clues.dietCarnivore).toMatch(/diet-carnivore-clue\.webp/)
    expect(clues.dietHerbivore).toMatch(/diet-herbivore-clue\.webp/)
    expect(clues.dietOmnivore).toMatch(/diet-omnivore-clue\.webp/)
    expect(clues.dietInsectivore).toMatch(/diet-insectivore-clue\.webp/)
    expect(clues.groupMammal).toMatch(/group_mammal-clue\.webp/)
    expect(clues.groupBird).toMatch(/group-bird-clue\.webp/)
    expect(clues.groupMarine).toMatch(/group-marine-clue\.webp/)
    expect(clues.groupReptiles).toMatch(/group-reptiles-clue\.webp/)
    expect(clues.groupAmphibians).toMatch(/group-amphibians-clue\.webp/)
    expect(clues.groupInsects).toMatch(/group-insects-clue\.webp/)
  })
})

// ── Layout components (content + accessibility structure) ────────────────────
describe('RescueInfoChips', () => {
  it('renders Current Explorer, Rainforest Restored, and Leaf Points', () => {
    const w = mount(RescueInfoChips, {
      props: {
        explorerName: 'Nina',
        animalName: 'Malayan Tiger',
        rainforestRestored: 30,
        leafPoints: 42,
      },
    })
    expect(w.text()).toMatch(/current explorer/i)
    expect(w.text()).toMatch(/rainforest restored/i)
    expect(w.text()).toMatch(/leaf points/i)
    expect(w.text()).toMatch(/42/)
  })

  it('includes the explorer mascot image in the Current Explorer card', () => {
    const w = mount(RescueInfoChips, {
      props: {
        explorerName: 'Nina',
        animalName: 'Malayan Tiger',
        rainforestRestored: 30,
        leafPoints: 42,
      },
    })
    const explorerCard = w.find('[data-testid="explorer-rescue-current-explorer"]')
    expect(explorerCard.exists()).toBe(true)
    const img = explorerCard.find('img.rescue-info-chips__mascot')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toMatch(/explorer-mascot/)
  })

  it('has testids for each stat card', () => {
    const w = mount(RescueInfoChips, {
      props: { explorerName: 'Nina', rainforestRestored: 30, leafPoints: 42 },
    })
    expect(w.find('[data-testid="explorer-rescue-current-explorer"]').exists()).toBe(true)
    expect(w.find('[data-testid="explorer-rescue-restored"]').exists()).toBe(true)
    expect(w.find('[data-testid="explorer-rescue-leaf-points"]').exists()).toBe(true)
  })

  it('chapter neutral summary shows rescue-run headline instead of Current Explorer', () => {
    const w = mount(RescueInfoChips, {
      props: {
        neutralSummary: {
          headline: 'Animal Rescue Runs',
          subline: '1 of 2 rescue runs finished',
          mascotSrc: EXPLORER_RESCUE_ASSETS.landing.explorerMascot,
        },
        rainforestRestored: 30,
        leafPoints: 10,
      },
    })
    expect(w.text()).not.toMatch(/current explorer/i)
    expect(w.text()).toMatch(/animal rescue runs/i)
    expect(w.find('[data-testid="explorer-rescue-run-summary"]').exists()).toBe(true)
  })
})

describe('RescueProgressPanel', () => {
  it('renders Choose Rescue Run, Rescue Run, Wild Match, Journal Stamp', () => {
    const w = mount(RescueProgressPanel, {
      props: {
        currentStep: 'run',
        completed: ['meet'],
      },
    })
    const text = w.text()
    expect(text).toMatch(/choose rescue run/i)
    expect(text).toMatch(/rescue run/i)
    expect(text).toMatch(/wild match/i)
    expect(text).toMatch(/journal stamp/i)
  })

  it('uses img elements for step icons (pixel-art assets, not plain emoji checkboxes)', () => {
    const w = mount(RescueProgressPanel, {
      props: { currentStep: 'run', completed: ['meet'] },
    })
    const imgs = w.findAll('img')
    expect(imgs.length).toBeGreaterThanOrEqual(4)
  })

  it('complete step renders a check badge', () => {
    const w = mount(RescueProgressPanel, {
      props: { currentStep: 'run', completed: ['meet'] },
    })
    const badges = w.findAll('.rescue-step-card__check-badge')
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  it('has testids for all four step cards', () => {
    const w = mount(RescueProgressPanel, {
      props: { currentStep: 'run', completed: [] },
    })
    expect(w.find('[data-testid="explorer-rescue-step-meet-explorer"]').exists()).toBe(true)
    expect(w.find('[data-testid="explorer-rescue-step-rescue-run"]').exists()).toBe(true)
    expect(w.find('[data-testid="explorer-rescue-step-wild-match"]').exists()).toBe(true)
    expect(w.find('[data-testid="explorer-rescue-step-journal-stamp"]').exists()).toBe(true)
  })

  it('does not use generic browser checkbox elements as step indicators', () => {
    const w = mount(RescueProgressPanel, {
      props: { currentStep: 'run', completed: [] },
    })
    expect(w.findAll('input[type="checkbox"]').length).toBe(0)
  })
})

describe('ExplorerRescueChapterPage rescue-run tally', () => {
  const BWStub = defineComponent({
    template: '<div class="bw-scene-stub"><slot /></div>',
  })

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('shows 2 of 2 when journal history lists both demo runs (legacy API completion keys)', async () => {
    const profileId = 'chapter-tally-profile'
    const sessionStore = useSessionStore()
    sessionStore.activeProfile = {
      profileId,
      displayName: 'Test',
      avatarId: 'tiger',
      createdAt: '',
    } as ChildProfile

    const { storageService } = await import('@/services/storageService')
    storageService.set(STORAGE_KEYS.gameJournalState(profileId), {
      profileId,
      records: [
        {
          id: 'r1',
          categoryId: 'explorer-rescue-run',
          sourceId: 'opaque-frog',
          title: 'Larut Torrent Frog Wild Match',
          description: '',
          completedAt: '2026-01-01T00:00:00.000Z',
          leafPointsEarned: 50,
          stampId: 'wild-match-finder',
          stampTitle: '',
          stampDescription: '',
          restorationPercentBefore: 0,
          restorationPercentAfter: 0,
          restorationPercentDelta: 0,
          metadata: { rescueAnimalName: 'Larut Torrent Frog' },
        },
        {
          id: 'r2',
          categoryId: 'explorer-rescue-run',
          sourceId: 'opaque-bear',
          title: 'Sun Bear Wild Match',
          description: '',
          completedAt: '2026-01-02T00:00:00.000Z',
          leafPointsEarned: 50,
          stampId: 'wild-match-sun-bear',
          stampTitle: '',
          stampDescription: '',
          restorationPercentBefore: 0,
          restorationPercentAfter: 0,
          restorationPercentDelta: 0,
          metadata: { rescueAnimalName: 'Sun Bear' },
        },
      ],
      unlockedStampIds: [],
      updatedAt: '',
    })
    saveProgress({
      ...DEFAULT_EXPLORER_RESCUE_PROGRESS(profileId),
      completedExplorerIds: ['opaque-frog', 'opaque-bear'],
      rainforestRestored: 55,
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/games/explorer-rescue-run',
          name: ROUTE_NAMES.explorerRescue,
          component: ExplorerRescueChapterPage,
        },
      ],
    })
    await router.push({ name: ROUTE_NAMES.explorerRescue })
    await router.isReady()

    const wrapper = mount(ExplorerRescueChapterPage, {
      global: {
        plugins: [router],
        stubs: {
          BioWiraScenePage: BWStub,
          RescueInfoChips: false,
          RescueProgressPanel: true,
          ExplorerRescueStagePreview: true,
          RescueChoiceIcon: true,
        },
      },
    })
    await flushPromises()

    expect(wrapper.text()).toMatch(/all rescue runs completed/i)
    expect(wrapper.findAll('[data-testid="explorer-rescue-run-complete-chip"]')).toHaveLength(2)
  })
})

describe('ExplorerRescueChapterPage', () => {
  const BWStub = defineComponent({
    template: '<div class="bw-scene-stub"><slot /></div>',
  })

  async function mountChapterRouter() {
    const r = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/games/explorer-rescue-run',
          name: ROUTE_NAMES.explorerRescue,
          component: ExplorerRescueChapterPage,
        },
        {
          path: '/games/explorer-rescue-run/play',
          name: ROUTE_NAMES.explorerRescuePlay,
          component: defineComponent({ template: '<div />' }),
        },
        { path: '/games', name: ROUTE_NAMES.games, component: defineComponent({ template: '<div />' }) },
      ],
    })
    await r.push({ name: ROUTE_NAMES.explorerRescue })
    await r.isReady()
    return r
  }

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders two selectable rescue runs and routes with rescueAnimal query params', async () => {
    const router = await mountChapterRouter()
    const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined as unknown as never)
    const wrapper = mount(ExplorerRescueChapterPage, {
      global: {
        plugins: [router],
        stubs: {
          BioWiraScenePage: BWStub,
          RescueInfoChips: true,
          RescueProgressPanel: true,
          ExplorerRescueStagePreview: true,
          RescueChoiceIcon: true,
        },
      },
    })
    await flushPromises()
    const text = wrapper.text()
    expect(text).toContain('Larut Torrent Frog')
    expect(text).toContain('Sun Bear')
    expect(text).not.toMatch(/current explorer/i)

    await wrapper.get('[data-testid="explorer-rescue-start-larut-torrent-frog"]').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: ROUTE_NAMES.explorerRescuePlay,
        query: { rescueAnimal: 'larut-torrent-frog' },
      }),
    )

    pushSpy.mockClear()
    await wrapper.get('[data-testid="explorer-rescue-start-sun-bear"]').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: ROUTE_NAMES.explorerRescuePlay,
        query: { rescueAnimal: 'sun-bear' },
      }),
    )
  })
})

describe('ExplorerRescueStagePreview', () => {
  it('renders with stage background and mascot images', () => {
    const w = mount(ExplorerRescueStagePreview, {
      props: {
        backgroundSrc: '/games/explorer-rescue/stage-preview-background.jpg',
        mascotSrc: '/games/explorer-rescue/explorer-mascot.webp',
      },
    })
    const bg = w.find('.rescue-stage-preview__bg')
    const mascot = w.find('.rescue-stage-preview__mascot')
    expect(bg.exists()).toBe(true)
    expect(mascot.exists()).toBe(true)
    expect(bg.attributes('src')).toMatch(/stage-preview-background/)
    expect(mascot.attributes('src')).toMatch(/explorer-mascot/)
  })

  it('has data-testid explorer-rescue-stage-preview', () => {
    const w = mount(ExplorerRescueStagePreview, {
      props: {
        backgroundSrc: '/games/explorer-rescue/stage-preview-background.jpg',
        mascotSrc: '/games/explorer-rescue/explorer-mascot.webp',
      },
    })
    expect(w.find('[data-testid="explorer-rescue-stage-preview"]').exists()).toBe(true)
  })

  it('uses aria-label for accessibility', () => {
    const w = mount(ExplorerRescueStagePreview, {
      props: {
        backgroundSrc: '/img/bg.jpg',
        mascotSrc: '/img/mascot.webp',
      },
    })
    const section = w.find('section')
    expect(section.attributes('aria-label')).toBeTruthy()
  })
})

describe('ExplorerRescueStepCard', () => {
  it('shows check badge when status is complete', () => {
    const w = mount(ExplorerRescueStepCard, {
      props: { title: 'Choose Rescue Run', iconSrc: '/img/mascot.webp', status: 'complete' },
    })
    expect(w.find('.rescue-step-card__check-badge').exists()).toBe(true)
  })

  it('does not show check badge when status is current', () => {
    const w = mount(ExplorerRescueStepCard, {
      props: { title: 'Rescue Run', iconSrc: '/img/paw.webp', status: 'current' },
    })
    expect(w.find('.rescue-step-card__check-badge').exists()).toBe(false)
  })

  it('applies correct modifier class per status', () => {
    const complete = mount(ExplorerRescueStepCard, {
      props: { title: 'Step', iconSrc: '/img/x.webp', status: 'complete' },
    })
    expect(complete.find('.rescue-step-card--complete').exists()).toBe(true)

    const current = mount(ExplorerRescueStepCard, {
      props: { title: 'Step', iconSrc: '/img/x.webp', status: 'current' },
    })
    expect(current.find('.rescue-step-card--current').exists()).toBe(true)

    const upcoming = mount(ExplorerRescueStepCard, {
      props: { title: 'Step', iconSrc: '/img/x.webp', status: 'upcoming' },
    })
    expect(upcoming.find('.rescue-step-card--upcoming').exists()).toBe(true)
  })

  it('renders the icon img element', () => {
    const w = mount(ExplorerRescueStepCard, {
      props: { title: 'Journal Stamp', iconSrc: '/img/passport.webp', status: 'upcoming' },
    })
    const img = w.find('.rescue-step-card__icon')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/img/passport.webp')
  })
})

// ── RescueTraitBadge mission size variant ─────────────────────────────────────
describe('RescueTraitBadge mission size', () => {
  it('accepts mission as a valid size prop', () => {
    const trait = { id: 'habitat_forest', label: 'Forest', emoji: '🌳', iconPath: '/games/explorer-rescue/clues/habitat-forest-clue.webp' }
    const w = mount(RescueTraitBadge, { props: { trait, size: 'mission' } })
    expect(w.find('.rescue-trait-badge--mission').exists()).toBe(true)
  })

  it('mission badge renders img icon when iconPath is present', () => {
    const trait = { id: 'habitat_forest', label: 'Forest', emoji: '🌳', iconPath: '/games/explorer-rescue/clues/habitat-forest-clue.webp' }
    const w = mount(RescueTraitBadge, { props: { trait, size: 'mission' } })
    expect(w.find('img.rescue-trait-badge__icon').exists()).toBe(true)
  })
})

// ── RescueInfoChips uses GameplayIcon for leaf points ─────────────────────────
describe('RescueInfoChips — leaf points icon', () => {
  it('leaf points chip contains a GameplayIcon img (no raw emoji)', () => {
    const w = mount(RescueInfoChips, {
      props: { explorerName: 'Nina', rainforestRestored: 30, leafPoints: 100 },
    })
    const chip = w.find('[data-testid="explorer-rescue-leaf-points"]')
    expect(chip.exists()).toBe(true)
    const imgs = chip.findAll('img')
    expect(imgs.length).toBeGreaterThanOrEqual(1)
  })

  it('leaf points chip does not use raw 🌿 emoji as the only leaf icon', () => {
    const w = mount(RescueInfoChips, {
      props: { explorerName: 'Nina', rainforestRestored: 30, leafPoints: 100 },
    })
    const chip = w.find('[data-testid="explorer-rescue-leaf-points"]')
    expect(chip.find('img').exists()).toBe(true)
  })
})

// ── Discover stat icon registry ───────────────────────────────────────────────
describe('discoverStatIconRegistry', () => {
  const makeMockAnimal = (overrides: Partial<Parameters<typeof getDiscoverStatIcon>[1]>) => ({
    id: 'test',
    commonName: 'Test Animal',
    scientificName: 'Testus animalia',
    category: AnimalCategory.Mammals,
    habitat: HabitatZone.Rainforest,
    habitatDisplay: 'Forest',
    diet: 'Carnivore',
    lifespan: '10-15 years',
    conservationStatus: 'endangered' as const,
    conservationExplanation: 'Test explanation',
    description: 'Test description',
    funFact: 'Test fact',
    iconEmoji: '🐯',
    mapPosition: { desktop: { x: 0, y: 0 } },
    occurrences: [],
    ...overrides,
  } as Parameters<typeof getDiscoverStatIcon>[1])

  it('Malayan Tiger (Mammals, Rainforest, Carnivore) — group icon has src', () => {
    const animal = makeMockAnimal({ category: AnimalCategory.Mammals })
    const result = getDiscoverStatIcon('group', animal)
    expect(result.src).toBeTruthy()
    expect(result.src).toMatch(/group_mammal-clue\.webp/)
  })

  it('Malayan Tiger — habitat icon has src (forest)', () => {
    const animal = makeMockAnimal({ habitat: HabitatZone.Rainforest, habitatDisplay: 'Forest' })
    const result = getDiscoverStatIcon('habitat', animal)
    expect(result.src).toBeTruthy()
    expect(result.src).toMatch(/habitat-forest-clue\.webp/)
  })

  it('Malayan Tiger — diet icon has src (carnivore)', () => {
    const animal = makeMockAnimal({ diet: 'Carnivore' })
    const result = getDiscoverStatIcon('diet', animal)
    expect(result.src).toBeTruthy()
    expect(result.src).toMatch(/diet-carnivore-clue\.webp/)
  })

  it('Birds category resolves to group bird icon', () => {
    const animal = makeMockAnimal({ category: AnimalCategory.Birds })
    const result = getDiscoverStatIcon('group', animal)
    expect(result.src).toMatch(/group-bird-clue\.webp/)
  })

  it('Marine & Freshwater category resolves to group marine icon', () => {
    const animal = makeMockAnimal({ category: AnimalCategory.MarineFreshwater })
    const result = getDiscoverStatIcon('group', animal)
    expect(result.src).toMatch(/group-marine-clue\.webp/)
  })

  it('Marine habitat resolves to ocean habitat icon', () => {
    const animal = makeMockAnimal({ habitat: HabitatZone.MarineReserve, habitatDisplay: 'Ocean' })
    const result = getDiscoverStatIcon('habitat', animal)
    expect(result.src).toMatch(/habitat-ocean-clue\.webp/)
  })

  it('Omnivore diet resolves to diet-omnivore clue icon', () => {
    const animal = makeMockAnimal({ diet: 'Omnivore' })
    const result = getDiscoverStatIcon('diet', animal)
    expect(result.src).toMatch(/diet-omnivore-clue\.webp/)
  })

  it('Insectivore diet resolves to diet-insectivore clue icon', () => {
    const animal = makeMockAnimal({ diet: 'Insectivore' })
    const result = getDiscoverStatIcon('diet', animal)
    expect(result.src).toMatch(/diet-insectivore-clue\.webp/)
  })

  it('Lifespan icon resolves to a src', () => {
    const animal = makeMockAnimal({})
    const result = getDiscoverStatIcon('lifespan', animal)
    expect(result.src).toBeTruthy()
    expect(result.src).toMatch(/lifespan-clue\.webp/)
  })

  it('all results always have a non-empty fallbackText', () => {
    const animal = makeMockAnimal({})
    for (const kind of ['group', 'habitat', 'diet', 'lifespan'] as const) {
      const result = getDiscoverStatIcon(kind, animal)
      expect(result.fallbackText).toBeTruthy()
    }
  })

  it('Reptiles category resolves to group-reptiles clue icon', () => {
    const animal = makeMockAnimal({ category: AnimalCategory.Reptiles })
    const result = getDiscoverStatIcon('group', animal)
    expect(result.src).toMatch(/group-reptiles-clue\.webp/)
  })

  it('Amphibians category resolves to group-amphibians clue icon', () => {
    const animal = makeMockAnimal({ category: AnimalCategory.Amphibians })
    const result = getDiscoverStatIcon('group', animal)
    expect(result.src).toMatch(/group-amphibians-clue\.webp/)
  })

  it('Insects category resolves to group-insects clue icon', () => {
    const animal = makeMockAnimal({ category: AnimalCategory.Insects })
    const result = getDiscoverStatIcon('group', animal)
    expect(result.src).toMatch(/group-insects-clue\.webp/)
  })

  it('Herbivore diet resolves to diet-herbivore spirit WebP', () => {
    const animal = makeMockAnimal({ diet: 'Herbivore' })
    const result = getDiscoverStatIcon('diet', animal)
    expect(result.src).toMatch(/diet-herbivore-clue\.webp/)
  })

  it('Herbivore (nectar) resolves to the same herbivore spirit WebP', () => {
    const animal = makeMockAnimal({ diet: 'Herbivore (nectar)' })
    expect(getDiscoverStatIcon('diet', animal).src).toMatch(/diet-herbivore-clue\.webp/)
  })

  it('habitat display Wetlands, Ocean resolves to wetlands spirit WebP', () => {
    const animal = makeMockAnimal({
      habitatDisplay: 'Wetlands, Ocean',
      habitats: ['Wetlands', 'Ocean'],
      habitat: HabitatZone.CoastalArea,
    })
    const result = getDiscoverStatIcon('habitat', animal)
    expect(result.src).toMatch(/habitat-wetlands-clue\.webp/)
    expect(result.label).toMatch(/Wetlands, Ocean/)
  })

  it('River habitat has no spirit WebP yet — src undefined, label River', () => {
    const animal = makeMockAnimal({
      habitats: ['River'],
      habitatDisplay: 'River',
      habitat: HabitatZone.River,
    })
    const result = getDiscoverStatIcon('habitat', animal)
    expect(result.src).toBeUndefined()
    expect(result.label).toMatch(/River/)
  })

  it('stat icon registry — lifespan path is registered in branding.ts', () => {
    expect(EXPLORER_RESCUE_ASSETS.gameplay.clues.lifespan).toMatch(/lifespan-clue\.webp/)
  })
})

// ── clueIdsToTraits() helper ──────────────────────────────────────────────────
describe('clueIdsToTraits helper', () => {
  it('maps clue IDs to full RescueTrait objects', () => {
    const traits = clueIdsToTraits(['habitat_forest', 'diet_carnivore', 'group_mammal'])
    expect(traits).toHaveLength(3)
    expect(traits[0]!.label).toBe('Forest')
    expect(traits[1]!.label).toBe('Carnivore')
    expect(traits[2]!.label).toBe('Mammals')
  })

  it('populates iconPath from centralized registry', () => {
    const traits = clueIdsToTraits(['habitat_forest', 'diet_carnivore', 'group_mammal'])
    expect(traits[0]!.iconPath).toMatch(/habitat-forest-clue/)
    expect(traits[1]!.iconPath).toMatch(/diet-carnivore-clue/)
    expect(traits[2]!.iconPath).toMatch(/group_mammal-clue/)
  })
})

// ── Explorer sprite resolver ──────────────────────────────────────────────────
describe('explorerRescueSprites', () => {
  it('EXPLORER_RESCUE_ASSETS includes the orangutan rescue sprite path', () => {
    expect(EXPLORER_RESCUE_ASSETS.gameplay.orangutanExplorerSprite).toMatch(/orangutan-explorer-sprite\.webp/)
  })

  it('getExplorerRescueSpritePath returns orangutan sprite for orangutan', () => {
    const path = getExplorerRescueSpritePath('orangutan')
    expect(path).toBeTruthy()
    expect(path).toMatch(/orangutan-explorer-sprite\.webp/)
  })

  it('getExplorerRescueSpritePath returns tiger sprite for malayan-tiger', () => {
    const path = getExplorerRescueSpritePath('malayan-tiger')
    expect(path).toBeTruthy()
    expect(path).toMatch(/tiger-explorer-sprite\.webp/)
  })

  it('getExplorerRescueSpritePath returns null for unsupported visual keys', () => {
    expect(getExplorerRescueSpritePath('sun-bear')).toBeNull()
    expect(getExplorerRescueSpritePath('hornbill')).toBeNull()
    expect(getExplorerRescueSpritePath('')).toBeNull()
    expect(getExplorerRescueSpritePath('unknown-creature')).toBeNull()
  })

  it('resolveExplorerRescueSprite returns orangutan sprite for orangutan', () => {
    expect(resolveExplorerRescueSprite('orangutan')).toMatch(/orangutan-explorer-sprite\.webp/)
  })

  it('resolveExplorerRescueSprite returns tiger sprite for malayan-tiger', () => {
    expect(resolveExplorerRescueSprite('malayan-tiger')).toMatch(/tiger-explorer-sprite\.webp/)
  })

  it('resolveExplorerRescueSprite falls back to explorer mascot for unsupported keys', () => {
    expect(resolveExplorerRescueSprite('sun-bear')).toMatch(/explorer-mascot/)
    expect(resolveExplorerRescueSprite('')).toMatch(/explorer-mascot/)
    expect(resolveExplorerRescueSprite('unknown')).toMatch(/explorer-mascot/)
  })

  describe('resolveRescueExplorerPlayerIconResolution', () => {
    it('uses dedicated gameplay kind for tiger', () => {
      const r = resolveRescueExplorerPlayerIconResolution('malayan-tiger', 'Malayan Tiger')
      expect(r.kind).toBe('dedicated_gameplay')
      expect(r.url).toMatch(/tiger-explorer-sprite/)
    })

    it('uses discovery raster for Larut Torrent Frog (no dedicated sprite)', () => {
      const r = resolveRescueExplorerPlayerIconResolution('larut-torrent-frog', 'Larut Torrent Frog')
      expect(r.kind).toBe('discovery_raster')
      expect(r.url).toMatch(/larut/i)
      expect(r.url.endsWith('.webp')).toBe(true)
    })

    it('uses discovery raster for Sun Bear (no dedicated sprite)', () => {
      const r = resolveRescueExplorerPlayerIconResolution('sun-bear', 'Sun Bear')
      expect(r.kind).toBe('discovery_raster')
      expect(r.url).toMatch(/sun-bear/i)
      expect(r.url.endsWith('.webp')).toBe(true)
    })
  })

  describe('rescueExplorerFacingPositiveTowardWorldX', () => {
    it('positive for dedicated gameplay sprite', () => {
      expect(
        rescueExplorerFacingPositiveTowardWorldX({ textureKind: 'dedicated_gameplay' }),
      ).toBe(true)
    })

    it('positive for discovery raster default authoring', () => {
      expect(
        rescueExplorerFacingPositiveTowardWorldX({ textureKind: 'discovery_raster' }),
      ).toBe(true)
    })

    it('inverse for discovery raster when catalog requests mirror inversion (e.g. Sun Bear)', () => {
      expect(
        rescueExplorerFacingPositiveTowardWorldX({
          textureKind: 'discovery_raster',
          runnerDiscoveryMirrorInvert: true,
        }),
      ).toBe(false)
    })

    it('inverse mirroring for explorer SVG silhouette', () => {
      expect(
        rescueExplorerFacingPositiveTowardWorldX({ textureKind: 'explorer_svg' }),
      ).toBe(false)
    })

    it('inverse when procedural token only (none)', () => {
      expect(
        rescueExplorerFacingPositiveTowardWorldX({ textureKind: 'none' }),
      ).toBe(false)
    })

    it('defaults undefined kind like none', () => {
      expect(rescueExplorerFacingPositiveTowardWorldX({ textureKind: undefined })).toBe(false)
    })
  })
})

// ── RescueInfoChips — explorerVisualKey prop ──────────────────────────────────
describe('RescueInfoChips — explorerVisualKey prop', () => {
  it('shows orangutan sprite when explorerVisualKey is orangutan', () => {
    const w = mount(RescueInfoChips, {
      props: {
        explorerName: 'Ranger',
        rainforestRestored: 30,
        leafPoints: 10,
        explorerVisualKey: 'orangutan',
      },
    })
    const img = w.find('img.rescue-info-chips__mascot')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toMatch(/orangutan-explorer-sprite\.webp/)
  })

  it('shows tiger sprite when explorerVisualKey is malayan-tiger', () => {
    const w = mount(RescueInfoChips, {
      props: {
        explorerName: 'Ranger',
        rainforestRestored: 30,
        leafPoints: 10,
        explorerVisualKey: 'malayan-tiger',
      },
    })
    const img = w.find('img.rescue-info-chips__mascot')
    expect(img.attributes('src')).toMatch(/tiger-explorer-sprite\.webp/)
  })

  it('falls back to explorer-mascot when explorerVisualKey is missing', () => {
    const w = mount(RescueInfoChips, {
      props: { explorerName: 'Nina', rainforestRestored: 30, leafPoints: 42 },
    })
    const img = w.find('img.rescue-info-chips__mascot')
    expect(img.attributes('src')).toMatch(/explorer-mascot/)
  })
})

// ── RescueProgressPanel — previewVisualKey prop ───────────────────────────────
describe('RescueProgressPanel — previewVisualKey prop', () => {
  it('Choose Rescue Run step uses orangutan sprite when previewVisualKey is orangutan', () => {
    const w = mount(RescueProgressPanel, {
      props: { currentStep: 'meet', completed: [], previewVisualKey: 'orangutan' },
    })
    const meetCard = w.find('[data-testid="explorer-rescue-step-meet-explorer"]')
    const img = meetCard.find('img')
    expect(img.attributes('src')).toMatch(/orangutan-explorer-sprite\.webp/)
  })

  it('Choose Rescue Run step falls back to mascot when no previewVisualKey', () => {
    const w = mount(RescueProgressPanel, {
      props: { currentStep: 'meet', completed: [] },
    })
    const meetCard = w.find('[data-testid="explorer-rescue-step-meet-explorer"]')
    const img = meetCard.find('img')
    expect(img.attributes('src')).toMatch(/explorer-mascot/)
  })
})

// ── RescueChoiceTraitList component ──────────────────────────────────────────
describe('RescueChoiceTraitList', () => {
  it('renders 3 RescueTraitBadge elements for 3 traits', () => {
    const traits = clueIdsToTraits(['habitat_forest', 'diet_carnivore', 'group_mammal'])
    const w = mount(RescueChoiceTraitList, {
      props: { traits, animalName: 'Sun Bear' },
    })
    const badges = w.findAll('.rescue-trait-badge')
    expect(badges).toHaveLength(3)
  })

  it('renders image icons when iconPath is present', () => {
    const traits = clueIdsToTraits(['habitat_forest', 'diet_carnivore', 'group_mammal'])
    const w = mount(RescueChoiceTraitList, {
      props: { traits, animalName: 'Sun Bear' },
    })
    const imgs = w.findAll('img.rescue-trait-badge__icon')
    expect(imgs.length).toBeGreaterThanOrEqual(3)
  })

  it('does not render text like "3 clues", "1 clue", or "0 clues"', () => {
    const traits = clueIdsToTraits(['habitat_forest', 'diet_carnivore', 'group_mammal'])
    const w = mount(RescueChoiceTraitList, {
      props: { traits, animalName: 'Sun Bear' },
    })
    expect(w.text()).not.toMatch(/\d clue/)
  })

  it('has aria-label listing all 3 trait names', () => {
    const traits = clueIdsToTraits(['habitat_forest', 'diet_carnivore', 'group_mammal'])
    const w = mount(RescueChoiceTraitList, {
      props: { traits, animalName: 'Sun Bear' },
    })
    const label = w.attributes('aria-label') ?? ''
    expect(label).toContain('Sun Bear traits')
    expect(label).toContain('Forest')
    expect(label).toContain('Carnivore')
    expect(label).toContain('Mammals')
  })
})

// ── ExplorerRescueResultPage reward UI ────────────────────────────────────────
describe('ExplorerRescueResultPage reward UI', () => {
  const Empty = defineComponent({ template: '<div />' })

  function seedActiveProfile(
    pinia: ReturnType<typeof createPinia>,
    progress: Pick<ChildProfile, 'leafPoints' | 'level' | 'levelTitle'>,
  ) {
    const sessionStore = useSessionStore(pinia)
    const profile: ChildProfile = {
      profileId: 'test-er-result',
      displayNickname: 'Tester',
      animalId: 'malayan-tiger',
      animalVisualKey: 'malayan-tiger',
      leafPoints: progress.leafPoints,
      level: progress.level,
      levelTitle: progress.levelTitle,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      guardianBackupLinked: false,
    }
    sessionStore.$patch({
      sessionState: 'active',
      activeProfile: profile,
    })
    useProgressStore(pinia)
  }

  function buildResultRouter() {
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/games/explorer-rescue-run/result', name: ROUTE_NAMES.explorerRescueResult, component: Empty },
        { path: '/games/explorer-rescue-run/play',   name: ROUTE_NAMES.explorerRescuePlay,   component: Empty },
        { path: '/games/explorer-rescue-run',        name: ROUTE_NAMES.explorerRescue,        component: Empty },
        { path: '/games/explorer-rescue-run/journal',name: ROUTE_NAMES.explorerRescueJournal, component: Empty },
        { path: '/games/journal',                    name: ROUTE_NAMES.gameJournalMenu,        component: Empty },
        { path: '/missions',                         name: ROUTE_NAMES.missions,               component: Empty },
      ],
    })
  }

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('result page renders .scene-page and not .pixel-page-ribbon', async () => {
    const router = buildResultRouter()
    await router.push({ name: ROUTE_NAMES.explorerRescueResult })
    const w = mount(ExplorerRescueResultPage, { global: { plugins: [createPinia(), router] } })
    expect(w.find('.scene-page').exists()).toBe(true)
    expect(w.find('.pixel-page-ribbon').exists()).toBe(false)
    expect(w.text()).toMatch(/Your Wild Match!/i)
  })

  it('result page shows no-result guard when there is no result', async () => {
    const router = buildResultRouter()
    await router.push({ name: ROUTE_NAMES.explorerRescueResult })
    const w = mount(ExplorerRescueResultPage, { global: { plugins: [createPinia(), router] } })
    expect(w.text()).toMatch(/No rescue result yet/i)
  })

  it('LEAF_POINTS_GAMEPLAY_ICON_KEY resolves to a valid leaf icon URL', () => {
    const url = getGameplayIconUrl(LEAF_POINTS_GAMEPLAY_ICON_KEY)
    expect(url).toBeTruthy()
    expect(url).toMatch(/leaf-level/)
  })

  it('passport icon asset is centralized in EXPLORER_RESCUE_ASSETS', () => {
    expect(EXPLORER_RESCUE_ASSETS.landing.passportIcon).toMatch(/passport-icon/)
  })

  it('forest clue icon is centralized in EXPLORER_RESCUE_ASSETS', () => {
    expect(EXPLORER_RESCUE_ASSETS.gameplay.clues.habitatForest).toMatch(/habitat-forest-clue/)
  })

  it('result reward board has aria-label "Your rewards"', async () => {
    const profileId = 'test-er-result'
    const latestResult = {
      profileId,
      explorerAnimalId: 'malayan-tiger',
      explorerName: 'Malayan Tiger',
      explorerVisualKey: 'malayan-tiger',
      chosenMatchAnimalId: 'sun-bear',
      chosenMatchName: 'Sun Bear',
      chosenMatchVisualKey: 'sun-bear',
      isCorrect: true,
      sharedTraits: [
        { id: 'habitat_forest', label: 'Forest', emoji: '🌳', iconPath: '/games/explorer-rescue/clues/habitat-forest-clue.webp' },
        { id: 'diet_omnivore', label: 'Omnivore', emoji: '🍎', iconPath: '/games/explorer-rescue/clues/diet-omnivore-clue.webp' },
        { id: 'group_mammal', label: 'Mammals', emoji: '🐾', iconPath: '/games/explorer-rescue/clues/group_mammal-clue.webp' },
      ],
      pointsEarned: 50,
      restorationBefore: 25,
      restorationAfter: 40,
      journalStamp: 'wild-match-finder',
      isFirstCompletion: true,
      completedAt: new Date().toISOString(),
    }
    const data = {
      profileId,
      rainforestRestored: 40,
      completedExplorerIds: ['malayan-tiger'],
      journalStamps: ['wild-match-finder'],
      latestResult,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(`bw_explorer_rescue_${profileId}`, JSON.stringify({ v: 1, data }))

    const router = buildResultRouter()
    await router.push({ name: ROUTE_NAMES.explorerRescueResult })
    const pinia = createPinia()
    setActivePinia(pinia)
    seedActiveProfile(pinia, { leafPoints: 250, level: 2, levelTitle: 'Animal Explorer' })
    const w = mount(ExplorerRescueResultPage, { global: { plugins: [pinia, router] } })

    const rewardsEl = w.find('[aria-label="Your rewards"]')
    expect(rewardsEl.exists()).toBe(true)
    expect(rewardsEl.classes()).toContain('result-page__achievement-board')
  })

  it('Leaf Points card shows heading, +earned, Total, and GameplayIcon img', async () => {
    const profileId = 'test-er-result'
    const latestResult = {
      profileId,
      explorerAnimalId: 'malayan-tiger',
      explorerName: 'Malayan Tiger',
      explorerVisualKey: 'malayan-tiger',
      chosenMatchAnimalId: 'sun-bear',
      chosenMatchName: 'Sun Bear',
      chosenMatchVisualKey: 'sun-bear',
      isCorrect: true,
      sharedTraits: [],
      pointsEarned: 50,
      restorationBefore: 25,
      restorationAfter: 40,
      journalStamp: 'wild-match-finder',
      isFirstCompletion: false,
      completedAt: new Date().toISOString(),
    }
    localStorage.setItem(`bw_explorer_rescue_${profileId}`, JSON.stringify({ v: 1, data: { profileId, rainforestRestored: 40, completedExplorerIds: ['malayan-tiger'], journalStamps: [], latestResult, updatedAt: '' } }))

    const router = buildResultRouter()
    await router.push({ name: ROUTE_NAMES.explorerRescueResult })
    const pinia = createPinia()
    setActivePinia(pinia)
    seedActiveProfile(pinia, { leafPoints: 120, level: 1, levelTitle: 'Nature Newbie' })
    const w = mount(ExplorerRescueResultPage, { global: { plugins: [pinia, router] } })

    const leafCard = w.find('[data-testid="result-reward-leaf-points"]')
    expect(leafCard.exists()).toBe(true)
    expect(leafCard.text()).toMatch(/LEAF POINTS EARNED/i)
    expect(leafCard.text()).toMatch(/\+50/)
    expect(leafCard.text()).toMatch(/Total:/i)
    expect(leafCard.find('img').exists()).toBe(true)
  })

  it('Level Progress card shows LEVEL PROGRESS, LV, title from progress store, and progress bar', async () => {
    const profileId = 'test-er-result'
    const latestResult = {
      profileId,
      explorerAnimalId: 'malayan-tiger',
      explorerName: 'Malayan Tiger',
      explorerVisualKey: 'malayan-tiger',
      chosenMatchAnimalId: 'sun-bear',
      chosenMatchName: 'Sun Bear',
      chosenMatchVisualKey: 'sun-bear',
      isCorrect: true,
      sharedTraits: [],
      pointsEarned: 10,
      restorationBefore: 25,
      restorationAfter: 40,
      journalStamp: '',
      isFirstCompletion: false,
      completedAt: new Date().toISOString(),
    }
    localStorage.setItem(`bw_explorer_rescue_${profileId}`, JSON.stringify({ v: 1, data: { profileId, rainforestRestored: 40, completedExplorerIds: ['malayan-tiger'], journalStamps: [], latestResult, updatedAt: '' } }))

    const router = buildResultRouter()
    await router.push({ name: ROUTE_NAMES.explorerRescueResult })
    const pinia = createPinia()
    setActivePinia(pinia)
    seedActiveProfile(pinia, { leafPoints: 250, level: 2, levelTitle: 'Animal Explorer' })
    const w = mount(ExplorerRescueResultPage, { global: { plugins: [pinia, router] } })

    const levelCard = w.find('[data-testid="result-reward-level-progress"]')
    expect(levelCard.exists()).toBe(true)
    expect(levelCard.text()).toMatch(/LEVEL PROGRESS/i)
    expect(levelCard.text()).toMatch(/LV\s*2/i)
    expect(levelCard.text()).toMatch(/Animal Explorer/)
    expect(levelCard.find('.progress-bar').exists()).toBe(true)
  })

  it('Rainforest Restored card shows range, restoration delta when > 0', async () => {
    const profileId = 'test-er-result'
    const latestResult = {
      profileId,
      explorerAnimalId: 'malayan-tiger',
      explorerName: 'Malayan Tiger',
      explorerVisualKey: 'malayan-tiger',
      chosenMatchAnimalId: 'sun-bear',
      chosenMatchName: 'Sun Bear',
      chosenMatchVisualKey: 'sun-bear',
      isCorrect: true,
      sharedTraits: [],
      pointsEarned: 50,
      restorationBefore: 25,
      restorationAfter: 40,
      journalStamp: 'wild-match-finder',
      isFirstCompletion: true,
      completedAt: new Date().toISOString(),
    }
    localStorage.setItem(`bw_explorer_rescue_${profileId}`, JSON.stringify({ v: 1, data: { profileId, rainforestRestored: 40, completedExplorerIds: [], journalStamps: [], latestResult, updatedAt: '' } }))

    const router = buildResultRouter()
    await router.push({ name: ROUTE_NAMES.explorerRescueResult })
    const pinia = createPinia()
    setActivePinia(pinia)
    seedActiveProfile(pinia, { leafPoints: 0, level: 1, levelTitle: 'Nature Newbie' })
    const w = mount(ExplorerRescueResultPage, { global: { plugins: [pinia, router] } })

    const restCard = w.find('[data-testid="result-reward-restoration"]')
    expect(restCard.text()).toMatch(/RAINFOREST RESTORED/i)
    expect(restCard.text()).toMatch(/25%\s*→\s*40%/)
    expect(restCard.text()).toMatch(/\+15%\s*Restoration/i)
    expect(restCard.find('.progress-bar').exists()).toBe(true)
  })

  it('Rainforest Restored card shows replay hint when delta is 0', async () => {
    const profileId = 'test-er-result'
    const latestResult = {
      profileId,
      explorerAnimalId: 'malayan-tiger',
      explorerName: 'Malayan Tiger',
      explorerVisualKey: 'malayan-tiger',
      chosenMatchAnimalId: 'sun-bear',
      chosenMatchName: 'Sun Bear',
      chosenMatchVisualKey: 'sun-bear',
      isCorrect: true,
      sharedTraits: [],
      pointsEarned: 5,
      restorationBefore: 40,
      restorationAfter: 40,
      journalStamp: '',
      isFirstCompletion: false,
      completedAt: new Date().toISOString(),
    }
    localStorage.setItem(`bw_explorer_rescue_${profileId}`, JSON.stringify({ v: 1, data: { profileId, rainforestRestored: 40, completedExplorerIds: ['malayan-tiger'], journalStamps: [], latestResult, updatedAt: '' } }))

    const router = buildResultRouter()
    await router.push({ name: ROUTE_NAMES.explorerRescueResult })
    const pinia = createPinia()
    setActivePinia(pinia)
    seedActiveProfile(pinia, { leafPoints: 100, level: 1, levelTitle: 'Nature Newbie' })
    const w = mount(ExplorerRescueResultPage, { global: { plugins: [pinia, router] } })

    const restCard = w.find('[data-testid="result-reward-restoration"]')
    expect(restCard.text()).toMatch(/40%\s*→\s*40%/)
    expect(restCard.text()).toMatch(/Already restored for this rescue/i)
    expect(restCard.text()).not.toMatch(/\+0%\s*Restoration/)
  })

  it('Journal Stamp card shows NEW STAMP and Journal Updated on first completion', async () => {
    const profileId = 'test-er-result'
    const latestResult = {
      profileId,
      explorerAnimalId: 'malayan-tiger', explorerName: 'Malayan Tiger', explorerVisualKey: 'malayan-tiger',
      chosenMatchAnimalId: 'sun-bear', chosenMatchName: 'Sun Bear', chosenMatchVisualKey: 'sun-bear',
      isCorrect: true, sharedTraits: [], pointsEarned: 50,
      restorationBefore: 25, restorationAfter: 40, journalStamp: 'wild-match-finder',
      isFirstCompletion: true, completedAt: new Date().toISOString(),
    }
    localStorage.setItem(`bw_explorer_rescue_${profileId}`, JSON.stringify({ v: 1, data: { profileId, rainforestRestored: 40, completedExplorerIds: ['malayan-tiger'], journalStamps: [], latestResult, updatedAt: '' } }))

    const router = buildResultRouter()
    await router.push({ name: ROUTE_NAMES.explorerRescueResult })
    const pinia = createPinia()
    setActivePinia(pinia)
    seedActiveProfile(pinia, { leafPoints: 50, level: 1, levelTitle: 'Nature Newbie' })
    const w = mount(ExplorerRescueResultPage, { global: { plugins: [pinia, router] } })

    const stampCard = w.find('[data-testid="result-reward-journal-stamp"]')
    expect(stampCard.exists()).toBe(true)
    expect(stampCard.text()).toMatch(/NEW STAMP/i)
    expect(stampCard.text()).toMatch(/Journal Updated!/i)
    const img = stampCard.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toMatch(/passport-icon/)
  })

  it('Journal Stamp card remains on replay with STAMP COLLECTED and Already in Journal', async () => {
    const profileId = 'test-er-result'
    const latestResult = {
      profileId,
      explorerAnimalId: 'malayan-tiger', explorerName: 'Malayan Tiger', explorerVisualKey: 'malayan-tiger',
      chosenMatchAnimalId: 'sun-bear', chosenMatchName: 'Sun Bear', chosenMatchVisualKey: 'sun-bear',
      isCorrect: true, sharedTraits: [], pointsEarned: 5,
      restorationBefore: 40, restorationAfter: 40, journalStamp: '',
      isFirstCompletion: false, completedAt: new Date().toISOString(),
    }
    localStorage.setItem(`bw_explorer_rescue_${profileId}`, JSON.stringify({ v: 1, data: { profileId, rainforestRestored: 40, completedExplorerIds: ['malayan-tiger'], journalStamps: ['wild-match-finder'], latestResult, updatedAt: '' } }))

    const router = buildResultRouter()
    await router.push({ name: ROUTE_NAMES.explorerRescueResult })
    const pinia = createPinia()
    setActivePinia(pinia)
    seedActiveProfile(pinia, { leafPoints: 205, level: 2, levelTitle: 'Animal Explorer' })
    const w = mount(ExplorerRescueResultPage, { global: { plugins: [pinia, router] } })

    const stampCard = w.find('[data-testid="result-reward-journal-stamp"]')
    expect(stampCard.exists()).toBe(true)
    expect(stampCard.text()).toMatch(/STAMP COLLECTED/i)
    expect(stampCard.text()).toMatch(/Already in Journal/i)
  })

  it('shows LEVEL UP badge when completion crosses a level threshold', async () => {
    const profileId = 'test-er-result'
    const latestResult = {
      profileId,
      explorerAnimalId: 'malayan-tiger',
      explorerName: 'Malayan Tiger',
      explorerVisualKey: 'malayan-tiger',
      chosenMatchAnimalId: 'sun-bear',
      chosenMatchName: 'Sun Bear',
      chosenMatchVisualKey: 'sun-bear',
      isCorrect: true,
      sharedTraits: [],
      pointsEarned: 50,
      restorationBefore: 25,
      restorationAfter: 40,
      journalStamp: 'wild-match-finder',
      isFirstCompletion: true,
      completedAt: new Date().toISOString(),
    }
    localStorage.setItem(`bw_explorer_rescue_${profileId}`, JSON.stringify({ v: 1, data: { profileId, rainforestRestored: 40, completedExplorerIds: [], journalStamps: [], latestResult, updatedAt: '' } }))

    const router = buildResultRouter()
    await router.push({ name: ROUTE_NAMES.explorerRescueResult })
    const pinia = createPinia()
    setActivePinia(pinia)
    seedActiveProfile(pinia, { leafPoints: 245, level: 2, levelTitle: 'Animal Explorer' })
    const w = mount(ExplorerRescueResultPage, { global: { plugins: [pinia, router] } })

    expect(w.text()).toMatch(/LEVEL UP!/i)
  })

  it('Play Again navigates to explorer rescue play route with rescueAnimal query', async () => {
    const profileId = 'test-er-result'
    const latestResult = {
      profileId,
      rescueRunCatalogId: 'larut-torrent-frog',
      explorerAnimalId: 'larut-torrent-frog',
      explorerName: 'Larut Torrent Frog',
      explorerVisualKey: 'larut-torrent-frog',
      chosenMatchAnimalId: 'asian-common-toad',
      chosenMatchName: 'Asian Common Toad',
      chosenMatchVisualKey: 'asian-common-toad',
      isCorrect: true,
      sharedTraits: [],
      pointsEarned: 5,
      restorationBefore: 40,
      restorationAfter: 40,
      journalStamp: '',
      isFirstCompletion: false,
      completedAt: new Date().toISOString(),
    }
    localStorage.setItem(`bw_explorer_rescue_${profileId}`, JSON.stringify({ v: 1, data: { profileId, rainforestRestored: 40, completedExplorerIds: ['larut-torrent-frog'], journalStamps: [], latestResult, updatedAt: '' } }))

    const router = buildResultRouter()
    await router.push({ name: ROUTE_NAMES.explorerRescueResult })
    const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined as unknown as never)

    const pinia = createPinia()
    setActivePinia(pinia)
    seedActiveProfile(pinia, { leafPoints: 100, level: 1, levelTitle: 'Nature Newbie' })
    const w = mount(ExplorerRescueResultPage, { global: { plugins: [pinia, router] } })

    await w.get('[aria-label="Play again"]').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({
      name: ROUTE_NAMES.explorerRescuePlay,
      query: { rescueAnimal: 'larut-torrent-frog' },
    })
  })

  it('Play Again for old malayan-tiger result falls back to DEFAULT_EXPLORER_RESCUE_RUN_ID', async () => {
    const profileId = 'test-er-result'
    const latestResult = {
      profileId,
      rescueRunCatalogId: 'malayan-tiger',
      explorerAnimalId: 'malayan-tiger',
      explorerName: 'Malayan Tiger',
      explorerVisualKey: 'malayan-tiger',
      chosenMatchAnimalId: 'sun-bear',
      chosenMatchName: 'Sun Bear',
      chosenMatchVisualKey: 'sun-bear',
      isCorrect: true,
      sharedTraits: [],
      pointsEarned: 5,
      restorationBefore: 40,
      restorationAfter: 40,
      journalStamp: '',
      isFirstCompletion: false,
      completedAt: new Date().toISOString(),
    }
    localStorage.setItem(`bw_explorer_rescue_${profileId}`, JSON.stringify({ v: 1, data: { profileId, rainforestRestored: 40, completedExplorerIds: ['malayan-tiger'], journalStamps: [], latestResult, updatedAt: '' } }))

    const router = buildResultRouter()
    await router.push({ name: ROUTE_NAMES.explorerRescueResult })
    const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined as unknown as never)

    const pinia = createPinia()
    setActivePinia(pinia)
    seedActiveProfile(pinia, { leafPoints: 100, level: 1, levelTitle: 'Nature Newbie' })
    const w = mount(ExplorerRescueResultPage, { global: { plugins: [pinia, router] } })

    await w.get('[aria-label="Play again"]').trigger('click')
    // malayan-tiger is no longer in the catalog — must route to the new default
    expect(pushSpy).toHaveBeenCalledWith({
      name: ROUTE_NAMES.explorerRescuePlay,
      query: { rescueAnimal: DEFAULT_EXPLORER_RESCUE_RUN_ID },
    })
  })
})
