// ============================================================
// BioWira Eco-Comic Asset Registry
//
// Central typed registry for Eco-Comic image paths and prepared narration audio.
// All paths are served from /public via the Vite static server.
//
// Rules:
// - No raw paths in Vue templates or story catalog — always import here.
// - No duplicate files: shared Path A scenes (9-12, 20) are stored once
//   under path-a/shared/ and referenced by both sub-paths.
// - Image dimensions: 1672 × 941 (≈ 16:9). Use aspect-ratio: 1672 / 941.
// ============================================================

const LIBRARY_MENU_BASE = '/games/eco-comics/menu' as const

/** Library shelf storybook art (`/public/games/eco-comics/menu`). */
export const ECO_COMICS_LIBRARY_MENU = {
  storybookCover: `${LIBRARY_MENU_BASE}/eco_comic_storybook_cover.webp`,
  greyPlaceholder: `${LIBRARY_MENU_BASE}/grey_storybook.webp`,
} as const

const BASE = '/games/eco-comics/secret-wooden-crate' as const

/** Prepared voice narration clips (MP3) for this story — served from `/public`. */
const NARRATION_BASE = `${BASE}/narration` as const

export const SECRET_WOODEN_CRATE_ASSETS = {
  /** Library list uses dedicated story menu cover art (not the opening scene still). */
  cover: ECO_COMICS_LIBRARY_MENU.storybookCover,

  initial: {
    opening:  `${BASE}/initial/opening.webp`,
    scene01:  `${BASE}/initial/scene-01.webp`,
    scene02:  `${BASE}/initial/scene-02.webp`,
    scene03:  `${BASE}/initial/scene-03.webp`,
    scene04:  `${BASE}/initial/scene-04.webp`,
    scene05:  `${BASE}/initial/scene-05.webp`,
    scene06:  `${BASE}/initial/scene-06.webp`,
    scene07:  `${BASE}/initial/scene-07.webp`,
    scene08:  `${BASE}/initial/scene-08.webp`,
  },

  /**
   * Path A shared scenes — used by BOTH Call-Parent and Contact-PERHILITAN.
   * Stored once to avoid duplication.
   */
  pathAShared: {
    scene09:  `${BASE}/path-a/shared/scene-09.webp`,
    scene10:  `${BASE}/path-a/shared/scene-10.webp`,
    scene11:  `${BASE}/path-a/shared/scene-11.webp`,
    scene12:  `${BASE}/path-a/shared/scene-12.webp`,
    scene20:  `${BASE}/path-a/shared/scene-20.webp`,
  },

  /** Path AA: Take the Pangolin Now → Call a Parent */
  pathACallParent: {
    scene13:  `${BASE}/path-a/call-parent/scene-13.webp`,
    scene14:  `${BASE}/path-a/call-parent/scene-14.webp`,
    scene15:  `${BASE}/path-a/call-parent/scene-15.webp`,
    scene16:  `${BASE}/path-a/call-parent/scene-16.webp`,
    scene17:  `${BASE}/path-a/call-parent/scene-17.webp`,
    scene18:  `${BASE}/path-a/call-parent/scene-18.webp`,
    scene19:  `${BASE}/path-a/call-parent/scene-19.webp`,
    scene21:  `${BASE}/path-a/call-parent/scene-21.webp`,
  },

  /** Path AB: Take the Pangolin Now → Contact Jabatan PERHILITAN */
  pathAContactPerhilitan: {
    scene13:  `${BASE}/path-a/contact-perhilitan/scene-13.webp`,
    scene14:  `${BASE}/path-a/contact-perhilitan/scene-14.webp`,
    scene15:  `${BASE}/path-a/contact-perhilitan/scene-15.webp`,
    scene16:  `${BASE}/path-a/contact-perhilitan/scene-16.webp`,
    scene17:  `${BASE}/path-a/contact-perhilitan/scene-17.webp`,
    scene18:  `${BASE}/path-a/contact-perhilitan/scene-18.webp`,
    scene19:  `${BASE}/path-a/contact-perhilitan/scene-19.webp`,
    scene21:  `${BASE}/path-a/contact-perhilitan/scene-21.webp`,
  },

  /**
   * Path B: Photograph and Report — scenes 9–18 only.
   * No scene-19/20/21 exist for this path; story ends at scene-18 → ending_b.
   */
  pathB: {
    scene09:  `${BASE}/path-b/scene-09.webp`,
    scene10:  `${BASE}/path-b/scene-10.webp`,
    scene11:  `${BASE}/path-b/scene-11.webp`,
    scene12:  `${BASE}/path-b/scene-12.webp`,
    scene13:  `${BASE}/path-b/scene-13.webp`,
    scene14:  `${BASE}/path-b/scene-14.webp`,
    scene15:  `${BASE}/path-b/scene-15.webp`,
    scene16:  `${BASE}/path-b/scene-16.webp`,
    scene17:  `${BASE}/path-b/scene-17.webp`,
    scene18:  `${BASE}/path-b/scene-18.webp`,
  },

  narration: {
    opening: `${NARRATION_BASE}/opening.mp3`,
    initial: {
      scene01: `${NARRATION_BASE}/scene-01.mp3`,
      scene02: `${NARRATION_BASE}/scene-02.mp3`,
      scene03: `${NARRATION_BASE}/scene-03.mp3`,
      scene04: `${NARRATION_BASE}/scene-04.mp3`,
      scene05: `${NARRATION_BASE}/scene-05.mp3`,
      scene06: `${NARRATION_BASE}/scene-06.mp3`,
      scene07: `${NARRATION_BASE}/scene-07.mp3`,
      scene08: `${NARRATION_BASE}/scene-08.mp3`,
    },
    pathA: {
      scene09: `${NARRATION_BASE}/path-a-scene-09.mp3`,
      scene10: `${NARRATION_BASE}/path-a-scene-10.mp3`,
      scene11: `${NARRATION_BASE}/path-a-scene-11.mp3`,
      scene12: `${NARRATION_BASE}/path-a-scene-12.mp3`,
    },
    pathAA: {
      scene13: `${NARRATION_BASE}/path-aa-scene-13.mp3`,
      scene14: `${NARRATION_BASE}/path-aa-scene-14.mp3`,
      scene15: `${NARRATION_BASE}/path-aa-scene-15.mp3`,
      scene16: `${NARRATION_BASE}/path-aa-scene-16.mp3`,
      scene17: `${NARRATION_BASE}/path-aa-scene-17.mp3`,
      scene18: `${NARRATION_BASE}/path-aa-scene-18.mp3`,
      scene19: `${NARRATION_BASE}/path-aa-scene-19.mp3`,
      scene20: `${NARRATION_BASE}/path-aa-scene-20.mp3`,
      scene21: `${NARRATION_BASE}/path-aa-scene-21.mp3`,
    },
    pathAB: {
      scene13: `${NARRATION_BASE}/path-ab-scene-13.mp3`,
      scene14: `${NARRATION_BASE}/path-ab-scene-14.mp3`,
      scene15: `${NARRATION_BASE}/path-ab-scene-15.mp3`,
      scene16: `${NARRATION_BASE}/path-ab-scene-16.mp3`,
      scene17: `${NARRATION_BASE}/path-ab-scene-17.mp3`,
      scene18: `${NARRATION_BASE}/path-ab-scene-18.mp3`,
      scene19: `${NARRATION_BASE}/path-ab-scene-19.mp3`,
      scene20: `${NARRATION_BASE}/path-ab-scene-20.mp3`,
      scene21: `${NARRATION_BASE}/path-ab-scene-21.mp3`,
    },
    pathB: {
      scene09: `${NARRATION_BASE}/path-b-scene-09.mp3`,
      scene10: `${NARRATION_BASE}/path-b-scene-10.mp3`,
      scene11: `${NARRATION_BASE}/path-b-scene-11.mp3`,
      scene12: `${NARRATION_BASE}/path-b-scene-12.mp3`,
      scene13: `${NARRATION_BASE}/path-b-scene-13.mp3`,
      scene14: `${NARRATION_BASE}/path-b-scene-14.mp3`,
      scene15: `${NARRATION_BASE}/path-b-scene-15.mp3`,
      scene16: `${NARRATION_BASE}/path-b-scene-16.mp3`,
      scene17: `${NARRATION_BASE}/path-b-scene-17.mp3`,
      scene18: `${NARRATION_BASE}/path-b-scene-18.mp3`,
    },
  },
} as const

/**
 * All Eco-Comic scene URLs for this story — deduplicated flat list.
 * Useful for warm preloading after the reader opens.
 */
export function getSecretWoodenCrateSceneUrls(): string[] {
  const all: string[] = [
    SECRET_WOODEN_CRATE_ASSETS.cover,
    ...Object.values(SECRET_WOODEN_CRATE_ASSETS.initial),
    ...Object.values(SECRET_WOODEN_CRATE_ASSETS.pathAShared),
    ...Object.values(SECRET_WOODEN_CRATE_ASSETS.pathACallParent),
    ...Object.values(SECRET_WOODEN_CRATE_ASSETS.pathAContactPerhilitan),
    ...Object.values(SECRET_WOODEN_CRATE_ASSETS.pathB),
  ]
  // Deduplicate (cover === initial.opening)
  return [...new Set(all)]
}

/**
 * First-panel assets — warm these before or immediately on opening the reader.
 * Limited to the cover + opening scene to keep the warm payload small.
 */
export function getEcoComicWarmAssetUrls(): string[] {
  return [
    SECRET_WOODEN_CRATE_ASSETS.cover,
    SECRET_WOODEN_CRATE_ASSETS.initial.opening,
    SECRET_WOODEN_CRATE_ASSETS.initial.scene01,
  ]
}

/**
 * All prepared narration MP3 URLs for Secret Wooden Crate — deduplicated flat list.
 * For tests and build-time validation; do not bulk-preload at reader startup.
 */
export function getSecretWoodenCrateNarrationUrls(): string[] {
  const n = SECRET_WOODEN_CRATE_ASSETS.narration
  const all: string[] = [
    n.opening,
    ...Object.values(n.initial),
    ...Object.values(n.pathA),
    ...Object.values(n.pathAA),
    ...Object.values(n.pathAB),
    ...Object.values(n.pathB),
  ]
  return [...new Set(all)]
}
