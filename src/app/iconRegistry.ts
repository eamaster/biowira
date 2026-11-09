// ── BioWira Icon Registry ──────────────────────────────────────────────────────
//
// This is the single source of truth for nav / feature icon assets in the app.
// Components NEVER hardcode individual icon paths. They call the helpers below.
//
// ── How to add a new nav/feature icon ─────────────────────────────────────────
//  1. Prefer WebP under `public/icons/nav/home-page/` (shared with homepage cards)
//     or `public/icons/nav/` for nav-only art.
//  2. Add one entry to NAV_ICON_MAP below
//  3. No component-level changes needed
//
// ── How to add a new animal icon ──────────────────────────────────────────────
//  1. Drop the SVG into `public/icons/animals/<filename>.svg`
//  2. Add one entry to ANIMAL_ICON_MAP below, mapping the animal's domain ID
//     (used in mocks/animals.ts and data) to the public asset URL
//  3. No component-level changes needed
//
// ── Fallback behaviour ────────────────────────────────────────────────────────
//  - `getNavIconUrl`    returns `undefined` when the key is unmapped → AppIcon
//    renders the optional `fallbackText` prop (or nothing)
//  - `getAnimalIconUrl` returns `undefined` when the animal ID is unmapped →
//    AnimalIcon falls through to `iconEmoji` / `animalEmoji` automatically
//
// NOTE: source filename inconsistencies (underscores vs hyphens) are hidden here.
// All assets live under stable paths in public/; this registry is the
// only place that knows what file maps to what logical key.

// ── Navigation / feature icons ─────────────────────────────────────────────────
// Keys must match the `iconKey` field used in NAV_ITEMS (config.ts) and in
// the ACTION_CARDS array in HomePage.vue.

const NAV_ICON_MAP: Record<string, string> = {
  home: '/icons/nav/home-page/home.webp',
  discover: '/icons/nav/home-page/discovery-card-icon.webp',
  /** Same pixel art as the homepage “Take Animal Quiz” card (`public/icons/nav/home-page/quiz-card-icon.webp`). */
  quiz: '/icons/nav/home-page/quiz-card-icon.webp',
  games: '/icons/nav/home-page/game.webp',
  missions: '/icons/nav/home-page/mission-card-icon.webp',
}

/**
 * Resolve a nav/feature icon URL by its logical key.
 * Returns `undefined` when the key is not yet registered — callers should
 * display a `fallbackText` or omit the icon gracefully.
 */
export function getNavIconUrl(key: string): string | undefined {
  return NAV_ICON_MAP[key]
}

// ── Animal icons ───────────────────────────────────────────────────────────────
// Keys are the stable domain `Animal.id` values (as defined in mocks/animals.ts
// and returned by the API). Values are the normalized public asset URLs.
//
// Animals WITHOUT a provided SVG are deliberately omitted here so that consuming
// components fall back to `iconEmoji` / `animalEmoji` automatically.
//
// All currently known animals now have SVG assets registered.

const ANIMAL_ICON_MAP: Record<string, string> = {
  // ── Canonical explorer keys (new) ─────────────────────────────────────────
  // These are the authoritative visual keys for the 8 allowed explorer animals.
  // Always prefer these keys for new profiles.
  'malayan-tiger': '/icons/animals/malayan-tiger.svg',
  'bornean-orangutan': '/icons/animals/bornean-orangutan.svg',
  'proboscis-monkey': '/icons/animals/proboscis-monkey.svg',
  'rhinoceros-hornbill': '/icons/animals/rhinoceros-hornbill.svg',
  'sun-bear': '/icons/animals/sun-bear.svg',
  'sunda-pangolin': '/icons/animals/sunda-pangolin.svg',
  'saltwater-crocodile': '/icons/animals/saltwater-crocodile.svg',
  // leatherback-sea-turtle has no explorer SVG — resolved via discovery WEBP

  // ── Legacy alias keys (kept for backward compatibility) ────────────────────
  // Old profiles may still reference these. Do NOT remove — they are needed for
  // migration and for resolving stored animalVisualKey values.
  // These aliases do NOT drive the Welcome explorer picker (catalog is curated).
  hornbill: '/icons/animals/rhinoceros-hornbill.svg',
  orangutan: '/icons/animals/bornean-orangutan.svg',
  pangolin: '/icons/animals/sunda-pangolin.svg',
  crocodile: '/icons/animals/saltwater-crocodile.svg',

  // ── Discovery/mock-only animal SVGs ───────────────────────────────────────
  // These animals are NOT in the explorer picker; they exist for Discover and mock data.
  tapir: '/icons/animals/malayan-tapir.svg',
  'sea-turtle': '/icons/animals/green-sea-turtle.svg',
  mousedeer: '/icons/animals/mouse-deer.svg',
  dugong: '/icons/animals/dugong.svg',
  'sea-turtle-hawksbill': '/icons/animals/sea-turtle-hawksbill.svg',
}

/**
 * Resolve an animal SVG icon URL by the animal's domain ID.
 * Returns `undefined` when the animal has no registered SVG — the caller
 * should fall back to the `iconEmoji` string stored on the Animal model.
 */
export function getAnimalIconUrl(animalId: string): string | undefined {
  return ANIMAL_ICON_MAP[animalId]
}

/**
 * Every logical key that has an SVG under `public/icons/animals/`.
 * Explorer profile picker uses this so kids can choose any shipped animal icon.
 */
export function getRegisteredAnimalIconKeys(): readonly string[] {
  return Object.keys(ANIMAL_ICON_MAP)
}

// ── Gameplay / reward icons ────────────────────────────────────────────────────
// Uploaded pixel-art assets that replace inline SVG shapes for all
// gameplay/progress/reward surfaces (progress bar, chip, mission card, home, etc.).
// Use logical keys in components — never hardcode the asset path directly.

const GAMEPLAY_ICON_MAP: Record<string, string> = {
  /** Leaf + level badge — canonical icon for Leaf Points currency (see `pointsCurrency.ts`). */
  leafLevel: '/icons/rewards/leaf-level.svg',
  /** Legacy asset keys — do not use for Leaf Points currency in new UI */
  coin: '/icons/rewards/one-coin.svg',
  coins: '/icons/rewards/coins.svg',
  /** Trophy — celebration-only (not a points currency) */
  trophy: '/icons/rewards/trophy.svg',
  /** Missions — used for missions identity surfaces */
  missions: '/icons/rewards/missions.svg',
  /**
   * Explorer Rescue habitat clue — reuse as rainforest / restoration spirit
   * where a tree emoji would otherwise appear.
   */
  habitatForest: '/games/explorer-rescue/clues/habitat-forest-clue.webp',
  /** Passport / journal identity (stamps, completion rows) */
  journalPassport: '/games/explorer-rescue/passport-icon.webp',
  /** Paw trail — mission-type hints and meta rows */
  pawTrail: '/games/explorer-rescue/paw-trail-icon.webp',
  /** Quiz hub / result surfaces — same art as nav & homepage quiz card */
  quiz: NAV_ICON_MAP.quiz,
  /** Discover CTA on result pages — same art as nav discovery card */
  discover: NAV_ICON_MAP.discover,
}

export type GameplayIconKey = keyof typeof GAMEPLAY_ICON_MAP

/**
 * Resolve a path under `public/` to a URL that respects Vite `base` (branch deploys).
 * @param path - Absolute path from site root, e.g. `/icons/rewards/trophy.svg`
 */
export function resolvePublicAssetUrl(path: string): string {
  const base = import.meta.env.BASE_URL
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${base}${normalized}`
}

/**
 * Resolve a gameplay / reward SVG asset URL by its logical key.
 * Returns `undefined` when the key has no registered asset.
 */
export function getGameplayIconUrl(key: string): string | undefined {
  const path = GAMEPLAY_ICON_MAP[key]
  return path ? resolvePublicAssetUrl(path) : undefined
}

/**
 * All registered gameplay icon keys.
 */
export function getGameplayIconKeys(): readonly string[] {
  return Object.keys(GAMEPLAY_ICON_MAP)
}
