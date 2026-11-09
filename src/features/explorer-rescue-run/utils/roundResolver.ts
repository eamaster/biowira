// ── LEGACY / TEST-ONLY ────────────────────────────────────────────────────────
//
// This module is DEPRECATED for production runtime use.
//
// Production code (ExplorerRescueGamePage.vue, explorerRescueProgress.ts,
// ExplorerRescueScene.ts) must use `loadExplorerRescueRound` from
// `../data/explorerRescueRoundBuilder` instead.
//
// This file is kept ONLY so that existing unit tests that test legacy round
// data integrity can continue to import it without being broken. It must NOT
// be imported by any Vue page, Pinia store, or Phaser scene.

import { getRoundForExplorer } from '../data/explorerRescueRounds'
import type { ExplorerRescueRound } from '../game/types'

const FALLBACK_EXPLORER_ID = 'malayan-tiger'

/** @deprecated Use loadExplorerRescueRound from explorerRescueRoundBuilder instead. */
export function resolveRound(explorerAnimalId: string | null | undefined): ExplorerRescueRound {
  const id = explorerAnimalId ?? FALLBACK_EXPLORER_ID
  return getRoundForExplorer(id)
}
