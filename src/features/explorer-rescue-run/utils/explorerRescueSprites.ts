// ── Explorer Rescue Run — Explorer sprite resolver ────────────────────────────
//
// Maps explorer visual keys that have a dedicated WebP gameplay sprite to their
// public-folder paths. Only explorers listed here get a special sprite; all
// others fall back to the generic explorer mascot.
//
// To add a new sprite:
//  1. Drop the .webp file in public/games/explorer-rescue/gameplay/
//  2. Register its path in EXPLORER_RESCUE_ASSETS (branding.ts).
//  3. Add the entry to RESCUE_EXPLORER_SPRITE_MAP below.

import type { RescueExplorerPlayerTextureKind } from '../game/types'
import { EXPLORER_RESCUE_ASSETS } from '@/app/branding'
import { getDiscoveryAnimalIconUrl } from '@/app/discoveryAnimalIconRegistry'
import { getAnimalIconUrl } from '@/app/iconRegistry'

// Registry: explorer visual key → dedicated gameplay sprite path
// Both canonical ('bornean-orangutan') and legacy alias ('orangutan') keys
// are registered so profiles created before and after the migration work.
const RESCUE_EXPLORER_SPRITE_MAP: Readonly<Record<string, string>> = {
  'malayan-tiger': EXPLORER_RESCUE_ASSETS.gameplay.tigerExplorerSprite,
  'bornean-orangutan': EXPLORER_RESCUE_ASSETS.gameplay.orangutanExplorerSprite,
  'orangutan': EXPLORER_RESCUE_ASSETS.gameplay.orangutanExplorerSprite,
}

export type RescueExplorerPlayerIconResolution = {
  url: string
  kind: RescueExplorerPlayerTextureKind
}

/**
 * Returns the dedicated WebP sprite path for explorers that have one,
 * or `null` for unsupported visual keys (use the generic mascot or icon).
 *
 * Used by the Phaser scene to decide which texture to preload.
 */
export function getExplorerRescueSpritePath(visualKey: string): string | null {
  return RESCUE_EXPLORER_SPRITE_MAP[visualKey] ?? null
}

/**
 * Returns the sprite to display in Vue components for the given explorer.
 * Falls back to the generic explorer mascot for unsupported visual keys.
 *
 * Used by RescueInfoChips, RescueProgressPanel, and ExplorerRescueStagePreview.
 */
export function resolveExplorerRescueSprite(visualKey: string): string {
  return RESCUE_EXPLORER_SPRITE_MAP[visualKey] ?? EXPLORER_RESCUE_ASSETS.landing.explorerMascot
}

/** Player texture URL + canonical kind — same source as Phaser preload and mirror math. */
export function resolveRescueExplorerPlayerIconResolution(
  visualKey: string,
  animalName: string,
): RescueExplorerPlayerIconResolution {
  const dedicated = getExplorerRescueSpritePath(visualKey)
  if (dedicated) {
    return { url: dedicated, kind: 'dedicated_gameplay' }
  }

  const disc = getDiscoveryAnimalIconUrl({ visualKey, commonName: animalName })
  if (disc) {
    return { url: disc, kind: 'discovery_raster' }
  }

  const svg = getAnimalIconUrl(visualKey)
  if (svg) {
    return { url: svg, kind: 'explorer_svg' }
  }

  return { url: '', kind: 'none' }
}

/**
 * Player/HUD artwork for the rescue run — dedicated gameplay sprite first (e.g. tiger),
 * then discovery WEBP icon, then explorer SVG fallback. Same chain as {@link resolveRescueExplorerPlayerIconResolution}.
 */
export function resolveRescueExplorerPlayerIconUrl(visualKey: string, animalName: string): string {
  return resolveRescueExplorerPlayerIconResolution(visualKey, animalName).url
}

/**
 * Maps Phaser runner `textureKind` + optional catalog inversion to horizontal mirroring semantics.
 *
 * `true`: `scaleX` toward +velocity matches +world X (dedicated sprites + default discovery authoring).
 * `false`: mirrored (thin explorer-picker SVG silhouette; procedural token; inverted discovery spirits).
 *
 * Mirrors {@link ExplorerRescueScene._orientPlayerTowardWorld}: keep in sync when adding kinds.
 */
export function rescueExplorerFacingPositiveTowardWorldX(opts: {
  textureKind: RescueExplorerPlayerTextureKind | undefined
  runnerDiscoveryMirrorInvert?: boolean | undefined
}): boolean {
  const kind = opts.textureKind ?? 'none'
  let base: boolean

  switch (kind) {
    case 'dedicated_gameplay':
    case 'discovery_raster':
      base = true
      break
    case 'explorer_svg':
    case 'none':
    default:
      base = false
  }

  return kind === 'discovery_raster' && opts.runnerDiscoveryMirrorInvert ? !base : base
}
