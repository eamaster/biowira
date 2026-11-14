import { resolveAnimalVisualKey } from './animalVisuals'
import type { ImageAttribution } from './imageAttribution'

const LEGACY_MEDIA_HOSTS = new Set(['biowira.dpdns.org', 'api.biowira.dpdns.org'])
const LOCAL_ASSET_PREFIXES = ['/all_assets/', '/avatars/', '/assets/'] as const

/** Ordered wildlife-0..wildlife-30 species keys matching public/all_assets/wildlife-*.webp. */
const WILDLIFE_ASSET_KEYS: readonly string[] = [
  'malayan-tiger',
  'sun-bear',
  'bornean-orangutan',
  'larut-torrent-frog',
  'oriental-pied-hornbill',
  'great-argus',
  'rhinoceros-hornbill',
  'paradise-flying-snake',
  'saltwater-crocodile',
  'little-mapwing',
  'monarch-butterfly',
  'leatherback-sea-turtle',
  'asian-common-toad',
  'bornean-pygmy-elephant',
  'black-crowned-pitta',
  'common-grass-yellow',
  'kuhls-flying-gecko',
  'kissing-gourami',
  'spiny-terrapin',
  'tiger-tail-seahorse',
  'asian-painted-frog',
  'sunda-pangolin',
  'long-nosed-horned-frog',
  'proboscis-monkey',
  'slender-skimmer',
  'guppy',
  'wallaces-flying-frog',
  'whale-shark',
  'crested-partridge',
  'scalloped-hammerhead',
  'malayan-birdwing',
]

const WILDLIFE_KEY_ALIASES: Record<string, string> = {
  orangutan: 'bornean-orangutan',
  hornbill: 'rhinoceros-hornbill',
  crocodile: 'saltwater-crocodile',
  'estuarine-crocodile': 'saltwater-crocodile',
  monarch: 'monarch-butterfly',
  pangolin: 'sunda-pangolin',
  tiger: 'malayan-tiger',
  'sunbear': 'sun-bear',
}

const WILDLIFE_ID_TO_INDEX: Record<string, number> = {
  '1': 0,
  '3': 1,
  '4': 2,
  '5': 3,
  '6': 4,
  '7': 5,
  '8': 6,
  '9': 7,
  '10': 8,
  '11': 9,
  '12': 10,
  '13': 11,
  '14': 12,
  '15': 13,
  '16': 14,
  '17': 15,
  '18': 16,
  '20': 17,
  '21': 18,
  '22': 19,
  '23': 20,
  '24': 21,
  '25': 22,
  '26': 23,
  '27': 24,
  '29': 25,
  '30': 26,
  '31': 27,
  '32': 28,
  '33': 29,
  '34': 30,
}

const WILDLIFE_KEY_TO_INDEX = new Map<string, number>(
  WILDLIFE_ASSET_KEYS.map((key, index) => [key, index]),
)

function slugifySpeciesKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** True only for explicit http(s) URLs safe to render in outbound links. */
export function isSafeHttpUrl(rawUrl?: string | null): rawUrl is string {
  const trimmed = rawUrl?.trim()
  if (!trimmed) return false
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Normalizes BioWira asset URLs onto the active Pages origin.
 * Rewrites legacy biowira.dpdns.org / api.biowira.dpdns.org URLs, relative `all_assets/...`
 * paths without a leading slash, and any http(s) URL pointing to `/all_assets/*`,
 * `/avatars/*`, or `/assets/*` while keeping unrelated external test/media URLs intact.
 */
export function normalizeLocalAssetUrl(rawUrl?: string | null): string | undefined {
  const trimmed = rawUrl?.trim()
  if (!trimmed) return undefined

  for (const prefix of LOCAL_ASSET_PREFIXES) {
    const barePrefix = prefix.slice(1)
    if (trimmed.startsWith(barePrefix)) {
      return `/${trimmed}`
    }
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    const pathname = parsed.pathname || '/'
    const isLocalPath = LOCAL_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    if (isLocalPath || LEGACY_MEDIA_HOSTS.has(parsed.hostname.toLowerCase())) {
      return `${pathname}${parsed.search}${parsed.hash}`
    }
    return trimmed
  } catch {
    return trimmed
  }
}

/**
 * Resolves the bundled `/all_assets/wildlife-*.webp` photograph URL for a known BioWira species.
 */
export function resolveWildlifeAllAssetUrl(input: {
  id?: string | number | null
  visualKey?: string | null
  scientificName?: string | null
  commonName?: string | null
}): string | undefined {
  const candidates: string[] = []
  if (input.commonName) {
    const slug = slugifySpeciesKey(input.commonName)
    candidates.push(WILDLIFE_KEY_ALIASES[slug] ?? slug)
  }
  if (input.visualKey) {
    const slug = slugifySpeciesKey(input.visualKey)
    candidates.push(WILDLIFE_KEY_ALIASES[slug] ?? slug)
  }
  const resolvedVisual = resolveAnimalVisualKey(
    input.scientificName ?? '',
    input.commonName ?? '',
  )
  if (resolvedVisual) {
    const slug = slugifySpeciesKey(resolvedVisual)
    candidates.push(WILDLIFE_KEY_ALIASES[slug] ?? slug)
  }

  for (const candidate of candidates) {
    const index = WILDLIFE_KEY_TO_INDEX.get(candidate)
    if (index !== undefined) {
      return `/all_assets/wildlife-${index}.webp`
    }
  }

  if (input.id !== undefined && input.id !== null) {
    const index = WILDLIFE_ID_TO_INDEX[String(input.id).trim()]
    if (index !== undefined) {
      return `/all_assets/wildlife-${index}.webp`
    }
  }

  return undefined
}

export interface AnimalPhotoSubject {
  id?: string | number | null
  visualKey?: string | null
  scientificName?: string | null
  commonName?: string | null
  animalPhotoUrl?: string | null
  imageUrl?: string | null
  avatarPath?: string | null
  imageAttribution?: ImageAttribution
  avatarAttribution?: ImageAttribution
}

export interface ResolvedAnimalPhoto {
  src: string | null
  attribution?: ImageAttribution
  kind: 'primary' | 'all_assets' | 'avatar' | 'none'
}

/**
 * Resolves the best real wildlife photograph candidate and strictly paired attribution.
 * Never returns spirit artwork so `<CitedImage>` never shows a photo caption on a spirit icon.
 */
export function resolveAnimalPhoto(
  animal: AnimalPhotoSubject | null | undefined,
  failedUrls?: ReadonlySet<string>,
): ResolvedAnimalPhoto {
  if (!animal) {
    return { src: null, kind: 'none' }
  }

  const primary = normalizeLocalAssetUrl(animal.animalPhotoUrl ?? animal.imageUrl)
  if (primary && !failedUrls?.has(primary)) {
    return {
      src: primary,
      attribution: animal.imageAttribution,
      kind: 'primary',
    }
  }

  const allAssetFallback = resolveWildlifeAllAssetUrl({
    id: animal.id,
    visualKey: animal.visualKey,
    scientificName: animal.scientificName,
    commonName: animal.commonName,
  })
  if (allAssetFallback && allAssetFallback !== primary && !failedUrls?.has(allAssetFallback)) {
    return {
      src: allAssetFallback,
      attribution: animal.imageAttribution,
      kind: 'all_assets',
    }
  }

  const avatar = normalizeLocalAssetUrl(animal.avatarPath)
  if (avatar && avatar !== primary && avatar !== allAssetFallback && !failedUrls?.has(avatar)) {
    return {
      src: avatar,
      attribution: animal.avatarAttribution ?? animal.imageAttribution,
      kind: 'avatar',
    }
  }

  return { src: null, kind: 'none' }
}
