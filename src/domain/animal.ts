import type { AnimalCategory, ConservationStatus, HabitatZone } from './enums'
import type { ImageAttribution } from './imageAttribution'

// ── Occurrence record ──────────────────────────────────────────────────────────
// A single recorded sighting/occurrence of an animal at a specific location.
// Used by the AnimalOccurrencesMap component to render Mapbox markers.
// NOTE: As of the updated API contract, the backend only returns latitude/longitude.
// locationName, observedAt, and notes are kept as optional for mock/legacy data only.
export interface AnimalOccurrence {
  id: string
  latitude: number
  longitude: number
  /** Present in legacy/mock data only. Not returned by the live API. */
  locationName?: string
  /** ISO 8601 date string. Present in legacy/mock data only. Not returned by the live API. */
  observedAt?: string
  notes?: string
}

// ── REST API DTO for occurrence (legacy mock shape) ────────────────────────────
export interface AnimalOccurrenceDTO {
  id: string
  latitude: number
  longitude: number
  location_name?: string
  observed_at?: string
  notes?: string
}

export function mapAnimalOccurrenceFromDTO(dto: AnimalOccurrenceDTO): AnimalOccurrence {
  return {
    id: dto.id,
    latitude: dto.latitude,
    longitude: dto.longitude,
    locationName: dto.location_name,
    observedAt: dto.observed_at,
    notes: dto.notes,
  }
}

// ── Map position ──────────────────────────────────────────────────────────────
// Positions are percentage (0-100) of the rendered map container width/height.
// `desktop` is required and applies to the landscape map.
// `mobile` is optional; falls back to `desktop` when absent.
export interface AnimalMapPosition {
  desktop: { x: number; y: number }
  mobile?: { x: number; y: number }
}

// ── Discover list row (API cards may omit backend id — see backendId) ───────────
export interface AnimalListItem {
  /** Stable key for list rendering (never guess API id from this) */
  listKey: string
  /** When set, detail + occurrences can be loaded via GET /animals/:id */
  backendId: string | null
  commonName: string
  scientificName: string
  category: AnimalCategory
  conservationStatus: ConservationStatus
  /** When present, PixelStatusBadge shows this label instead of STATUS_LABELS */
  statusLabelOverride?: string
  imageUrl?: string
  /** Backend avatar/sprite URL from Swagger (separate from imageUrl). */
  avatarPath?: string
  iconEmoji: string
  /** Decoupled visual asset key mapped from scientific/common names (e.g. 'sun-bear') */
  visualKey?: string
  /** Citation for merged list `imageUrl` when backend returns a hero URL */
  imageAttribution?: ImageAttribution
  /** When list returns a distinct avatar asset URL */
  avatarAttribution?: ImageAttribution
}

// ── Core Animal model ─────────────────────────────────────────────────────────
export interface Animal {
  id: string
  commonName: string
  scientificName: string
  category: AnimalCategory
  habitat: HabitatZone
  /**
   * Free-text habitat from the API (detail). When set, prefer this in UI over HABITAT_LABELS[habitat].
   */
  habitatDisplay?: string
  diet: string
  lifespan: string
  conservationStatus: ConservationStatus
  /** Backend label for conservation (detail); optional for mock-only data */
  conservationStatusLabel?: string
  /**
   * Conservation reason — present in legacy/mock data only.
   * Removed from the live API contract. Do not render if absent.
   */
  conservationReason?: string
  conservationExplanation: string
  description: string
  funFact: string
  iconEmoji: string
  /**
   * Optional key that maps to a sprite image in public/sprites/<key>.png.
   * When present, AnimalMarker will attempt to load a pixel-art sprite.
   * Falls back to iconEmoji if the asset cannot be loaded.
   */
  markerSpriteKey?: string
  /** Main species photo URL from backend detail (`imageUrl` field only); omit when absent. */
  animalPhotoUrl?: string
  /**
   * Merged hero URL = `animalPhotoUrl ?? avatarPath` for backwards compatibility.
   * For caption accuracy, combine with {@link animalPhotoUrl}/{@link avatarPath} attributions.
   */
  imageUrl?: string
  /** Backend avatar/sprite URL from Swagger (separate from main photo). */
  avatarPath?: string
  imageAttribution?: ImageAttribution
  avatarAttribution?: ImageAttribution
  audioUrl?: string
  mapPosition: AnimalMapPosition
  /**
   * Recorded occurrence sightings — used for the "View Occurrences on Map"
   * Mapbox feature. Empty array when no occurrences are recorded.
   */
  occurrences: AnimalOccurrence[]
  /** Structured list of threats from the API. Empty array when not loaded. */
  threats?: string[]
  /** Structured list of habitat names from the API. Empty array when not loaded. */
  habitats?: string[]
  /** Decoupled visual asset key mapped from scientific/common names (e.g. 'sun-bear') */
  visualKey?: string
}

// ── Lightweight map-marker shape ──────────────────────────────────────────────
export interface AnimalMapMarker {
  animalId: string
  commonName: string
  iconEmoji: string
  markerSpriteKey?: string
  conservationStatus: ConservationStatus
  habitat: HabitatZone
  category: AnimalCategory
  mapPosition: AnimalMapPosition
}

// ── REST API DTO ───────────────────────────────────────────────────────────────
export interface AnimalDTO {
  id: string
  common_name: string
  scientific_name: string
  category: string
  habitat: string
  diet: string
  lifespan: string
  conservation_status: string
  conservation_reason: string
  conservation_explanation: string
  description: string
  fun_fact: string
  icon_emoji: string
  marker_sprite_key?: string
  image_url?: string
  audio_url?: string
  // Desktop position (required)
  map_position_x: number
  map_position_y: number
  // Mobile position (optional — falls back to desktop when absent)
  map_position_mobile_x?: number
  map_position_mobile_y?: number
  // Occurrences (optional — gracefully absent when API doesn't yet return them)
  occurrences?: AnimalOccurrenceDTO[]
}

import { resolveAnimalVisualKey } from './animalVisuals'
import { finalizeImageAttribution } from './imageAttribution'

export function mapAnimalFromDTO(dto: AnimalDTO): Animal {
  const desktopPos = { x: dto.map_position_x, y: dto.map_position_y }
  const mobilePos =
    dto.map_position_mobile_x != null && dto.map_position_mobile_y != null
      ? { x: dto.map_position_mobile_x, y: dto.map_position_mobile_y }
      : undefined

  const img = dto.image_url?.trim()

  return {
    id: dto.id,
    commonName: dto.common_name,
    scientificName: dto.scientific_name,
    category: dto.category as AnimalCategory,
    habitat: dto.habitat as HabitatZone,
    diet: dto.diet,
    lifespan: dto.lifespan,
    conservationStatus: dto.conservation_status as ConservationStatus,
    conservationReason: dto.conservation_reason,
    conservationExplanation: dto.conservation_explanation,
    description: dto.description,
    funFact: dto.fun_fact,
    iconEmoji: dto.icon_emoji,
    markerSpriteKey: dto.marker_sprite_key,
    animalPhotoUrl: img,
    imageUrl: img,
    imageAttribution: img ? finalizeImageAttribution(undefined, img, 'BioWira image asset') : undefined,
    audioUrl: dto.audio_url,
    mapPosition: { desktop: desktopPos, mobile: mobilePos },
    occurrences: (dto.occurrences ?? []).map(mapAnimalOccurrenceFromDTO),
    visualKey: resolveAnimalVisualKey(dto.scientific_name, dto.common_name),
  }
}

/** Mock / full Animal → list row for Discover (always has backendId = animal.id) */
export function mapAnimalToListItem(animal: Animal): AnimalListItem {
  return {
    listKey: animal.id,
    backendId: animal.id,
    commonName: animal.commonName,
    scientificName: animal.scientificName,
    category: animal.category,
    conservationStatus: animal.conservationStatus,
    imageUrl: animal.imageUrl,
    avatarPath: animal.avatarPath,
    iconEmoji: animal.iconEmoji,
    visualKey: animal.visualKey,
    imageAttribution: animal.imageAttribution,
    avatarAttribution: animal.avatarAttribution,
  }
}
