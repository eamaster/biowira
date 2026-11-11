/**
 * BioWira backend Animal API — wire shapes only. Components map through domain helpers.
 */

import { CATEGORY_EMOJI } from '@/app/config'
import { fromBackendCategoryLabel } from './animalCategoryMap'
import { conservationCodeToStatus } from './conservationMapping'
import type { Animal, AnimalListItem, AnimalOccurrence } from './animal'
import { HabitatZone } from './enums'
import { resolveAnimalVisualKey } from './animalVisuals'
import { finalizeImageAttribution } from './imageAttribution'

// ── List / card ───────────────────────────────────────────────────────────────

/** Paginated response wrapper from GET /api/v2/animals */
export interface PaginatedAnimalCardApiResponse {
  items: AnimalCardApiDto[]
  totalCount: number
}

export interface AnimalCardApiDto {
  id?: string | number
  /** Some API builds expose the row id here instead of `id`. */
  animalId?: string | number
  animal_id?: string | number
  commonName: string
  scientificName: string
  /** Renamed from `category` in the new API contract. */
  animalClass: string
  statusCode: string
  statusLabel: string
  imageUrl?: string
  /** Backend avatar/sprite path (Swagger: GET /animals response). Separate from imageUrl. */
  avatarPath?: string
  imageTitle?: string
  imageCreatorName?: string
  imageCreatorUrl?: string
  imageSourceName?: string
  imageSourceUrl?: string
  imageLicenseName?: string
  imageLicenseUrl?: string
  /** Future / flexible attribution payloads */
  imageAttribution?: unknown
  imageCitation?: unknown
  imageCredit?: string
  imageCreditLine?: string
  imageAuthor?: string
  imageAuthorUrl?: string
  imageSource?: string
  imageLicense?: string
  license?: string
  licenseUrl?: string
  attribution?: unknown
  citation?: unknown
  avatarAttribution?: unknown
  avatarCitation?: unknown
}

/**
 * GET /animals cards may use `id`, `animalId`, `animal_id`, or PascalCase variants.
 * Without this, {@link AnimalListItem.backendId} stays null and explorer picker drops rows.
 */
export function pickBackendIdFromAnimalCardWire(dto: unknown): string | null {
  if (!dto || typeof dto !== 'object') return null
  const o = dto as Record<string, unknown>
  const keys = ['id', 'animalId', 'animal_id', 'AnimalId', 'Id', 'animalID']
  for (const k of keys) {
    if (!(k in o)) continue
    const v = o[k]
    if (v != null && String(v).trim() !== '') return String(v)
  }
  return null
}

/** Stable list row key when the backend omits any known id (never used as an API animal id). */
export function buildAnimalListKeyFromCardDto(dto: AnimalCardApiDto): string {
  const bid = pickBackendIdFromAnimalCardWire(dto)
  if (bid != null) return bid
  const safe = (s: string) => encodeURIComponent(s.trim())
  return `list:${safe(dto.commonName)}|${safe(dto.scientificName)}|${safe(dto.animalClass)}`
}

function citationInputPrimaryFromAnimalCardDto(dto: AnimalCardApiDto): unknown {
  return {
    title: dto.imageTitle,
    author: dto.imageAuthor ?? dto.imageCreatorName,
    authorUrl: dto.imageAuthorUrl ?? dto.imageCreatorUrl,
    sourceName: dto.imageSource ?? dto.imageSourceName,
    sourceUrl: dto.imageSourceUrl,
    licenseName: dto.imageLicense ?? dto.imageLicenseName,
    licenseUrl: dto.imageLicenseUrl ?? dto.licenseUrl,
    imageCredit: dto.imageCredit,
    creditLine: dto.imageCreditLine,
    license: dto.license,
    imageAttribution: dto.imageAttribution,
    imageCitation: dto.imageCitation,
    attribution: dto.attribution,
    citation: dto.citation,
    imageCreditLine: dto.imageCreditLine,
  }
}

function citationInputAvatarFromAnimalCardDto(dto: AnimalCardApiDto): unknown {
  return {
    avatarAttribution: dto.avatarAttribution,
    avatarCitation: dto.avatarCitation,
    attribution: dto.attribution,
    citation: dto.citation,
  }
}

export function mapAnimalListItemFromCardApiDto(dto: AnimalCardApiDto): AnimalListItem {
  const category = fromBackendCategoryLabel(dto.animalClass)
  const status = conservationCodeToStatus(dto.statusCode)
  const backendId = pickBackendIdFromAnimalCardWire(dto)

  const photoUrl = dto.imageUrl?.trim()?.replace(/^https?:\/\/biowira\.dpdns\.org/, '') || undefined
  const avatarUrl = dto.avatarPath?.trim()?.replace(/^https?:\/\/biowira\.dpdns\.org/, '') || undefined

  const photoAttr = photoUrl
    ? finalizeImageAttribution(citationInputPrimaryFromAnimalCardDto(dto), photoUrl, 'BioWira image asset')
    : undefined
  const avAttr = avatarUrl
    ? finalizeImageAttribution(citationInputAvatarFromAnimalCardDto(dto), avatarUrl, 'BioWira avatar asset')
    : undefined

  /** List row retains merged hero URL for legacy consumers; citations stay split by source field */
  const mergedHeroAttribution = photoAttr ?? avAttr

  return {
    listKey: buildAnimalListKeyFromCardDto(dto),
    backendId,
    commonName: dto.commonName,
    scientificName: dto.scientificName,
    category,
    conservationStatus: status,
    statusLabelOverride: dto.statusLabel,
    imageUrl: photoUrl ?? avatarUrl,
    avatarPath: avatarUrl,
    iconEmoji: CATEGORY_EMOJI[category] ?? '🌿',
    visualKey: resolveAnimalVisualKey(dto.scientificName, dto.commonName),
    imageAttribution: mergedHeroAttribution,
    avatarAttribution: avAttr,
  }
}

// ── Detail ────────────────────────────────────────────────────────────────────

/** GET /animals/{id} — `habitats[]` entry (Swagger). */
export interface AnimalDetailHabitatEntryApiDto {
  habitatName: string
  priority?: string
  emoji?: string
}

/** GET /animals/{id} — `threats[]` entry (Swagger). */
export interface AnimalDetailThreatEntryApiDto {
  threatName: string
  explanation?: string
  priority?: string
}

/**
 * Wire habitats: live API returns objects; older mocks may use plain strings.
 */
export type AnimalDetailHabitatWire = string | AnimalDetailHabitatEntryApiDto

/**
 * Wire threats: live API returns objects; older mocks may use plain strings.
 */
export type AnimalDetailThreatWire = string | AnimalDetailThreatEntryApiDto

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

/** Normalizes habitat wire items to display names (no hardcoded habitat list). */
export function habitatNamesFromDetailWire(entries: AnimalDetailHabitatWire[] | undefined): string[] {
  if (!entries?.length) return []
  const out: string[] = []
  for (const entry of entries) {
    if (typeof entry === 'string') {
      const t = entry.trim()
      if (t) out.push(t)
      continue
    }
    if (isRecord(entry) && typeof entry.habitatName === 'string') {
      const t = entry.habitatName.trim()
      if (t) out.push(t)
    }
  }
  return out
}

/** Normalizes threat wire items to short labels for {@link Animal.threats}. */
export function threatNamesFromDetailWire(entries: AnimalDetailThreatWire[] | undefined): string[] {
  if (!entries?.length) return []
  const out: string[] = []
  for (const entry of entries) {
    if (typeof entry === 'string') {
      const t = entry.trim()
      if (t) out.push(t)
      continue
    }
    if (isRecord(entry) && typeof entry.threatName === 'string') {
      const t = entry.threatName.trim()
      if (t) out.push(t)
    }
  }
  return out
}

export interface AnimalDetailApiDto {
  commonName: string
  scientificName: string
  /** Renamed from `categoryName` in the new API contract. */
  className: string
  conservationCode: string
  conservationLabel: string
  conservationDescription: string
  imageUrl?: string
  /** Backend avatar/sprite path (Swagger: GET /animals/{animalId} response). */
  avatarPath?: string
  imageTitle?: string
  /** v2 creative-commons citation fields */
  imageCreatorName?: string
  imageCreatorUrl?: string
  imageSourceName?: string
  imageLicenseName?: string
  imageAttribution?: unknown
  imageCitation?: unknown
  imageCredit?: string
  imageCreditLine?: string
  imageAuthor?: string
  imageAuthorUrl?: string
  imageSource?: string
  imageSourceUrl?: string
  imageLicense?: string
  imageLicenseUrl?: string
  license?: string
  licenseUrl?: string
  attribution?: unknown
  citation?: unknown
  avatarAttribution?: unknown
  avatarCitation?: unknown
  severityOrder?: number
  /**
   * Structured habitats from the API (objects with `habitatName`) or legacy string rows.
   * @see https://api.biowira.dpdns.org/swagger/index.html
   */
  habitats?: AnimalDetailHabitatWire[]
  /**
   * Structured threats from the API (objects with `threatName`) or legacy string rows.
   */
  threats?: AnimalDetailThreatWire[]
  diet: string
  lifespan: string
  description: string
}

const DEFAULT_MAP_POSITION = { desktop: { x: 50, y: 50 }, mobile: { x: 50, y: 50 } }

/** Trim only — keeps API wording, strips incidental whitespace/newlines from JSON. */
function trimDetailField(s: string | undefined): string {
  return (s ?? '').trim()
}

function citationInputPhotoFromAnimalDetailDto(dto: AnimalDetailApiDto): unknown {
  return {
    title: dto.imageTitle,
    author: dto.imageAuthor ?? dto.imageCreatorName,
    authorUrl: dto.imageAuthorUrl ?? dto.imageCreatorUrl,
    sourceName: dto.imageSource ?? dto.imageSourceName,
    sourceUrl: dto.imageSourceUrl,
    licenseName: dto.imageLicense ?? dto.imageLicenseName,
    licenseUrl: dto.imageLicenseUrl ?? dto.licenseUrl,
    imageCredit: dto.imageCredit,
    creditLine: dto.imageCreditLine,
    license: dto.license,
    imageAttribution: dto.imageAttribution,
    imageCitation: dto.imageCitation,
    attribution: dto.attribution,
    citation: dto.citation,
    imageCreditLine: dto.imageCreditLine,
  }
}

function citationInputAvatarFromAnimalDetailDto(dto: AnimalDetailApiDto): unknown {
  return {
    avatarAttribution: dto.avatarAttribution,
    avatarCitation: dto.avatarCitation,
    attribution: dto.attribution,
    citation: dto.citation,
  }
}

export function mapAnimalDetailFromApiDto(dto: AnimalDetailApiDto, backendId: string): Animal {
  const category = fromBackendCategoryLabel(dto.className)
  const status = conservationCodeToStatus(dto.conservationCode)
  const habitatNames = habitatNamesFromDetailWire(dto.habitats)
  const threatNames = threatNamesFromDetailWire(dto.threats)
  const statusLabel = trimDetailField(dto.conservationLabel)
  const conservationText = trimDetailField(dto.conservationDescription)

  const photoUrl = dto.imageUrl?.trim()?.replace(/^https?:\/\/biowira\.dpdns\.org/, '') || undefined
  const avatarUrl = dto.avatarPath?.trim()?.replace(/^https?:\/\/biowira\.dpdns\.org/, '') || undefined

  const imageAttr = photoUrl
    ? finalizeImageAttribution(citationInputPhotoFromAnimalDetailDto(dto), photoUrl, 'BioWira image asset')
    : undefined
  const avAttr = avatarUrl
    ? finalizeImageAttribution(citationInputAvatarFromAnimalDetailDto(dto), avatarUrl, 'BioWira avatar asset')
    : undefined

  return {
    id: backendId,
    commonName: dto.commonName,
    scientificName: dto.scientificName,
    category,
    habitat: HabitatZone.Rainforest,
    habitatDisplay: habitatNames.length > 0 ? habitatNames.join(', ') : undefined,
    diet: dto.diet,
    lifespan: dto.lifespan,
    conservationStatus: status,
    conservationStatusLabel: statusLabel || undefined,
    conservationExplanation: conservationText,
    description: trimDetailField(dto.description),
    funFact: '',
    iconEmoji: CATEGORY_EMOJI[category] ?? '🌿',
    animalPhotoUrl: photoUrl,
    avatarPath: avatarUrl,
    imageUrl: photoUrl ?? avatarUrl,
    imageAttribution: imageAttr,
    avatarAttribution: avAttr,
    mapPosition: DEFAULT_MAP_POSITION,
    occurrences: [],
    threats: threatNames,
    habitats: habitatNames,
    visualKey: resolveAnimalVisualKey(dto.scientificName, dto.commonName)
  }
}

// ── Occurrence ────────────────────────────────────────────────────────────────

/** GET /animals/{id}/occurrences — now returns only coordinates. */
export interface AnimalOccurrenceApiDto {
  latitude: number
  longitude: number
}

export function mapAnimalOccurrenceFromApiDto(
  dto: AnimalOccurrenceApiDto,
  index: number,
): AnimalOccurrence {
  const id = `occ-api-${index}-${dto.latitude}-${dto.longitude}`
  return {
    id,
    latitude: dto.latitude,
    longitude: dto.longitude,
  }
}
