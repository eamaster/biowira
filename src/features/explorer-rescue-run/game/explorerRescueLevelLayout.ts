// ── Explorer Rescue Run — Horizontal level layout ────────────────────────────
//
// Single place for collectible / platform coordinates and spacing so the scene
// does not scatter magic numbers. World width + gate anchors are derived from
// these coordinates instead of pinning gates to arbitrary `worldWidth - 1000`.
//
export interface ExplorerPlatformDef {
  x: number
  w: number
}

export interface ExplorerRescueWorldMetrics {
  worldWidth: number
  gateStartX: number
  choosePhaseTriggerX: number
}

export const EXPLORER_RESCUE_LEVEL_LAYOUT = {
  clues: [{ x: 380 }, { x: 850 }, { x: 1380 }],
  platforms: [
    { x: 250, w: 140 },
    { x: 480, w: 120 },
    { x: 700, w: 160 },
    { x: 960, w: 120 },
    { x: 1200, w: 140 },
    { x: 1700, w: 120 },
    { x: 1950, w: 150 },
    { x: 2200, w: 140 },
  ] as const satisfies readonly ExplorerPlatformDef[],

  /** Horizontal gap after the trailing edge of furthest obstacle before gate cluster. */
  runAfterLastObstaclePx: 440,
  gateSpacingPx: 260,
  gateCount: 3,
  /** Padding past the trailing gate footprint so bounds / camera settle cleanly. */
  worldEndPastGatesPx: 360,
  /**
   * When player X exceeds this offset from the gate line (while all clues picked),
   * enter the choose overlay. Keeps pacing tight without tying to fuzzy worldWidth offsets.
   */
  choosePhaseGateEntryOffsetPx: 180,
  /**
   * Never produce a narrower world than this × viewport — keeps intro scroll natural on large screens.
   */
  minWorldWidthViewportMultiple: 1.35,
} as const

function maxEdgeX(
  platforms: readonly ExplorerPlatformDef[],
  clues: readonly { x: number }[],
  clueReachHalfPx: number,
): number {
  let edge = 0
  for (const p of platforms) {
    edge = Math.max(edge, p.x + p.w / 2)
  }
  for (const c of clues) {
    edge = Math.max(edge, c.x + clueReachHalfPx)
  }
  return edge
}

/** Footprint half-width roughly matches portal sprite display width (~160px). */
const GATE_HALF_WIDTH_APPROX_PX = 90

export interface ExplorerRescueWorldMetricsOptions {
  /** Defaults keep legacy gameplay metrics tests stable. */
  gateHalfWidthApprox?: number
  /** Horizontal extent from clue X to farthest collectible edge / interaction. */
  clueFootprintHalfPx?: number
  gateSpacingPx?: number
}

export function computeExplorerRescueWorldMetrics(
  viewportWidth: number,
  options?: ExplorerRescueWorldMetricsOptions,
): ExplorerRescueWorldMetrics {
  const L = EXPLORER_RESCUE_LEVEL_LAYOUT
  const gateHalf = options?.gateHalfWidthApprox ?? GATE_HALF_WIDTH_APPROX_PX
  const clueHalf = options?.clueFootprintHalfPx ?? 56
  const gateSpacing = options?.gateSpacingPx ?? L.gateSpacingPx

  const lastObstacleRight = maxEdgeX(L.platforms, L.clues, clueHalf)
  const gateStartX = Math.round(lastObstacleRight + L.runAfterLastObstaclePx)

  const lastGateCenterX =
    gateStartX + Math.max(0, L.gateCount - 1) * gateSpacing
  const gatesRightFootprint =
    lastGateCenterX + gateHalf + L.worldEndPastGatesPx

  const choosePhaseTriggerX = gateStartX + L.choosePhaseGateEntryOffsetPx

  const minFromWorld = gatesRightFootprint
  const minFromViewport = viewportWidth * L.minWorldWidthViewportMultiple
  const worldWidth = Math.max(minFromWorld, minFromViewport, 1200)

  return { worldWidth: Math.ceil(worldWidth), gateStartX, choosePhaseTriggerX }
}
