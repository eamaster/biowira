/**
 * Normalized image attribution for backend animal photos and fact illustrations.
 * Local BioWira spirit/WebP icons in `src/assets/discovery-animals/` are UI artwork —
 * real photos from imageUrl / avatarPath / factImageUrl require attribution when shown.
 */

export interface ImageLicenseInfo {
  licenseName?: string
  licenseUrl?: string
}

export interface ImageAttribution {
  title?: string
  author?: string
  authorUrl?: string
  sourceName?: string
  sourceUrl?: string
  licenseName?: string
  licenseUrl?: string
  creditLine?: string
  /** Synthetic label-only line when backend sent no citation fields */
  isFallback?: boolean
}

export type ImageWithAttribution = {
  url: string
  attribution?: ImageAttribution | null
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

function trimString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t === '' ? undefined : t
}

function pickCreditLine(o: Record<string, unknown>): string | undefined {
  const keys = [
    'creditLine',
    'credit_line',
    'imageCreditLine',
    'image_credit_line',
    'credit',
  ]
  for (const k of keys) {
    const v = trimString(o[k])
    if (v) return v
  }
  return undefined
}

/** Merge attribution-like object fields into partial ImageAttribution */
function attributionFromFlatRecord(o: Record<string, unknown>): ImageAttribution {
  const creditLine = pickCreditLine(o)

  const title = trimString(o.title ?? o.imageTitle ?? o.image_title)

  const author =
    trimString(o.author) ??
    trimString(o.imageAuthor) ??
    trimString(o.image_author)

  const authorUrl =
    trimString(o.authorUrl) ??
    trimString(o.author_url) ??
    trimString(o.imageAuthorUrl) ??
    trimString(o.image_author_url)

  const sourceName =
    trimString(o.sourceName) ??
    trimString(o.source_name) ??
    trimString(o.imageSource) ??
    trimString(o.image_source) ??
    trimString(o.source)

  const sourceUrl =
    trimString(o.sourceUrl) ??
    trimString(o.source_url) ??
    trimString(o.imageSourceUrl) ??
    trimString(o.image_source_url)

  const licenseName =
    trimString(o.licenseName) ??
    trimString(o.license_name) ??
    trimString(o.imageLicense) ??
    trimString(o.image_license)

  const licenseUrl =
    trimString(o.licenseUrl) ??
    trimString(o.license_url) ??
    trimString(o.imageLicenseUrl) ??
    trimString(o.image_license_url)

  return {
    title,
    author,
    authorUrl,
    sourceName,
    sourceUrl,
    licenseName,
    licenseUrl,
    creditLine,
  }
}

/**
 * Narrow partial to only defined fields worth keeping.
 */
function compactAttribution(p: ImageAttribution): ImageAttribution | undefined {
  const keys: (keyof ImageAttribution)[] = [
    'title',
    'author',
    'authorUrl',
    'sourceName',
    'sourceUrl',
    'licenseName',
    'licenseUrl',
    'creditLine',
    'isFallback',
  ]
  const out: ImageAttribution = {}
  let any = false
  for (const k of keys) {
    const v = p[k]
    if (v !== undefined && v !== '') {
      ;(out as Record<string, unknown>)[k] = v
      any = true
    }
  }
  return any ? out : undefined
}

function isBioWiraOrCdnHosted(urlStr: string): boolean {
  try {
    const u = urlStr.trim().toLowerCase()
    if (!u.startsWith('http')) return false
    return (
      /\.cloudfront\.net\b/i.test(u) ||
      /biowira\./i.test(u) ||
      /amazonaws\.com\b/i.test(u)
    )
  } catch {
    return false
  }
}

function isWikimediaUrl(urlStr: string): boolean {
  return /wikimedia\.org|upload\.wikimedia/i.test(urlStr)
}

/** Host label for caption (no port for display simplicity) */
function hostnameLabel(urlStr: string): string {
  try {
    const host = new URL(urlStr.trim()).hostname
    return host || urlStr.trim()
  } catch {
    return urlStr.trim()
  }
}

/**
 * Fallback when backend omits citation: never invent authors or Creative Commons —
 * label the hosting/source generically per domain heuristics.
 */
export function buildFallbackImageAttributionFromUrl(
  imageUrl: string | undefined,
  sourceLabel?: string,
): ImageAttribution | undefined {
  const url = trimString(imageUrl)
  if (!url) return undefined

  const bioWiraNameForKind = (): string => {
    if (sourceLabel === 'BioWira avatar asset') return 'BioWira avatar asset'
    if (sourceLabel === 'BioWira fact image') return 'BioWira fact image'
    return 'BioWira image asset'
  }

  if (isWikimediaUrl(url)) {
    const name = 'Wikimedia Commons'
    return {
      sourceName: name,
      sourceUrl: url.startsWith('http') ? url : undefined,
      creditLine: `Image source: ${name}`,
      isFallback: true,
    }
  }

  if (isBioWiraOrCdnHosted(url)) {
    const name = bioWiraNameForKind()
    return {
      sourceName: name,
      sourceUrl: url,
      creditLine: `Image source: ${name}`,
      isFallback: true,
    }
  }

  if (/^https?:\/\//i.test(url)) {
    const host = hostnameLabel(url)
    return {
      sourceName: host,
      sourceUrl: url,
      creditLine: `Image source: ${host}`,
      isFallback: true,
    }
  }

  if (sourceLabel?.trim()) {
    const name = sourceLabel.trim()
    return {
      sourceName: name,
      sourceUrl: undefined,
      creditLine: `Image source: ${name}`,
      isFallback: true,
    }
  }

  const host = hostnameLabel(`https://${url}`)
  return {
    sourceName: host,
    sourceUrl: undefined,
    creditLine: `Image source: ${host}`,
    isFallback: true,
  }
}

export function normaliseImageAttribution(input: unknown): ImageAttribution | undefined {
  if (input == null || input === '') return undefined

  if (typeof input === 'string') {
    const line = trimString(input)
    if (!line) return undefined
    return { creditLine: line }
  }

  if (!isPlainObject(input)) return undefined

  const merged: ImageAttribution = {
    ...attributionFromFlatRecord(input),
  }

  const nested =
    input.image ??
    input.attribution ??
    input.imageAttribution ??
    input.ImageAttribution ??
    input.citation ??
    input.Citation

  if (isPlainObject(nested)) {
    const nRec = nested as Record<string, unknown>
    let flat: Record<string, unknown> = { ...nRec }
    for (const key of ['attribution', 'citation', 'imageAttribution'] as const) {
      const inner = nRec[key]
      if (isPlainObject(inner)) flat = { ...flat, ...(inner as Record<string, unknown>) }
    }
    const inner = attributionFromFlatRecord(flat)
    Object.assign(merged, {
      title: merged.title ?? inner.title,
      author: merged.author ?? inner.author,
      authorUrl: merged.authorUrl ?? inner.authorUrl,
      sourceName: merged.sourceName ?? inner.sourceName,
      sourceUrl: merged.sourceUrl ?? inner.sourceUrl,
      licenseName: merged.licenseName ?? inner.licenseName,
      licenseUrl: merged.licenseUrl ?? inner.licenseUrl,
      creditLine: merged.creditLine ?? inner.creditLine,
    })
  }

  return compactAttribution(merged)
}

export function hasUsableAttribution(attribution?: ImageAttribution | null): boolean {
  if (!attribution) return false
  return !!(
    attribution.creditLine ||
    attribution.author ||
    attribution.sourceName ||
    attribution.licenseName ||
    attribution.title
  )
}

/**
 * Prefer explicit backend citation; otherwise URL-derived fallback (never invents authors/licenses).
 */
export function finalizeImageAttribution(
  raw: unknown,
  imageUrl: string | undefined,
  fallbackKind: 'BioWira image asset' | 'BioWira avatar asset' | 'BioWira fact image',
): ImageAttribution | undefined {
  const direct = normaliseImageAttribution(raw)
  const url = trimString(imageUrl)

  const label =
    fallbackKind === 'BioWira avatar asset'
      ? 'BioWira avatar asset'
      : fallbackKind === 'BioWira fact image'
        ? 'BioWira fact image'
        : 'BioWira image asset'

  if (direct && hasUsableAttribution(direct)) return direct

  if (url) return buildFallbackImageAttributionFromUrl(url, label)

  return direct ? compactAttribution(direct) : undefined
}

const warnedMissingKeys = new Set<string>()
let warnedCount = 0
const WARN_CAP = 30

/** Dev-only: warn once per entity+URL if a real remote image renders without attributable metadata (after normalization). */
export function warnMissingImageAttribution(entity: string, imageUrl: string | undefined): void {
  if (!import.meta.env.DEV) return
  const u = trimString(imageUrl)
  if (!u || !/^https?:\/\//i.test(u)) return

  const key = `${entity}::${u}`
  if (warnedMissingKeys.has(key)) return
  if (warnedCount >= WARN_CAP) return
  warnedMissingKeys.add(key)
  warnedCount++

  console.warn(
    `[imageAttribution] Real image lacks explicit citation (${entity}); using URL-derived fallback. URL:`,
    u,
  )
}
