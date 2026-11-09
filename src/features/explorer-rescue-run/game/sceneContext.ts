/**
 * Thin context bridge between createExplorerRescueGame (Vue side) and
 * ExplorerRescueScene (Phaser side).
 *
 * Phaser auto-starts the first scene in the game config WITHOUT passing the
 * caller's data, so init(data) is called with undefined. This module stores
 * the config before the Phaser.Game constructor is called and clears it on
 * destroy so there is no stale state across re-entries.
 */
import type { GameConfig } from './types'

let _pending: GameConfig | null = null

export function setSceneContext(config: GameConfig): void {
  _pending = config
}

export function getSceneContext(): GameConfig {
  if (!_pending) {
    throw new Error('[ExplorerRescue] Scene context not set — call setSceneContext before creating the game.')
  }
  return _pending
}

export function clearSceneContext(): void {
  _pending = null
}
