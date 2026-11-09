/**
 * Central sizing for Explorer Rescue Run — viewport-clamped visuals for kid-friendly readability.
 * All Phaser gameplay dimensions should derive from `computeExplorerRescueVisualScale`.
 */

export interface ExplorerRescueVisualScale {
  playerSpriteSize: number
  playerIconSize: number
  playerTokenRadius: number
  playerBodyWidth: number
  playerBodyHeight: number
  clueIconSize: number
  clueGlowRadius: number
  clueCollectDistanceX: number
  clueCollectDistanceY: number
  choiceAnimalIconSize: number
  choiceTraitIconSize: number
  choiceGateWidth: number
  choiceGateHeight: number
  choiceLabelPanelWidth: number
  choiceLabelPanelHeight: number
  choiceNameFontSize: number
  choiceGateSpacing: number
  choiceCardImageCss: string
  choiceCardTraitIconCss: string
  resultAnimalIconCss: string
  resultTraitIconCss: string
  hudAnimalIconCss: string
  missionBadgeIconCss: string
  groundHeight: number
  platformHeight: number
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, n))
}

function clampCssPx(n: number, lo: number, hi: number): string {
  return `${Math.round(clamp(n, lo, hi))}px`
}

/** Uniform background tile — preserves source aspect ratio. */
export interface BackgroundTileLayout {
  scale: number
  displayWidth: number
  displayHeight: number
  /** Horizontal spacing between successive tile anchors; slightly less than `displayWidth` to hide filtering seams (see `_spawnBackgroundTiles`). */
  tileAdvanceX: number
}

export function computeBackgroundTileLayout(
  sourceWidth: number,
  sourceHeight: number,
  viewportHeight: number,
  _worldWidth: number,
): BackgroundTileLayout {
  const srcW = Math.max(1, sourceWidth)
  const srcH = Math.max(1, sourceHeight)
  const scale = clamp(viewportHeight / srcH, 0.01, 400)
  // Integer pixel extents reduce sub-pixel cracks when tiling; derive width from rounded height × aspect ratio.
  const displayHeight = clamp(Math.round(viewportHeight), 1, 16000)
  const scaleRounded = displayHeight / srcH
  const displayWidth = Math.max(1, Math.round(srcW * scaleRounded))
  /** One physical pixel overlap is enough for standard bilinear/nearest tiling without hardcoding screenshot sizes. */
  const seamOverlap = displayWidth > 1 ? 1 : 0
  return {
    scale,
    displayWidth,
    displayHeight,
    tileAdvanceX: Math.max(1, displayWidth - seamOverlap),
  }
}

/** DOM icon sizes (CSS lengths) tuned with the same viewport logic as Phaser scales. */
function domIconSizes(viewportWidth: number, viewportHeight: number, isNarrow: boolean) {
  const vh = Math.max(320, viewportHeight)
  const vw = Math.max(280, viewportWidth)
  const base = clamp(vh / 620, 0.75, 1.35)
  const choicePx = clamp(
    56 + base * 40,
    isNarrow ? 56 : 72,
    isNarrow ? 88 : 104,
  )
  const hudPx = clamp(26 + base * 10, isNarrow ? 24 : 30, isNarrow ? 32 : 40)
  const missionPx = clamp(34 + base * 12, isNarrow ? 32 : 36, isNarrow ? 44 : 52)
  const resultAnimalPx = clamp(72 + base * 18, isNarrow ? 64 : 72, isNarrow ? 88 : 96)
  const resultTraitPx = clamp(36 + base * 6, isNarrow ? 28 : 32, isNarrow ? 44 : 48)

  return {
    choiceCardIcon: `clamp(${clampCssPx(choicePx * 0.85, 52, 96)}, ${(vw / (isNarrow ? 420 : 110)).toFixed(2)}vw, ${clampCssPx(choicePx, 56, 112)})`,
    choiceTraitBadge: `${Math.round(clamp(18 + base * 8, isNarrow ? 18 : 20, isNarrow ? 26 : 30))}px`,
    hudAnimalIcon: clampCssPx(hudPx, isNarrow ? 24 : 30, isNarrow ? 34 : 42),
    missionBadgeIcon: `clamp(${isNarrow ? 32 : 36}px, ${isNarrow ? 3 : 4}vw + 22px, ${missionPx}px)`,
    resultAnimalIcon: `clamp(${isNarrow ? 64 : 72}px, ${isNarrow ? 8 : 10}vw, ${Math.round(resultAnimalPx)}px)`,
    resultTraitIcon: `clamp(${isNarrow ? 28 : 32}px, ${isNarrow ? 4 : 5}vw + 18px, ${Math.round(resultTraitPx)}px)`,
  }
}

export function computeExplorerRescueVisualScale(
  viewportWidth: number,
  viewportHeight: number,
): ExplorerRescueVisualScale {
  const vw = Math.max(280, viewportWidth)
  const vh = Math.max(240, viewportHeight)
  const isNarrow = vw < 768

  /** Shared response curve: larger on roomy desktops, tighter on phones. */
  const hFactor = clamp(vh / 520, isNarrow ? 0.7 : 0.82, isNarrow ? 1.12 : 1.38)

  const clueIconSize = Math.round(
    clamp(
      40 * hFactor + (isNarrow ? 2 : 16),
      isNarrow ? 36 : 52,
      isNarrow ? 48 : 64,
    ),
  )
  const clueGlowRadius = Math.round(clueIconSize * 0.72)
  const clueCollectDistanceX = Math.round(clueIconSize * 0.92)
  const clueCollectDistanceY = Math.round(clueIconSize * 1.36)

  const playerSpriteSize = Math.round(
    clamp(
      48 * hFactor + (isNarrow ? 4 : 18),
      isNarrow ? 44 : 56,
      isNarrow ? 58 : 78,
    ),
  )
  const playerIconSize = Math.round(playerSpriteSize * (11 / 12))
  const playerTokenRadius = Math.round(Math.max(22, playerSpriteSize * 0.58))

  const bodyW = clamp(playerSpriteSize * 0.55, isNarrow ? 26 : 28, isNarrow ? 36 : 44)
  const bodyH = clamp(playerSpriteSize * 0.78, isNarrow ? 34 : 36, isNarrow ? 48 : 56)
  const playerBodyWidth = Math.round(bodyW)
  const playerBodyHeight = Math.round(bodyH)

  const choiceAnimalIconSize = Math.round(
    clamp(
      80 * hFactor + (isNarrow ? -4 : 16),
      isNarrow ? 72 : 90,
      isNarrow ? 92 : 116,
    ),
  )

  const choiceTraitIconSize = Math.round(
    clamp(choiceAnimalIconSize * 0.36, isNarrow ? 22 : 26, isNarrow ? 34 : 42),
  )

  const portalBaseW = 160
  const portalBaseH = 180
  const gateScale = choiceAnimalIconSize / 80
  const choiceGateWidth = Math.round(clamp(portalBaseW * gateScale, isNarrow ? 140 : 160, isNarrow ? 200 : 240))
  const choiceGateHeight = Math.round(clamp(portalBaseH * gateScale, isNarrow ? 155 : 180, isNarrow ? 228 : 270))

  const labelBaseW = 144
  const labelBaseH = 68
  const labelGap = clamp(choiceTraitIconSize / 26, 0.85, 1.65)
  const choiceLabelPanelWidth = Math.round(clamp(labelBaseW * labelGap, isNarrow ? 134 : 150, isNarrow ? 172 : 200))
  const choiceLabelPanelHeight = Math.round(clamp(labelBaseH * labelGap, isNarrow ? 76 : 80, isNarrow ? 100 : 120))

  const choiceNameFontSize = Math.round(
    clamp(
      12 * labelGap,
      isNarrow ? 11 : 12,
      isNarrow ? 14 : 16,
    ),
  )

  const choiceGateSpacing = Math.round(Math.max(260, choiceGateWidth * 1.28))

  const dom = domIconSizes(vw, vh, isNarrow)

  const groundHeight = Math.round(clamp(32 * hFactor, 28, 44))
  const platformHeight = Math.round(clamp(22 * hFactor, 18, 30))

  return {
    playerSpriteSize,
    playerIconSize,
    playerTokenRadius,
    playerBodyWidth,
    playerBodyHeight,
    clueIconSize,
    clueGlowRadius,
    clueCollectDistanceX,
    clueCollectDistanceY,
    choiceAnimalIconSize,
    choiceTraitIconSize,
    choiceGateWidth,
    choiceGateHeight,
    choiceLabelPanelWidth,
    choiceLabelPanelHeight,
    choiceNameFontSize,
    choiceGateSpacing,
    choiceCardImageCss: dom.choiceCardIcon,
    choiceCardTraitIconCss: dom.choiceTraitBadge,
    resultAnimalIconCss: dom.resultAnimalIcon,
    resultTraitIconCss: dom.resultTraitIcon,
    hudAnimalIconCss: dom.hudAnimalIcon,
    missionBadgeIconCss: dom.missionBadgeIcon,
    groundHeight,
    platformHeight,
  }
}
