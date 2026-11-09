import * as Phaser from 'phaser'
import { ExplorerRescueScene } from './scenes/ExplorerRescueScene'
import { setSceneContext, clearSceneContext } from './sceneContext'
import { resolveRescueExplorerPlayerIconResolution } from '../utils/explorerRescueSprites'
import { findExplorerRescueRunById } from '../data/explorerRescueRunCatalog'
import type { GameConfig } from './types'

let _currentGame: Phaser.Game | null = null

export function createExplorerRescueGame(config: GameConfig): Phaser.Game {
  destroyExplorerRescueGame()

  // Enrich with resolved runner URL + texture kind so preload/mirror logic stay in sync (no URL suffix guesses).
  const resolvedExplorer = resolveRescueExplorerPlayerIconResolution(
    config.round.explorerVisualKey,
    config.round.explorerName,
  )

  const catalogRun = findExplorerRescueRunById(config.rescueRunCatalogId)

  const enrichedConfig: GameConfig = {
    ...config,
    explorerIconUrl: config.explorerIconUrl ?? resolvedExplorer.url,
    explorerPlayerTextureKind: config.explorerPlayerTextureKind ?? resolvedExplorer.kind,
    runnerDiscoveryMirrorInvert:
      config.runnerDiscoveryMirrorInvert ?? catalogRun?.runnerDiscoveryMirrorInvert ?? false,
  }

  // Store config BEFORE the Phaser constructor runs so the scene's preload()
  // and create() can read it via getSceneContext().
  setSceneContext(enrichedConfig)

  const phaserConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: enrichedConfig.parent,
    backgroundColor: '#87CEEB',
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 600 },
        debug: false,
      },
    },
    scene: ExplorerRescueScene,
    render: {
      antialias: false,
      pixelArt: true,
    },
    audio: {
      noAudio: true,
    },
    banner: false,
  }

  try {
    const game = new Phaser.Game(phaserConfig)

    // Wire scene events once Phaser is ready.
    // wrongChoice is NOT routed through onComplete — ExplorerRescueGamePage
    // listens to the scene event directly for UI feedback.
    game.events.once(Phaser.Core.Events.READY, () => {
      const sceneInstance = game.scene.getScene('ExplorerRescueScene') as ExplorerRescueScene | null
      if (!sceneInstance) return

      sceneInstance.events.once('correctChoice', enrichedConfig.callbacks.onComplete)
    })

    _currentGame = game
    return game
  } catch (err) {
    clearSceneContext()
    enrichedConfig.callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    throw err
  }
}

export function destroyExplorerRescueGame(): void {
  if (_currentGame) {
    try {
      _currentGame.destroy(true, false)
    } catch {
      // ignore — game may already be destroyed
    }
    _currentGame = null
  }
  clearSceneContext()
}

/**
 * Sync Phaser Scale.RESIZE with the parent DOM after layout changes (flex, breakpoints, ResizeObserver).
 */
export function refreshExplorerRescueGameLayout(): void {
  if (!_currentGame) return
  try {
    _currentGame.scale.refresh()
  } catch {
    // ignore — game teardown race
  }
}

export function getExplorerRescueScene(): ExplorerRescueScene | null {
  if (!_currentGame) return null
  return _currentGame.scene.getScene('ExplorerRescueScene') as ExplorerRescueScene | null
}
