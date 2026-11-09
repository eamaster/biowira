// ============================================================
// BioWira Fun Fact Domain Types
// ============================================================

import type { ImageAttribution } from './imageAttribution'
import { finalizeImageAttribution } from './imageAttribution'

/**
 * Domain model used in Vue templates and stores.
 * Produced by the repository mappers from the live API response.
 */
export interface FunFact {
  id: string
  animalId: string
  /** Animal common name — enriched from the /animals list */
  animalName: string
  /** Emoji for the animal/fact icon. Sourced from the API `emoji` field, or category fallback. */
  animalEmoji: string
  /**
   * Decoupled visual key for the AnimalIcon component (e.g. "malayan-tiger").
   * NOT the numeric backend animal id. Enriched from GET /animals.
   */
  animalVisualKey?: string
  /** Animal image URL for back-face image fallback. Enriched from GET /animals. */
  animalImageUrl?: string
  /**
   * Optional title field. Present in mock data for backward compat.
   * NOT returned by the live backend API; components must not require this field.
   */
  title?: string
  factText: string
  unlockLevel: number
  /** Backend display order for this fact within the animal's list. Mapped from `factOrder`. */
  factOrder?: number
  /** URL to the fact image. Mapped from `factImageUrl` in the live API. */
  imageUrl?: string
  imageAttribution?: ImageAttribution
  animalImageAttribution?: ImageAttribution
  /** Rank/sort order — present in mock data only; not returned by live API */
  rank?: number
  /** Hot-fact flag — present in mock data only; not returned by live API */
  isHot?: boolean
  /**
   * Lock state from legacy mock data only.
   * NOT returned by the live API — removed from the backend contract.
   * Use `resolveFunFactAccessState()` from funFactAccess.ts which uses
   * `accessStatus`, `levelsNeeded`, and `userLevel` for authoritative resolution.
   */
  isLocked?: boolean
  /** Backend access status string — highest-priority signal for lock resolution */
  accessStatus?: string
  /** How many more levels the user needs to unlock this fact */
  levelsNeeded?: number
  /** User's current level from backend response — used in access resolver */
  userLevel?: number
  /** Whether the profile has already seen/acknowledged this fact (from backend) */
  alreadyUnlocked?: boolean
}

// ── Live API DTO (GET /api/animals/{animalId}/fun-facts) ──────────────────────
// These are the exact camelCase field names the backend returns.
// The response is per-animal and personalised to the authenticated profile.

export interface FunFactApiDto {
  /** Backend fact id */
  id: string | number
  /** Emoji associated with the fact or animal */
  emoji?: string
  /** The fact body text */
  factText: string
  /** URL for the fact illustration */
  factImageUrl?: string
  factImageAttribution?: unknown
  factImageCitation?: unknown
  factImageCredit?: string
  factImageSource?: string
  factImageSourceUrl?: string
  factImageLicense?: string
  factImageLicenseUrl?: string
  /** Sort order within the animal's fact list */
  factOrder?: number
  /** Minimum level required to unlock (1-based). Renamed from `unlockLevel` in new contract. */
  unlockLevelNumber: number
  /** Human-readable access status (e.g. "unlocked", "locked", "available") */
  accessStatus?: string
  /** Additional levels this profile needs before unlocking */
  levelsNeeded?: number
  /** Current level of the authenticated profile (informational) */
  userLevel?: number
  /** Current points of the authenticated profile (informational) */
  userPoints?: number
  /** Whether the profile has already seen/acknowledged this fact */
  alreadyUnlocked?: boolean
}

/**
 * Map a live API fun-fact DTO to the domain model.
 * Animal context must be passed because the per-animal endpoint does not
 * repeat animal name/emoji in every fact item.
 *
 * NOTE: `isLocked` is no longer returned by the API. Use `resolveFunFactAccessState()`
 * from funFactAccess.ts which relies on `accessStatus`, `levelsNeeded`, and `userLevel`.
 */
export function mapFunFactFromApiDto(
  dto: FunFactApiDto,
  animalContext: {
    id: string
    commonName: string
    categoryEmoji: string
    visualKey?: string
    imageUrl?: string
    imageAttribution?: ImageAttribution
  },
): FunFact {
  const factUrl = dto.factImageUrl?.trim() || undefined
  const factBlob = {
    factImageAttribution: dto.factImageAttribution,
    factImageCitation: dto.factImageCitation,
    factImageCredit: dto.factImageCredit,
    factImageSource: dto.factImageSource,
    factImageSourceUrl: dto.factImageSourceUrl,
    factImageLicense: dto.factImageLicense,
    factImageLicenseUrl: dto.factImageLicenseUrl,
  }
  const imageAttribution = factUrl
    ? finalizeImageAttribution(factBlob, factUrl, 'BioWira fact image')
    : undefined

  const animalUrl = animalContext.imageUrl?.trim() || undefined
  const animalImageAttribution =
    animalContext.imageAttribution ??
    (animalUrl ? finalizeImageAttribution(undefined, animalUrl, 'BioWira image asset') : undefined)

  return {
    id: String(dto.id),
    animalId: animalContext.id,
    animalName: animalContext.commonName,
    animalEmoji: dto.emoji ?? animalContext.categoryEmoji,
    animalVisualKey: animalContext.visualKey,
    animalImageUrl: animalUrl,
    animalImageAttribution,
    factText: dto.factText ?? '',
    unlockLevel: dto.unlockLevelNumber ?? 1,
    factOrder: dto.factOrder,
    imageUrl: factUrl,
    imageAttribution,
    accessStatus: dto.accessStatus,
    levelsNeeded: dto.levelsNeeded,
    userLevel: dto.userLevel,
    alreadyUnlocked: dto.alreadyUnlocked,
  }
}

// ── Legacy mock DTO (snake_case, used by mock data only) ──────────────────────
// Kept for backward compat with MOCK_FUN_FACTS data and unit tests.
// Do NOT use this for the live API.

export interface FunFactDTO {
  id: string
  animal_id: string
  animal_name: string
  animal_emoji: string
  title: string
  fact_text: string
  /** Ignored */
  likes?: number
  /** Ignored */
  is_liked_by_user?: boolean
  rank?: number
  is_hot?: boolean
  unlock_level: number
  image_url?: string
}

/** Map the legacy mock DTO to FunFact. Only used by MockFunFactRepository. */
export function mapFunFactFromDTO(dto: FunFactDTO): FunFact {
  const factUrl = dto.image_url?.trim() || undefined
  return {
    id: dto.id,
    animalId: dto.animal_id,
    animalName: dto.animal_name,
    animalEmoji: dto.animal_emoji,
    title: dto.title,
    factText: dto.fact_text,
    unlockLevel: dto.unlock_level ?? 1,
    imageUrl: factUrl,
    imageAttribution: factUrl
      ? finalizeImageAttribution(undefined, factUrl, 'BioWira fact image')
      : undefined,
    isLocked: undefined, // mock mode: use level-based check in useFunFactUnlocks
  }
}
