// ── Explorer Rescue Run — API-backed Round Builder ────────────────────────────
//
// Loads backend discovery animals and builds a live ExplorerRescueRound.
// This REPLACES the static round data in explorerRescueRounds.ts for all
// production runtime code.
//
// Do NOT import static ANIMAL_RESCUE_PROFILES, EXPLORER_RESCUE_ROUNDS, or
// LEGACY_TRAITS here. All animal facts come from the backend API.

import { repositories } from '@/repositories'
import type { Animal, AnimalListItem } from '@/domain/animal'
import { getDiscoveryAnimalIconUrl } from '@/app/discoveryAnimalIconRegistry'
import { DEFAULT_RESCUE_REWARDS } from './explorerRescueRewards'
import { getExplorerRescueJournalStampIdForAnimalId } from './explorerRescueRunCatalog'
import {
  buildRescueTraitsFromAnimal,
  sharedTraitIds,
} from './rescueTraitResolver'
import type { ExplorerRescueRound, RescueChoice } from '../game/types'

// ── Module-level cache ────────────────────────────────────────────────────────
let _animalPool: Animal[] | null = null

/** Clear the cached animal pool. Call this in tests between test runs. */
export function clearExplorerRescueAnimalCache(): void {
  _animalPool = null
}

// ── Slug helper ───────────────────────────────────────────────────────────────
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['''\u2019`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** FNV-1a 32-bit — deterministic seed from explorer id for choice ordering. */
function hashStringToSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)!
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Same inputs ⇒ same permutation (stable tests / UI). */
function shuffleDeterministic<T>(items: readonly T[], seedStr: string): T[] {
  const out = [...items]
  const rng = mulberry32(hashStringToSeed(seedStr))
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = out[i]!
    out[i] = out[j]!
    out[j] = tmp
  }
  return out
}

// ── Pool loader ───────────────────────────────────────────────────────────────
async function loadAnimalPool(forceRefresh = false): Promise<Animal[]> {
  if (_animalPool && !forceRefresh) return _animalPool

  const listItems: AnimalListItem[] = await repositories.animals.getAll()

  const itemsWithId = listItems.filter((item) => item.backendId != null)

  const settledDetails = await Promise.allSettled(
    itemsWithId.map((item) => repositories.animals.getById(String(item.backendId!))),
  )

  const pool: Animal[] = []
  for (let i = 0; i < settledDetails.length; i++) {
    const settled = settledDetails[i]!
    const listItem = itemsWithId[i]!
    if (settled.status !== 'fulfilled' || !settled.value) continue

    // Merge list metadata that may be missing from detail
    const animal = settled.value as Animal & { imageUrl?: string; avatarPath?: string; visualKey?: string; iconEmoji?: string }
    if (!animal.imageUrl && listItem.imageUrl) animal.imageUrl = listItem.imageUrl
    if (!animal.avatarPath && listItem.avatarPath) animal.avatarPath = listItem.avatarPath
    if (!animal.visualKey && listItem.visualKey) animal.visualKey = listItem.visualKey
    if (!animal.iconEmoji) animal.iconEmoji = listItem.iconEmoji

    pool.push(animal)
  }

  _animalPool = pool
  return pool
}

// ── Explorer animal resolution ────────────────────────────────────────────────
function findExplorerAnimal(
  pool: Animal[],
  explorerAnimalId: string | null | undefined,
  explorerVisualKey: string | null | undefined,
): Animal | null {
  const aid = explorerAnimalId ?? ''
  const vk = explorerVisualKey ?? ''
  const aidSlug = slugify(aid)
  const vkSlug = slugify(vk)

  // Priority 1: id exact match
  if (aid) {
    const byId = pool.find((a) => a.id === aid)
    if (byId) return byId
  }

  // Priority 2: visualKey exact match
  if (vk) {
    const byVk = pool.find((a) => a.visualKey === vk)
    if (byVk) return byVk
  }

  // Priority 3: visualKey matches explorerAnimalId
  if (aid) {
    const byVkAsId = pool.find((a) => a.visualKey === aid)
    if (byVkAsId) return byVkAsId
  }

  // Priority 4: slugified commonName equals explorerAnimalId
  if (aidSlug) {
    const byNameSlug = pool.find((a) => slugify(a.commonName) === aidSlug)
    if (byNameSlug) return byNameSlug
  }

  // Priority 5: slugified commonName equals explorerVisualKey
  if (vkSlug) {
    const byVkNameSlug = pool.find((a) => slugify(a.commonName) === vkSlug)
    if (byVkNameSlug) return byVkNameSlug
  }

  return null
}

// ── Choice builder ────────────────────────────────────────────────────────────
function buildChoices(
  explorerAnimal: Animal,
  explorerTraits: ReturnType<typeof buildRescueTraitsFromAnimal>,
  pool: Animal[],
): RescueChoice[] {
  // Exclude explorer from candidates
  const candidates = pool.filter((a) => a.id !== explorerAnimal.id && a.commonName !== explorerAnimal.commonName)

  if (candidates.length < 2) {
    throw new Error(
      'Explorer Rescue needs at least 4 valid API animals with habitat, diet, and group details.',
    )
  }

  // Score each candidate
  type ScoredCandidate = { animal: Animal; traits: ReturnType<typeof buildRescueTraitsFromAnimal>; score: number; shared: string[] }
  const scored: ScoredCandidate[] = candidates.map((animal) => {
    const traits = buildRescueTraitsFromAnimal(animal)
    const shared = sharedTraitIds(explorerTraits, traits)
    return { animal, traits, score: shared.length, shared }
  })

  // Sort deterministically: highest score first, then commonName, then id
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const nameCmp = a.animal.commonName.localeCompare(b.animal.commonName)
    if (nameCmp !== 0) return nameCmp
    return a.animal.id.localeCompare(b.animal.id)
  })

  // Correct choice: highest scoring
  const correctCandidate = scored[0]!
  const correctScore = correctCandidate.score

  // Demo runs require an exact full trait match (all 3 traits shared).
  // Silently accepting a partial match as "correct" misleads users — fail loudly instead.
  if (correctScore < explorerTraits.length) {
    throw new Error(
      `Explorer Rescue: no exact Wild Match found for "${explorerAnimal.commonName}". ` +
      `Best match has only ${correctScore}/${explorerTraits.length} shared traits. ` +
      `Ensure an animal with the same habitat, diet, and group exists in the API pool.`,
    )
  }

  // Wrong choices must never share the full trait set — that would show a valid
  // Wild Match as "Try again!" when the player picks it.
  const wrongPool: ScoredCandidate[] = scored
    .slice(1)
    .filter((c) => c.score < correctScore)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score
      const nameCmp = a.animal.commonName.localeCompare(b.animal.commonName)
      if (nameCmp !== 0) return nameCmp
      return a.animal.id.localeCompare(b.animal.id)
    })

  if (wrongPool.length < 2) {
    throw new Error(
      `Explorer Rescue needs at least 2 animals with fewer than ${correctScore} shared traits ` +
        `for "${explorerAnimal.commonName}". Add more discovery animals with partial matches.`,
    )
  }

  const wrong1 = wrongPool[0]!
  const wrong2 = wrongPool[1]!

  // Ensure no duplicate names
  const usedNames = new Set([explorerAnimal.commonName, correctCandidate.animal.commonName, wrong1.animal.commonName])
  let finalWrong2 = wrong2
  for (const c of wrongPool.slice(2)) {
    if (!usedNames.has(c.animal.commonName)) {
      finalWrong2 = c
      break
    }
  }

  function makeChoice(candidate: ScoredCandidate, isCorrect: boolean): RescueChoice {
    const { animal, traits, shared } = candidate
    const iconUrl = getDiscoveryAnimalIconUrl({
      visualKey: animal.visualKey,
      commonName: animal.commonName,
    })
    // imageUrl/avatarPath kept for data parity; cards and Phaser preload only use iconUrl (spirit WebP)
    // so gameplay never shows uncited real photos.
    return {
      animalId: animal.id,
      name: animal.commonName,
      visualKey: animal.visualKey ?? slugify(animal.commonName),
      fallbackEmoji: animal.iconEmoji || '🐾',
      choiceTraits: traits,
      sharedTraitIds: shared,
      isCorrect,
      imageUrl: animal.imageUrl,
      avatarPath: animal.avatarPath,
      iconUrl: iconUrl ?? undefined,
    }
  }

  const choices: RescueChoice[] = [
    makeChoice(correctCandidate, true),
    makeChoice(wrong1, false),
    makeChoice(finalWrong2, false),
  ]

  return shuffleDeterministic(choices, `explorer-rescue-choices:${explorerAnimal.id}`)
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface LoadExplorerRescueRoundInput {
  explorerAnimalId?: string | null
  explorerVisualKey?: string | null
  forceRefresh?: boolean
}

/**
 * Load an API-backed ExplorerRescueRound for the given explorer identity.
 *
 * - Loads and caches the full backend discovery animal pool.
 * - Resolves the explorer animal by id, visualKey, or commonName slug.
 * - Builds clueTraits from real backend habitat/diet/category data.
 * - Builds 3 choices from the same backend pool.
 * - Never uses static mock round data or hardcoded per-animal facts.
 */
export async function loadExplorerRescueRound(
  input: LoadExplorerRescueRoundInput = {},
): Promise<ExplorerRescueRound> {
  const { explorerAnimalId, explorerVisualKey, forceRefresh = false } = input

  const pool = await loadAnimalPool(forceRefresh)

  if (pool.length < 4) {
    throw new Error(
      'Explorer Rescue needs at least 4 valid API animals with habitat, diet, and group details.',
    )
  }

  const explorerAnimal = findExplorerAnimal(pool, explorerAnimalId, explorerVisualKey)
  if (!explorerAnimal) {
    throw new Error(
      'Explorer Rescue could not find the selected rescue animal in the animal API pool.',
    )
  }

  const clueTraits = buildRescueTraitsFromAnimal(explorerAnimal)
  const choices = buildChoices(explorerAnimal, clueTraits, pool)

  const matchInstruction = 'Pick the animal with the same habitat, diet, and group.'
  const journalStamp = getExplorerRescueJournalStampIdForAnimalId(explorerAnimal.id)

  return {
    explorerAnimalId: explorerAnimal.id,
    explorerName: explorerAnimal.commonName,
    explorerVisualKey: explorerAnimal.visualKey ?? slugify(explorerAnimal.commonName),
    explorerFallbackEmoji: explorerAnimal.iconEmoji || '🐾',
    clueTraits,
    choices,
    rewards: { ...DEFAULT_RESCUE_REWARDS, journalStamp },
    matchInstruction,
  }
}
