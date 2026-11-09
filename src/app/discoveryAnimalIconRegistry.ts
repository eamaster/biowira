// ── BioWira Discovery Animal Icon Registry ──────────────────────────────────────
//
// This is the DISCOVERY-ONLY icon system, completely separate from the explorer
// SVG icon registry (src/app/iconRegistry.ts).
//
// EXPLORER ICONS  → src/app/iconRegistry.ts  → public/icons/animals/*.svg
// DISCOVERY ICONS → THIS FILE                → src/assets/discovery-animals/*.webp
//
// ── How auto-discovery works ───────────────────────────────────────────────────
//  - All *.webp files in src/assets/discovery-animals/ are eagerly loaded via
//    import.meta.glob, which Vite processes at build time.
//  - The filename stem (without .webp) becomes the lookup key:
//      tiger.webp           → 'tiger'
//      sun-bear.webp        → 'sun-bear'
//      proboscis-monkey.webp → 'proboscis-monkey'
//  - To add a new discovery icon: drop the .webp file in the folder and restart
//    the dev server (or rebuild). No other file changes are needed.
//
// ── Resolution order (getDiscoveryAnimalIconUrl) ──────────────────────────────
//  1. animal.visualKey            → direct WEBP stem match
//  2. animal.visualKey            → DISCOVERY_ICON_ALIASES → WEBP stem match
//  3. normalised animal.commonName slug → direct WEBP stem match
//  4. normalised animal.commonName slug → DISCOVERY_ICON_ALIASES → WEBP stem match
//  5. undefined  → caller must fall back to iconEmoji
//
// ── Alias map ─────────────────────────────────────────────────────────────────
//  Only add entries to DISCOVERY_ICON_ALIASES when BOTH of the following fail:
//    • visualKey     does NOT match any WEBP stem directly
//    • commonName slug does NOT match any WEBP stem directly
//  All alias logic lives here — never in individual components.
//
// ── DO NOT ────────────────────────────────────────────────────────────────────
//  - Do NOT import from or modify src/app/iconRegistry.ts (explorer registry)
//  - Do NOT expose these WEBP URLs through getAnimalIconUrl / ANIMAL_ICON_MAP
//  - Do NOT add entries to getRegisteredAnimalIconKeys (that feeds explorer picker)

// ── Auto-discovered WEBP modules ──────────────────────────────────────────────
// Vite resolves each matching *.webp file and returns its processed URL as the
// module's default export (via the ?url query transform).
// Keys look like: '../assets/discovery-animals/tiger.webp'
// Values are the Vite-processed URL string, e.g. '/assets/tiger-ABC123.webp'
const _rawModules = import.meta.glob<string>('../assets/discovery-animals/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

// ── Internal helpers ───────────────────────────────────────────────────────────

/** Extract the WEBP filename stem from a glob result key path. */
function stemFromGlobPath(path: string): string {
  const filename = path.split('/').pop() ?? ''
  return filename.replace(/\.webp$/i, '')
}

/**
 * Build the stem → URL lookup from the raw glob modules.
 * Called once at module initialisation; result is frozen for safety.
 */
function buildDiscoveryIconMap(modules: Record<string, string>): Readonly<Record<string, string>> {
  const map: Record<string, string> = {}
  for (const [path, url] of Object.entries(modules)) {
    const stem = stemFromGlobPath(path)
    if (stem && url) map[stem] = url
  }
  return Object.freeze(map)
}

// ── Centralized alias map ──────────────────────────────────────────────────────
// Maps a domain key (visualKey or normalised commonName slug) to the WEBP file
// stem when the two do not match automatically.
//
// Rules:
//  • Key   = the domain/slug value that arrives from animal data
//  • Value = the WEBP filename stem (WITHOUT .webp extension)
//  • Only add an alias when direct matching is impossible
//  • Every alias value MUST correspond to an actual *.webp file in
//    src/assets/discovery-animals/
//
// Rationale for each entry:
//  'malayan-tiger'       visualKey in explorer data; WEBP file is 'tiger.webp'
//  'crocodile'           visualKey for Estuarine/Saltwater Crocodile; WEBP is 'saltwater-crocodile.webp'
//  'estuarine-crocodile' normalised slug of mock commonName; same WEBP target
//  'hornbill'            explorer visualKey; WEBP file is 'rhinoceros-hornbill.webp'

const DISCOVERY_ICON_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  'malayan-tiger': 'tiger',
  crocodile: 'saltwater-crocodile',
  'estuarine-crocodile': 'saltwater-crocodile',
  hornbill: 'rhinoceros-hornbill',
})

// ── Stem → URL map (frozen, built once) ───────────────────────────────────────
const DISCOVERY_ICON_MAP: Readonly<Record<string, string>> = buildDiscoveryIconMap(_rawModules)

// ── Slug normalisation ─────────────────────────────────────────────────────────
/**
 * Convert an animal common name to a lowercase hyphen-slug that matches the
 * WEBP filename convention used in src/assets/discovery-animals/.
 *
 * Examples:
 *   'Rhinoceros Hornbill'    → 'rhinoceros-hornbill'
 *   'Sunda Pangolin'         → 'sunda-pangolin'
 *   'Asian Common Toad'      → 'asian-common-toad'
 *   "Wallace's Flying Frog"  → 'wallaces-flying-frog'
 */
function normaliseToDiscoverySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['''\u2019`]/g, '') // strip apostrophes/smart-quotes: "Wallace's" → "wallaces"
    .replace(/[^a-z0-9]+/g, '-') // replace runs of non-alphanumeric with a single hyphen
    .replace(/^-+|-+$/g, '') // strip any leading / trailing hyphens
}

// ── Core resolution logic ──────────────────────────────────────────────────────
/**
 * Given an ordered list of candidate keys, return the first WEBP URL that can
 * be resolved — either directly from DISCOVERY_ICON_MAP or via an alias.
 * Returns `undefined` when no candidate matches.
 */
function resolveFromCandidates(candidates: readonly string[]): string | undefined {
  for (const candidate of candidates) {
    if (!candidate) continue

    // 1. Direct match in the icon map
    const direct = DISCOVERY_ICON_MAP[candidate]
    if (direct) return direct

    // 2. Alias → icon map
    const aliasTarget = DISCOVERY_ICON_ALIASES[candidate]
    if (aliasTarget) {
      const aliased = DISCOVERY_ICON_MAP[aliasTarget]
      if (aliased) return aliased
    }
  }
  return undefined
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Minimal animal shape required to resolve a discovery icon URL. */
export interface DiscoveryAnimalInput {
  /** Decoupled visual asset key from animal data (e.g. 'sun-bear', 'malayan-tiger'). */
  visualKey?: string
  /** Human-readable common name used as a slug fallback (e.g. 'Sunda Pangolin'). */
  commonName: string
}

/**
 * Resolve a WEBP discovery icon URL for an animal.
 *
 * Returns the Vite-processed URL string when a matching discovery icon exists.
 * Returns `undefined` when no match is found — the caller MUST fall back to
 * `animal.iconEmoji` (or another safe fallback). Do NOT fall back to the
 * explorer SVG registry.
 *
 * Resolution order:
 *  1. visualKey           → direct WEBP stem match
 *  2. visualKey           → alias → WEBP stem match
 *  3. normalised commonName slug → direct WEBP stem match
 *  4. normalised commonName slug → alias → WEBP stem match
 */
export function getDiscoveryAnimalIconUrl(animal: DiscoveryAnimalInput): string | undefined {
  const candidates: string[] = []

  // Priority 1 & 2: visualKey (may match directly or via alias)
  if (animal.visualKey) {
    candidates.push(animal.visualKey)
  }

  // Priority 3 & 4: normalised commonName slug
  const nameSlug = normaliseToDiscoverySlug(animal.commonName)
  if (nameSlug && !candidates.includes(nameSlug)) {
    candidates.push(nameSlug)
  }

  return resolveFromCandidates(candidates)
}

/**
 * All discovery icon stems currently available (i.e. every *.webp file that
 * was found in src/assets/discovery-animals/ at build/dev-server start time).
 *
 * Useful for debugging and tests. Adding a new *.webp file expands this list
 * automatically without touching this module.
 */
export function getDiscoveryAnimalIconKeys(): readonly string[] {
  return Object.keys(DISCOVERY_ICON_MAP)
}

/**
 * Expose the centralised alias map (read-only).
 * Intended for tests to assert that every alias target is a real icon stem.
 */
export function getDiscoveryIconAliases(): Readonly<Record<string, string>> {
  return DISCOVERY_ICON_ALIASES
}
