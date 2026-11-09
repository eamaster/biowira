// ── LEGACY / TEST-ONLY ────────────────────────────────────────────────────────
//
// This module is DEPRECATED for production runtime use.
//
// The biological facts (habitat, diet, group) for all animals are now derived
// exclusively from the backend API via `buildRescueTraitsFromAnimal` in
// `./rescueTraitResolver.ts`. This file must NOT be imported by any Vue page,
// Pinia store, or Phaser scene for runtime data.
//
// It is retained only so existing tests that check the profile registry
// continue to compile.
//
// ── Explorer Rescue Run — Centralized Animal Profiles ────────────────────────
//
// Each profile defines an animal's clue fingerprint. The round builder uses
// these profiles to:
//   1. Build the explorer's clueTraits list.
//   2. Auto-calculate sharedTraitIds for each choice animal by intersecting
//      the explorer's clueIds with the choice animal's clueIds.
//
// Adding a new animal: add a profile entry and import it in explorerRescueRounds.ts.

import type { RescueClueId } from './explorerRescueClues'

export interface AnimalRescueProfile {
  /** Unique ID matching the animal IDs used in round data. */
  animalId: string
  /** Human-readable display name. */
  commonName: string
  /** Visual key used to look up discovery icons and explorer SVGs. */
  visualKey: string
  /** Emoji fallback when no icon image can load. */
  fallbackEmoji: string
  /** Ordered list of 3 clue IDs that describe this animal. */
  clueIds: [RescueClueId, RescueClueId, RescueClueId]
}

// ── Animal profile registry ───────────────────────────────────────────────────
export const ANIMAL_RESCUE_PROFILES: Readonly<Record<string, AnimalRescueProfile>> = Object.freeze({
  'malayan-tiger': {
    animalId: 'malayan-tiger',
    commonName: 'Malayan Tiger',
    visualKey: 'malayan-tiger',
    fallbackEmoji: '🐯',
    clueIds: ['habitat_forest', 'diet_carnivore', 'group_mammal'],
  },
  'sun-bear': {
    animalId: 'sun-bear',
    commonName: 'Sun Bear',
    visualKey: 'sun-bear',
    fallbackEmoji: '🐻',
    clueIds: ['habitat_forest', 'diet_carnivore', 'group_mammal'],
  },
  hornbill: {
    animalId: 'hornbill',
    commonName: 'Hornbill',
    visualKey: 'hornbill',
    fallbackEmoji: '🐦',
    clueIds: ['habitat_forest', 'diet_omnivore', 'group_bird'],
  },
  'sea-turtle': {
    animalId: 'sea-turtle',
    commonName: 'Green Sea Turtle',
    visualKey: 'sea-turtle',
    fallbackEmoji: '🐢',
    clueIds: ['habitat_ocean', 'diet_omnivore', 'group_marine'],
  },
  orangutan: {
    animalId: 'orangutan',
    commonName: 'Orangutan',
    visualKey: 'orangutan',
    fallbackEmoji: '🦧',
    clueIds: ['habitat_forest', 'diet_omnivore', 'group_mammal'],
  },
  'proboscis-monkey': {
    animalId: 'proboscis-monkey',
    commonName: 'Proboscis Monkey',
    visualKey: 'proboscis-monkey',
    fallbackEmoji: '🐒',
    clueIds: ['habitat_mangrove', 'diet_herbivore', 'group_mammal'],
  },
  mousedeer: {
    animalId: 'mousedeer',
    commonName: 'Mousedeer',
    visualKey: 'mousedeer',
    fallbackEmoji: '🦌',
    clueIds: ['habitat_mangrove', 'diet_herbivore', 'group_mammal'],
  },
  tapir: {
    animalId: 'tapir',
    commonName: 'Tapir',
    visualKey: 'tapir',
    fallbackEmoji: '🐾',
    clueIds: ['habitat_forest', 'diet_herbivore', 'group_mammal'],
  },
  pangolin: {
    animalId: 'pangolin',
    commonName: 'Pangolin',
    visualKey: 'pangolin',
    fallbackEmoji: '🦔',
    clueIds: ['habitat_forest', 'diet_carnivore', 'threat_poaching'],
  },
  dugong: {
    animalId: 'dugong',
    commonName: 'Dugong',
    visualKey: 'dugong',
    fallbackEmoji: '🐬',
    clueIds: ['habitat_ocean', 'diet_herbivore', 'group_marine'],
  },
  'sea-turtle-hawksbill': {
    animalId: 'sea-turtle-hawksbill',
    commonName: 'Hawksbill Sea Turtle',
    visualKey: 'sea-turtle-hawksbill',
    fallbackEmoji: '🐢',
    clueIds: ['habitat_ocean', 'diet_omnivore', 'threat_poaching'],
  },
  crocodile: {
    animalId: 'crocodile',
    commonName: 'Crocodile',
    visualKey: 'crocodile',
    fallbackEmoji: '🐊',
    clueIds: ['habitat_river', 'diet_carnivore', 'threat_habitat_loss'],
  },
})

/**
 * Get a profile by animal ID. Returns undefined if not registered.
 */
export function getAnimalProfile(animalId: string): AnimalRescueProfile | undefined {
  return ANIMAL_RESCUE_PROFILES[animalId]
}

/**
 * Calculate the shared clue IDs between two animals by intersecting their clueIds arrays.
 */
export function calcSharedClueIds(explorerClueIds: readonly RescueClueId[], choiceClueIds: readonly RescueClueId[]): RescueClueId[] {
  const explorerSet = new Set<RescueClueId>(explorerClueIds)
  return choiceClueIds.filter((id) => explorerSet.has(id))
}
