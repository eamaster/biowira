// ── LEGACY / TEST-ONLY ────────────────────────────────────────────────────────
//
// This module is DEPRECATED for production runtime use.
//
// Production code must use `loadExplorerRescueRound` from
// `./explorerRescueRoundBuilder` which derives all animal facts from the
// backend API. This file only exists so legacy unit tests can still import
// static round data for backward-compatibility checks.
//
// Do NOT import EXPLORER_RESCUE_ROUNDS, getRoundForExplorer, or resolveChoiceTraits
// from Vue pages, Pinia stores, or Phaser scenes.

import type { ExplorerRescueRound, RescueTrait } from '../game/types'
import { RESCUE_CLUE_REGISTRY, getClueById, clueIdsToTraits } from './explorerRescueClues'
import type { RescueClueId } from './explorerRescueClues'
import { getAnimalProfile, calcSharedClueIds } from './explorerRescueAnimalProfiles'

// ── Default rewards (shared across all rounds) ────────────────────────────────
const DEFAULT_RESCUE_REWARDS = {
  firstCompletionLeafPoints: 50,
  replayLeafPoints: 5,
  restorationIncrease: 15,
  journalStamp: 'wild-match-finder',
} as const

// ── Shared helper: resolve choice traits from animal profile ──────────────────
// Used by both the profile-based builder and legacy round definitions.
// Fails loudly in DEV when a profile is missing so data gaps are caught early.
function resolveChoiceTraits(animalId: string): RescueTrait[] {
  const profile = getAnimalProfile(animalId)
  if (!profile) {
    if (import.meta.env.DEV) {
      console.warn(`[ExplorerRescueRounds] No profile found for choice animal "${animalId}". choiceTraits will be empty.`)
    }
    return []
  }
  return clueIdsToTraits(profile.clueIds)
}

// ── Round builder (profile-based) ─────────────────────────────────────────────
interface BuildRoundOptions {
  explorerAnimalId: string
  choiceAnimalIds: [string, string, string]
  correctAnimalId: string
  rewards?: typeof DEFAULT_RESCUE_REWARDS
}

function createExplorerRescueRound({
  explorerAnimalId,
  choiceAnimalIds,
  correctAnimalId,
  rewards = DEFAULT_RESCUE_REWARDS,
}: BuildRoundOptions): ExplorerRescueRound {
  const explorerProfile = getAnimalProfile(explorerAnimalId)
  if (!explorerProfile) {
    throw new Error(`[ExplorerRescueRounds] No profile for explorer: ${explorerAnimalId}`)
  }

  // Build full clue trait objects from the explorer's clue IDs (reuse shared helper)
  const clueTraits: RescueTrait[] = clueIdsToTraits(explorerProfile.clueIds)

  // Build choices: sharedTraitIds (game logic) + choiceTraits (display)
  const choices = choiceAnimalIds.map((animalId) => {
    const profile = getAnimalProfile(animalId)
    if (!profile) {
      throw new Error(`[ExplorerRescueRounds] No profile for choice animal: ${animalId}`)
    }
    const sharedTraitIds = calcSharedClueIds(explorerProfile.clueIds, profile.clueIds)
    return {
      animalId: profile.animalId,
      name: profile.commonName,
      visualKey: profile.visualKey,
      fallbackEmoji: profile.fallbackEmoji,
      choiceTraits: clueIdsToTraits(profile.clueIds),
      sharedTraitIds,
      isCorrect: animalId === correctAnimalId,
    }
  })

  return {
    explorerAnimalId: explorerProfile.animalId,
    explorerName: explorerProfile.commonName,
    explorerVisualKey: explorerProfile.visualKey,
    explorerFallbackEmoji: explorerProfile.fallbackEmoji,
    clueTraits,
    choices,
    rewards,
  }
}

// ── Legacy trait builder (for rounds without full profile coverage) ────────────
function legacyTrait(id: string, label: string, emoji: string): RescueTrait {
  const registryClue = RESCUE_CLUE_REGISTRY[id as RescueClueId]
  return {
    id,
    label,
    emoji,
    iconPath: registryClue?.iconPath || undefined,
  }
}

// ── Shorthand for legacy clue IDs ──────────────────────────────────────────────
const LEGACY_TRAITS: Record<string, RescueTrait> = {
  rainforest:   legacyTrait('rainforest',   'Rainforest',   '🌳'),
  river:        legacyTrait('river',        'River',        '🌊'),
  ocean:        legacyTrait('ocean',        'Ocean',        '🌊'),
  mangrove:     legacyTrait('mangrove',     'Mangrove',     '🌿'),
  carnivore:    legacyTrait('carnivore',    'Carnivore',    '🥩'),
  herbivore:    legacyTrait('herbivore',    'Herbivore',    '🥬'),
  omnivore:     legacyTrait('omnivore',     'Omnivore',     '🍎'),
  habitatLoss:  legacyTrait('habitatLoss',  'Habitat Loss', '🪵'),
  pollution:    legacyTrait('pollution',    'Pollution',    '♻️'),
  poaching:     legacyTrait('poaching',     'Poaching',     '⚠️'),
  fishingGear:  legacyTrait('fishingGear',  'Fishing Gear', '🎣'),
}
const t = LEGACY_TRAITS

// ── Round data ────────────────────────────────────────────────────────────────
// Round 1 uses the profile-based builder (exact, tested clues).
// Rounds 2–12 are legacy. All choices have choiceTraits resolved from profiles.

const ROUNDS: ExplorerRescueRound[] = [

  // ── Round 1: Malayan Tiger (profile-based) ────────────────────────────────
  createExplorerRescueRound({
    explorerAnimalId: 'malayan-tiger',
    choiceAnimalIds: ['sun-bear', 'hornbill', 'sea-turtle'],
    correctAnimalId: 'sun-bear',
    rewards: DEFAULT_RESCUE_REWARDS,
  }),

  // ── Round 2: Orangutan (profile-based) ───────────────────────────────────
  // Explorer clues: Forest, Omnivore, Mammals (from orangutan profile)
  // Correct match: Sun Bear (shares Forest + Mammals)
  createExplorerRescueRound({
    explorerAnimalId: 'orangutan',
    choiceAnimalIds: ['sun-bear', 'dugong', 'crocodile'],
    correctAnimalId: 'sun-bear',
    rewards: DEFAULT_RESCUE_REWARDS,
  }),

  // ── Round 3: Proboscis Monkey (legacy) ───────────────────────────────────
  {
    explorerAnimalId: 'proboscis-monkey',
    explorerName: 'Proboscis Monkey',
    explorerVisualKey: 'proboscis-monkey',
    explorerFallbackEmoji: '🐒',
    clueTraits: [t.mangrove, t.herbivore, t.habitatLoss],
    choices: [
      {
        animalId: 'mousedeer',
        name: 'Mousedeer',
        visualKey: 'mousedeer',
        fallbackEmoji: '🦌',
        choiceTraits: resolveChoiceTraits('mousedeer'),
        sharedTraitIds: ['mangrove', 'herbivore', 'habitatLoss'],
        isCorrect: true,
      },
      {
        animalId: 'malayan-tiger',
        name: 'Malayan Tiger',
        visualKey: 'malayan-tiger',
        fallbackEmoji: '🐯',
        choiceTraits: resolveChoiceTraits('malayan-tiger'),
        sharedTraitIds: ['carnivore'],
        isCorrect: false,
      },
      {
        animalId: 'sea-turtle',
        name: 'Green Sea Turtle',
        visualKey: 'sea-turtle',
        fallbackEmoji: '🐢',
        choiceTraits: resolveChoiceTraits('sea-turtle'),
        sharedTraitIds: ['ocean'],
        isCorrect: false,
      },
    ],
    rewards: DEFAULT_RESCUE_REWARDS,
  },

  // ── Round 4: Hornbill (legacy) ────────────────────────────────────────────
  {
    explorerAnimalId: 'hornbill',
    explorerName: 'Hornbill',
    explorerVisualKey: 'hornbill',
    explorerFallbackEmoji: '🐦',
    clueTraits: [t.rainforest, t.omnivore, t.habitatLoss],
    choices: [
      {
        animalId: 'orangutan',
        name: 'Orangutan',
        visualKey: 'orangutan',
        fallbackEmoji: '🦧',
        choiceTraits: resolveChoiceTraits('orangutan'),
        sharedTraitIds: ['habitat_forest', 'diet_omnivore'],
        isCorrect: true,
      },
      {
        animalId: 'crocodile',
        name: 'Crocodile',
        visualKey: 'crocodile',
        fallbackEmoji: '🐊',
        choiceTraits: resolveChoiceTraits('crocodile'),
        sharedTraitIds: ['carnivore'],
        isCorrect: false,
      },
      {
        animalId: 'dugong',
        name: 'Dugong',
        visualKey: 'dugong',
        fallbackEmoji: '🐬',
        choiceTraits: resolveChoiceTraits('dugong'),
        sharedTraitIds: ['ocean'],
        isCorrect: false,
      },
    ],
    rewards: DEFAULT_RESCUE_REWARDS,
  },

  // ── Round 5: Sun Bear (legacy) ────────────────────────────────────────────
  {
    explorerAnimalId: 'sun-bear',
    explorerName: 'Sun Bear',
    explorerVisualKey: 'sun-bear',
    explorerFallbackEmoji: '🐻',
    clueTraits: [t.rainforest, t.omnivore, t.habitatLoss],
    choices: [
      {
        animalId: 'malayan-tiger',
        name: 'Malayan Tiger',
        visualKey: 'malayan-tiger',
        fallbackEmoji: '🐯',
        choiceTraits: resolveChoiceTraits('malayan-tiger'),
        sharedTraitIds: ['rainforest', 'omnivore', 'habitatLoss'],
        isCorrect: true,
      },
      {
        animalId: 'sea-turtle-hawksbill',
        name: 'Hawksbill Sea Turtle',
        visualKey: 'sea-turtle-hawksbill',
        fallbackEmoji: '🐢',
        choiceTraits: resolveChoiceTraits('sea-turtle-hawksbill'),
        sharedTraitIds: ['ocean'],
        isCorrect: false,
      },
      {
        animalId: 'dugong',
        name: 'Dugong',
        visualKey: 'dugong',
        fallbackEmoji: '🐬',
        choiceTraits: resolveChoiceTraits('dugong'),
        sharedTraitIds: ['ocean'],
        isCorrect: false,
      },
    ],
    rewards: DEFAULT_RESCUE_REWARDS,
  },

  // ── Round 6: Tapir (legacy) ───────────────────────────────────────────────
  {
    explorerAnimalId: 'tapir',
    explorerName: 'Tapir',
    explorerVisualKey: 'tapir',
    explorerFallbackEmoji: '🐾',
    clueTraits: [t.rainforest, t.herbivore, t.habitatLoss],
    choices: [
      {
        animalId: 'proboscis-monkey',
        name: 'Proboscis Monkey',
        visualKey: 'proboscis-monkey',
        fallbackEmoji: '🐒',
        choiceTraits: resolveChoiceTraits('proboscis-monkey'),
        sharedTraitIds: ['rainforest', 'herbivore', 'habitatLoss'],
        isCorrect: true,
      },
      {
        animalId: 'crocodile',
        name: 'Crocodile',
        visualKey: 'crocodile',
        fallbackEmoji: '🐊',
        choiceTraits: resolveChoiceTraits('crocodile'),
        sharedTraitIds: ['river', 'carnivore'],
        isCorrect: false,
      },
      {
        animalId: 'hornbill',
        name: 'Hornbill',
        visualKey: 'hornbill',
        fallbackEmoji: '🐦',
        choiceTraits: resolveChoiceTraits('hornbill'),
        sharedTraitIds: ['rainforest'],
        isCorrect: false,
      },
    ],
    rewards: DEFAULT_RESCUE_REWARDS,
  },

  // ── Round 7: Pangolin (legacy) ────────────────────────────────────────────
  {
    explorerAnimalId: 'pangolin',
    explorerName: 'Pangolin',
    explorerVisualKey: 'pangolin',
    explorerFallbackEmoji: '🦔',
    clueTraits: [t.rainforest, t.carnivore, t.poaching],
    choices: [
      {
        animalId: 'malayan-tiger',
        name: 'Malayan Tiger',
        visualKey: 'malayan-tiger',
        fallbackEmoji: '🐯',
        choiceTraits: resolveChoiceTraits('malayan-tiger'),
        sharedTraitIds: ['rainforest', 'carnivore', 'poaching'],
        isCorrect: true,
      },
      {
        animalId: 'dugong',
        name: 'Dugong',
        visualKey: 'dugong',
        fallbackEmoji: '🐬',
        choiceTraits: resolveChoiceTraits('dugong'),
        sharedTraitIds: ['ocean'],
        isCorrect: false,
      },
      {
        animalId: 'sea-turtle',
        name: 'Green Sea Turtle',
        visualKey: 'sea-turtle',
        fallbackEmoji: '🐢',
        choiceTraits: resolveChoiceTraits('sea-turtle'),
        sharedTraitIds: ['ocean', 'poaching'],
        isCorrect: false,
      },
    ],
    rewards: DEFAULT_RESCUE_REWARDS,
  },

  // ── Round 8: Green Sea Turtle (legacy) ───────────────────────────────────
  {
    explorerAnimalId: 'sea-turtle',
    explorerName: 'Green Sea Turtle',
    explorerVisualKey: 'sea-turtle',
    explorerFallbackEmoji: '🐢',
    clueTraits: [t.ocean, t.fishingGear, t.pollution],
    choices: [
      {
        animalId: 'dugong',
        name: 'Dugong',
        visualKey: 'dugong',
        fallbackEmoji: '🐬',
        choiceTraits: resolveChoiceTraits('dugong'),
        sharedTraitIds: ['ocean', 'fishingGear', 'pollution'],
        isCorrect: true,
      },
      {
        animalId: 'malayan-tiger',
        name: 'Malayan Tiger',
        visualKey: 'malayan-tiger',
        fallbackEmoji: '🐯',
        choiceTraits: resolveChoiceTraits('malayan-tiger'),
        sharedTraitIds: ['carnivore'],
        isCorrect: false,
      },
      {
        animalId: 'orangutan',
        name: 'Orangutan',
        visualKey: 'orangutan',
        fallbackEmoji: '🦧',
        choiceTraits: resolveChoiceTraits('orangutan'),
        sharedTraitIds: ['diet_omnivore'],
        isCorrect: false,
      },
    ],
    rewards: DEFAULT_RESCUE_REWARDS,
  },

  // ── Round 9: Hawksbill Sea Turtle (legacy) ────────────────────────────────
  {
    explorerAnimalId: 'sea-turtle-hawksbill',
    explorerName: 'Hawksbill Sea Turtle',
    explorerVisualKey: 'sea-turtle-hawksbill',
    explorerFallbackEmoji: '🐢',
    clueTraits: [t.ocean, t.fishingGear, t.poaching],
    choices: [
      {
        animalId: 'sea-turtle',
        name: 'Green Sea Turtle',
        visualKey: 'sea-turtle',
        fallbackEmoji: '🐢',
        choiceTraits: resolveChoiceTraits('sea-turtle'),
        sharedTraitIds: ['ocean', 'fishingGear', 'poaching'],
        isCorrect: true,
      },
      {
        animalId: 'tapir',
        name: 'Tapir',
        visualKey: 'tapir',
        fallbackEmoji: '🐾',
        choiceTraits: resolveChoiceTraits('tapir'),
        sharedTraitIds: ['herbivore'],
        isCorrect: false,
      },
      {
        animalId: 'proboscis-monkey',
        name: 'Proboscis Monkey',
        visualKey: 'proboscis-monkey',
        fallbackEmoji: '🐒',
        choiceTraits: resolveChoiceTraits('proboscis-monkey'),
        sharedTraitIds: ['mangrove'],
        isCorrect: false,
      },
    ],
    rewards: DEFAULT_RESCUE_REWARDS,
  },

  // ── Round 10: Dugong (legacy) ─────────────────────────────────────────────
  {
    explorerAnimalId: 'dugong',
    explorerName: 'Dugong',
    explorerVisualKey: 'dugong',
    explorerFallbackEmoji: '🐬',
    clueTraits: [t.ocean, t.herbivore, t.pollution],
    choices: [
      {
        animalId: 'sea-turtle',
        name: 'Green Sea Turtle',
        visualKey: 'sea-turtle',
        fallbackEmoji: '🐢',
        choiceTraits: resolveChoiceTraits('sea-turtle'),
        sharedTraitIds: ['ocean', 'herbivore', 'pollution'],
        isCorrect: true,
      },
      {
        animalId: 'malayan-tiger',
        name: 'Malayan Tiger',
        visualKey: 'malayan-tiger',
        fallbackEmoji: '🐯',
        choiceTraits: resolveChoiceTraits('malayan-tiger'),
        sharedTraitIds: ['carnivore'],
        isCorrect: false,
      },
      {
        animalId: 'pangolin',
        name: 'Pangolin',
        visualKey: 'pangolin',
        fallbackEmoji: '🦔',
        choiceTraits: resolveChoiceTraits('pangolin'),
        sharedTraitIds: ['poaching'],
        isCorrect: false,
      },
    ],
    rewards: DEFAULT_RESCUE_REWARDS,
  },

  // ── Round 11: Crocodile (legacy) ──────────────────────────────────────────
  {
    explorerAnimalId: 'crocodile',
    explorerName: 'Crocodile',
    explorerVisualKey: 'crocodile',
    explorerFallbackEmoji: '🐊',
    clueTraits: [t.river, t.carnivore, t.habitatLoss],
    choices: [
      {
        animalId: 'malayan-tiger',
        name: 'Malayan Tiger',
        visualKey: 'malayan-tiger',
        fallbackEmoji: '🐯',
        choiceTraits: resolveChoiceTraits('malayan-tiger'),
        sharedTraitIds: ['carnivore', 'habitatLoss'],
        isCorrect: false,
      },
      {
        animalId: 'tapir',
        name: 'Tapir',
        visualKey: 'tapir',
        fallbackEmoji: '🐾',
        choiceTraits: resolveChoiceTraits('tapir'),
        sharedTraitIds: ['river', 'habitatLoss'],
        isCorrect: false,
      },
      {
        animalId: 'proboscis-monkey',
        name: 'Proboscis Monkey',
        visualKey: 'proboscis-monkey',
        fallbackEmoji: '🐒',
        choiceTraits: resolveChoiceTraits('proboscis-monkey'),
        sharedTraitIds: ['river', 'carnivore', 'habitatLoss'],
        isCorrect: true,
      },
    ],
    rewards: DEFAULT_RESCUE_REWARDS,
  },

  // ── Round 12: Mousedeer (legacy) ──────────────────────────────────────────
  {
    explorerAnimalId: 'mousedeer',
    explorerName: 'Mousedeer',
    explorerVisualKey: 'mousedeer',
    explorerFallbackEmoji: '🦌',
    clueTraits: [t.rainforest, t.herbivore, t.habitatLoss],
    choices: [
      {
        animalId: 'tapir',
        name: 'Tapir',
        visualKey: 'tapir',
        fallbackEmoji: '🐾',
        choiceTraits: resolveChoiceTraits('tapir'),
        sharedTraitIds: ['rainforest', 'herbivore', 'habitatLoss'],
        isCorrect: true,
      },
      {
        animalId: 'dugong',
        name: 'Dugong',
        visualKey: 'dugong',
        fallbackEmoji: '🐬',
        choiceTraits: resolveChoiceTraits('dugong'),
        sharedTraitIds: ['ocean'],
        isCorrect: false,
      },
      {
        animalId: 'crocodile',
        name: 'Crocodile',
        visualKey: 'crocodile',
        fallbackEmoji: '🐊',
        choiceTraits: resolveChoiceTraits('crocodile'),
        sharedTraitIds: ['carnivore'],
        isCorrect: false,
      },
    ],
    rewards: DEFAULT_RESCUE_REWARDS,
  },
]

const FALLBACK_ROUND: ExplorerRescueRound = ROUNDS[0]!

const roundsByExplorer = new Map<string, ExplorerRescueRound>(
  ROUNDS.map((r) => [r.explorerAnimalId, r]),
)

export function getRoundForExplorer(explorerAnimalId: string): ExplorerRescueRound {
  return roundsByExplorer.get(explorerAnimalId) ?? FALLBACK_ROUND
}

export { ROUNDS as EXPLORER_RESCUE_ROUNDS }

// Export helper so other modules (Phaser scene, tests) can resolve choice traits
// from a profile without re-implementing the mapping.
export { resolveChoiceTraits }

// Suppress unused import — getClueById is re-exported via clueIdsToTraits but
// needed here for the RESCUE_CLUE_REGISTRY access in legacyTrait()
void getClueById
