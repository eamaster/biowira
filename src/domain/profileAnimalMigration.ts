/**
 * One place for legacy profile shape → current explorer-animal model.
 *
 * Old localStorage profiles used `avatarKey` (generic emoji presets: tiger, panda, …).
 * Those keys are not the same as domain animal ids or AnimalIcon registry keys.
 * We map them to the closest real BioWira animal where possible; unknown keys fall back
 * to DEFAULT_EXPLORER_ANIMAL_ID (lossy but never blank).
 *
 * Disallowed old explorer IDs (tapir, mousedeer, dugong, sea-turtle, sea-turtle-hawksbill)
 * are explicitly migrated to the default explorer to ensure they never appear in the UI.
 */
import { getAnimalIconUrl } from '@/app/iconRegistry'
import {
  EXPLORER_ANIMAL_CATALOG,
  findExplorerAnimalChoice,
} from '@/features/welcome/data/explorerAnimalCatalog'
import type { ChildProfile } from '@/domain/session'

/** Default when legacy key is unknown or data is corrupt — stable mascot id (not sort order). */
export const DEFAULT_EXPLORER_ANIMAL_ID =
  EXPLORER_ANIMAL_CATALOG.find((e) => e.backendAnimalId === 'malayan-tiger')?.backendAnimalId ??
  EXPLORER_ANIMAL_CATALOG[0]!.backendAnimalId

/**
 * Explorer IDs that are no longer allowed in the picker.
 * Any stored profile using these IDs will be migrated to the default explorer.
 */
const DISALLOWED_ANIMAL_IDS = new Set<string>([
  'tapir',
  'mousedeer',
  'dugong',
  'sea-turtle',
  'sea-turtle-hawksbill',
  'green-sea-turtle',
  'hawksbill-sea-turtle',
  'estuarine-crocodile',
])

/**
 * Best-effort map from old AVATAR_CATALOG keys to real explorer `animalId`.
 * All target values must be valid canonical catalog entries or approved aliases.
 * Several pairings are approximate (e.g. panda → sun-bear); documented here only.
 */
export const LEGACY_AVATAR_KEY_TO_ANIMAL_ID: Readonly<Record<string, string>> = {
  tiger: 'malayan-tiger',
  panda: 'sun-bear',
  owl: 'rhinoceros-hornbill',
  fox: 'proboscis-monkey',
  frog: 'proboscis-monkey',
  turtle: 'leatherback-sea-turtle',
  butterfly: 'sunda-pangolin',
  rabbit: 'proboscis-monkey',
  elephant: 'malayan-tiger',
  dolphin: 'leatherback-sea-turtle',
}

/** Raw profile as it may appear in localStorage (pre-migration or hybrid). */
export type LegacyStoredProfile = Partial<ChildProfile> & {
  profileId: string
  displayNickname: string
  leafPoints: number
  level: number
  levelTitle: string
  createdAt: string
  lastActiveAt: string
  guardianBackupLinked: boolean
  /** @deprecated Old preset only */
  avatarKey?: string
  /** Server-authoritative counters; present only after GET /profiles hydration */
  totalQuizzes?: number
  totalMissions?: number
  streakDays?: number
}

export function migrateChildProfile(raw: LegacyStoredProfile): ChildProfile {
  let animalId = raw.animalId
  let animalVisualKey = raw.animalVisualKey

  if (!animalId && raw.avatarKey) {
    animalId =
      LEGACY_AVATAR_KEY_TO_ANIMAL_ID[raw.avatarKey] ?? DEFAULT_EXPLORER_ANIMAL_ID
  }
  if (!animalId) {
    animalId = DEFAULT_EXPLORER_ANIMAL_ID
  }

  // Migrate disallowed old explorer IDs — they must never appear in the active UI.
  // Do this BEFORE the entry lookup so disallowed IDs are caught even if their
  // visual key still resolves an SVG (e.g. old 'tapir' SVG still exists in registry).
  if (DISALLOWED_ANIMAL_IDS.has(animalId)) {
    animalId = DEFAULT_EXPLORER_ANIMAL_ID
    animalVisualKey = undefined // force visual key to be resolved from the new catalog entry
  }
  if (animalVisualKey && DISALLOWED_ANIMAL_IDS.has(animalVisualKey)) {
    animalVisualKey = undefined
  }

  let entry = findExplorerAnimalChoice(animalId)
  if (!entry) {
    const vk = animalVisualKey
    if (vk && getAnimalIconUrl(vk) !== undefined) {
      // Backend-only explorer id (e.g. numeric API id) with a known icon — keep animalId
    } else {
      animalId = DEFAULT_EXPLORER_ANIMAL_ID
      entry = findExplorerAnimalChoice(animalId)!
    }
  }

  if (!animalVisualKey || getAnimalIconUrl(animalVisualKey) === undefined) {
    animalVisualKey = entry
      ? entry.animalVisualKey
      : findExplorerAnimalChoice(DEFAULT_EXPLORER_ANIMAL_ID)!.animalVisualKey
  }

  return {
    profileId: raw.profileId,
    displayNickname: raw.displayNickname,
    animalId,
    animalVisualKey,
    leafPoints: raw.leafPoints,
    level: raw.level,
    levelTitle: raw.levelTitle,
    lastAnimalId: raw.lastAnimalId,
    lastAnimalName: raw.lastAnimalName,
    lastQuizTitle: raw.lastQuizTitle,
    totalQuizzes: raw.totalQuizzes,
    totalMissions: raw.totalMissions,
    streakDays: raw.streakDays,
    createdAt: raw.createdAt,
    lastActiveAt: raw.lastActiveAt,
    guardianBackupLinked: raw.guardianBackupLinked,
  }
}

export function profileNeedsPersistenceRewrite(
  before: LegacyStoredProfile,
  after: ChildProfile,
): boolean {
  if (before.avatarKey !== undefined && before.avatarKey !== '') return true
  if (before.animalId !== after.animalId) return true
  if (before.animalVisualKey !== after.animalVisualKey) return true
  return false
}
