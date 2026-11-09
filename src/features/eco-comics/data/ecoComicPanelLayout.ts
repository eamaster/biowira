// ============================================================
// BioWira Eco-Comic Panel Layout Registry
//
// Data-driven overlay placement for the Eco-Comic reader.
// Policy: a narrow horizontal strip (`strip`) so dialogue stays low-profile.
// Most panels: `top-center`. Exceptions are per-panel only — keep them here.
//
// Add new panels when scenes change — keep logic here, not in Vue/CSS.
// ============================================================

export type EcoComicOverlayPlacement =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'bottom-center'
  | 'center-left'
  | 'center-right'

export type EcoComicOverlaySize = 'compact' | 'medium' | 'wide' | 'choice' | 'strip'

export interface EcoComicPanelLayout {
  placement: EcoComicOverlayPlacement
  size: EcoComicOverlaySize
  /**
   * Optional tone override.
   * 'dark': use dark glass background (for bright / high-key image areas).
   * Defaults to light parchment if omitted.
   */
  tone?: 'light' | 'dark'
}

/** Default: centred top strip */
const TOP_STRIP: EcoComicPanelLayout = { placement: 'top-center', size: 'strip' }

/** Truck choice scene: bottom strip — faces / butterfly / truck stay clear */
const BOTTOM_STRIP: EcoComicPanelLayout = { placement: 'bottom-center', size: 'strip' }

/** Park fork (`path_a_12`): top-right corner strip — crate / characters center-left stay clear */
const TOP_RIGHT_STRIP: EcoComicPanelLayout = { placement: 'top-right', size: 'strip' }

/** Path B raid (`path_b_15`): top-left strip — rescue action reads left; top-right art (bird/waterfall) stays visible */
const TOP_LEFT_STRIP: EcoComicPanelLayout = { placement: 'top-left', size: 'strip' }

/** PERHILITAN rescue speech (`path_a2_19`): bottom-left strip — faces / truck / cage stay clearer than top-center */
const BOTTOM_LEFT_STRIP: EcoComicPanelLayout = { placement: 'bottom-left', size: 'strip' }

// ── Panel layout map ──────────────────────────────────────────────────────────

const PANEL_LAYOUTS: Record<string, EcoComicPanelLayout> = {
  opening: TOP_STRIP,

  scene_1: TOP_STRIP,
  scene_2: TOP_STRIP,
  scene_3: TOP_STRIP,
  scene_4: TOP_STRIP,
  scene_5: TOP_STRIP,
  scene_6: TOP_STRIP,
  scene_7: TOP_STRIP,
  scene_8: BOTTOM_STRIP,

  path_a_9: TOP_STRIP,
  path_a_10: TOP_STRIP,
  path_a_11: TOP_STRIP,
  path_a_12: TOP_RIGHT_STRIP,

  path_a1_13: TOP_STRIP,
  path_a1_14: TOP_STRIP,
  path_a1_15: TOP_STRIP,
  path_a1_16: TOP_STRIP,
  path_a1_17: TOP_STRIP,
  path_a1_18: TOP_STRIP,
  path_a1_19: TOP_STRIP,
  path_a1_20: TOP_STRIP,
  path_a1_21: TOP_STRIP,
  ending_a1: TOP_STRIP,

  path_a2_13: TOP_STRIP,
  path_a2_14: TOP_STRIP,
  path_a2_15: TOP_STRIP,
  path_a2_16: TOP_STRIP,
  path_a2_17: TOP_STRIP,
  path_a2_18: TOP_STRIP,
  path_a2_19: BOTTOM_LEFT_STRIP,
  path_a2_20: TOP_STRIP,
  path_a2_21: TOP_STRIP,
  ending_a2: TOP_STRIP,

  path_b_9: TOP_STRIP,
  path_b_10: TOP_STRIP,
  path_b_11: TOP_STRIP,
  path_b_12: TOP_STRIP,
  path_b_13: TOP_STRIP,
  path_b_14: TOP_STRIP,
  path_b_15: TOP_LEFT_STRIP,
  path_b_16: TOP_STRIP,
  path_b_17: TOP_STRIP,
  path_b_18: TOP_STRIP,
  ending_b: TOP_STRIP,
}

// ── Fallback ──────────────────────────────────────────────────────────────────

/**
 * Returned for any panel id not found in PANEL_LAYOUTS.
 * New panels added to the story catalog should always receive an explicit
 * entry above; this default acts as a safe guard only.
 */
const DEFAULT_LAYOUT: EcoComicPanelLayout = TOP_STRIP

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the safe overlay placement for a given panel id.
 *
 * Every current panel in `ecoComicStoryCatalog.ts` has an explicit entry.
 * If a panel is added without a matching entry, the fallback (`top-center`,
 * `strip`) is returned — safe but not visually optimised.
 */
export function getEcoComicPanelLayout(panelId: string): EcoComicPanelLayout {
  return PANEL_LAYOUTS[panelId] ?? DEFAULT_LAYOUT
}

/**
 * Exported for test coverage — allows verifying every catalog panel has an
 * explicit layout entry (no silent fallback to DEFAULT_LAYOUT).
 */
export const ECO_COMIC_PANEL_LAYOUT_MAP: Readonly<Record<string, EcoComicPanelLayout>> =
  PANEL_LAYOUTS
