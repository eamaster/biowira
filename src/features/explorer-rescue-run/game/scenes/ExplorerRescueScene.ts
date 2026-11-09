/// <reference types="phaser" />
import * as Phaser from 'phaser'
import type {
  RescueTrait,
  ExplorerRescueResult,
  GameConfig,
  RescueExplorerPlayerTextureKind,
} from '../types'
import { getSceneContext } from '../sceneContext'
import { getDiscoveryAnimalIconUrl } from '@/app/discoveryAnimalIconRegistry'
import { EXPLORER_RESCUE_ASSETS } from '@/app/branding'
import {
  getExplorerRescueSpritePath,
  rescueExplorerFacingPositiveTowardWorldX,
} from '../../utils/explorerRescueSprites'
import {
  EXPLORER_RESCUE_LEVEL_LAYOUT,
  computeExplorerRescueWorldMetrics,
} from '../explorerRescueLevelLayout'
import {
  computeBackgroundTileLayout,
  computeExplorerRescueVisualScale,
  type ExplorerRescueVisualScale,
} from '../explorerRescueVisualScale'
import { EXPLORER_RESCUE_WRONG_FEEDBACK_MS } from '../explorerRescueChoiceTiming'
import { evaluateWildMatchChoice } from '../../data/rescueTraitResolver'

const SCENE_KEY = 'ExplorerRescueScene'

function scaleGfxToken(pxRef: number): number {
  return Math.min(1.28, Math.max(0.82, pxRef / 52))
}

// ── Asset keys ────────────────────────────────────────────────────────────────
const AK = {
  background:     'game-bg',
  vineLog:        'vine-log',
  portalGate:     'portal-gate',
  /** Dedicated WebP sprite for explorers that have one (resolved per-round via registry). */
  explorerSprite: 'explorer-sprite',
  playerIcon:     'player-icon',
  // Stable key per trait ID — deduplicates loading when the same icon appears
  // on multiple choices (e.g. habitat_forest shared by Malayan Tiger & Hornbill).
  traitIcon:    (traitId: string) => `trait-${traitId}`,
  // Legacy per-position clue keys kept for _createClueLeaves() (collectibles).
  clue:         (idx: number) => `clue-icon-${idx}` as const,
  choiceIcon:   (idx: number) => `choice-icon-${idx}` as const,
}

// ── Colours ───────────────────────────────────────────────────────────────────
const C = {
  sky:           0x87CEEB,
  ground:        0x5B8A3C,
  groundDark:    0x3A5C24,
  log:           0x8B5C2A,
  logDark:       0x5C3810,
  leaf:          0xF5E6C8,
  leafGlow:      0xFFD700,
  vine:          0x5B8A3C,
  vineGlow:      0x7BB85A,
  treeTrunk:     0x5C3810,
  treeFoliage:   0x3A5C24,
  bgMountain:    0x4A7A3A,
  clueCollected: 0xFFD700,
  gateWood:      0x8B5C2A,
  gateActive:    0x5B8A3C,
  gateHover:     0xE8A020,
  gateWrong:     0xF44336,
  gateCorrect:   0x4CAF50,
  textDark:      '#3D2B1F',
  textLight:     '#FFF8E7',
  textGold:      '#E8A020',
  textGreen:     '#5B8A3C',
}

type Leaf = Phaser.GameObjects.Container & { collected?: boolean; trait?: RescueTrait }
type Gate = Phaser.GameObjects.Container & {
  choiceIndex?: number
  activated?: boolean
  feedbackRect?: { lx: number; ly: number; w: number; h: number }
}

export class ExplorerRescueScene extends Phaser.Scene {
  private config!: GameConfig
  private player!: Phaser.GameObjects.Container
  private playerSprite!: Phaser.Physics.Arcade.Sprite
  private playerBody!: Phaser.Physics.Arcade.Body

  private groundGroup!: Phaser.Physics.Arcade.StaticGroup
  private clueLeaves: Leaf[] = []
  private collectedTraits: RescueTrait[] = []

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; up: Phaser.Input.Keyboard.Key }

  private phase: 'running' | 'choosing' | 'result' = 'running'
  /** Until wrong-feedback timeout finishes, gates + Vue overlays must ignore extra taps. */
  private isResolvingChoice = false
  private wrongAttempts = 0
  private selectedGateIndex = -1
  private gates: Gate[] = []
  private vineGraphics!: Phaser.GameObjects.Graphics
  private visualScale!: ExplorerRescueVisualScale
  /** Tiled BG images — destroyed on SCALE resize and rebuilt. */
  private bgTiles: Phaser.GameObjects.Image[] = []
  private fallbackBgGfx: Phaser.GameObjects.Graphics[] = []
  private worldWidth = 2800
  private gateStartX = 0
  private choosePhaseTriggerX = 0
  /** Mirrors `computeExplorerRescueWorldMetrics` gate spacing passed from layout options. */
  private gateSpacingPxUsed!: number
  public mobileLeft = false
  public mobileRight = false
  public mobileJump = false
  private prevMobileJump = false

  /**
   * `true`: runner `scaleX` matches velocity toward +world X (Phaser convention).
   * SVG silhouettes / procedural fallback use inverted semantics; inverted discovery spirits use catalog `runnerDiscoveryMirrorInvert`.
   */
  private playerFacingPositiveTowardWorldX!: boolean

  constructor() {
    super({ key: SCENE_KEY })
  }

  preload() {
    const { gameplay } = EXPLORER_RESCUE_ASSETS

    // Core gameplay images
    this.load.image(AK.background, gameplay.background)
    this.load.image(AK.vineLog, gameplay.vineLogBanner)
    this.load.image(AK.portalGate, gameplay.portalGate)

    // Explorer player sprite — use the registry to load whichever sprite
    // matches the current explorer (malayan-tiger, orangutan, …).
    // Unsupported explorers get no sprite here and fall back to playerIcon.
    const round = getSceneContext().round
    const explorerSpritePath = getExplorerRescueSpritePath(round.explorerVisualKey)
    if (explorerSpritePath) {
      this.load.image(AK.explorerSprite, explorerSpritePath)
    }

    // Explorer player icon (SVG/WebP from icon registry — fallback for unsupported explorers)
    const iconUrl = getSceneContext().explorerIconUrl
    if (iconUrl) {
      if (iconUrl.toLowerCase().endsWith('.svg')) {
        this.load.svg(AK.playerIcon, iconUrl, { width: 64, height: 64 })
      } else {
        this.load.image(AK.playerIcon, iconUrl)
      }
    }

    // Clue icons: collect all unique iconPaths from explorer clueTraits AND
    // every choice's choiceTraits. Use trait.id as the stable texture key so
    // the same icon is never loaded twice even when shared across choices.
    const traitIconsToLoad = new Map<string, string>() // textureKey → publicPath

    for (const trait of round.clueTraits) {
      if (trait.iconPath) traitIconsToLoad.set(AK.traitIcon(trait.id), trait.iconPath)
    }
    for (const choice of round.choices) {
      for (const trait of choice.choiceTraits) {
        if (trait.iconPath) traitIconsToLoad.set(AK.traitIcon(trait.id), trait.iconPath)
      }
    }
    for (const [key, path] of traitIconsToLoad) {
      this.load.image(key, path)
    }

    // Choice animal icons — BioWira discovery spirit WebPs only on canvas (Phaser cannot cite remote photos UX).
    round.choices.forEach((choice, idx) => {
      const url =
        choice.iconUrl ??
        getDiscoveryAnimalIconUrl({ visualKey: choice.visualKey, commonName: choice.name })
      if (url) {
        if (url.toLowerCase().endsWith('.svg')) {
          this.load.svg(AK.choiceIcon(idx), url, { width: 64, height: 64 })
        } else {
          this.load.image(AK.choiceIcon(idx), url)
        }
      }
    })
  }

  create() {
    this.config = getSceneContext()
    this.collectedTraits = []
    this.wrongAttempts = 0
    this.phase = 'running'
    this.isResolvingChoice = false
    this.selectedGateIndex = -1
    this.gates = []
    this.clueLeaves = []

    const W = this.scale.width
    const H = this.scale.height
    this.visualScale = computeExplorerRescueVisualScale(W, H)
    const clueFootprintHalfPx = Math.ceil(this.visualScale.clueIconSize / 2) + 16
    const gateHalfApprox = Math.ceil(this.visualScale.choiceGateWidth / 2) + 24
    this.gateSpacingPxUsed = Math.max(
      EXPLORER_RESCUE_LEVEL_LAYOUT.gateSpacingPx,
      this.visualScale.choiceGateSpacing,
    )
    const metrics = computeExplorerRescueWorldMetrics(W, {
      gateHalfWidthApprox: Math.max(90, gateHalfApprox),
      clueFootprintHalfPx,
      gateSpacingPx: this.gateSpacingPxUsed,
    })
    this.worldWidth = metrics.worldWidth
    this.gateStartX = metrics.gateStartX
    this.choosePhaseTriggerX = metrics.choosePhaseTriggerX

    this.physics.world.setBounds(0, 0, this.worldWidth, H)

    this._createBackground(W, H)
    this._createGround(H)
    this._createPlatforms(H)
    this._createClueLeaves(H)
    this._createPlayer(H)
    this._createChoiceGates(H)
    this._createVineGraphics()
    this._setupInput()
    this._setupCamera(W, H)
    this._setupOverlaps()

    const onResize = (gameSize: Phaser.Structs.Size) => {
      this.visualScale = computeExplorerRescueVisualScale(gameSize.width, gameSize.height)
      this.cameras.main.setDeadzone(gameSize.width * 0.3, gameSize.height)
      this.physics.world.setBounds(0, 0, this.worldWidth, gameSize.height)
      this._rebuildBackgroundTiles(gameSize.width, gameSize.height)
    }
    this.scale.on('resize', onResize)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', onResize)
      this.bgTiles.forEach((t) => t.destroy())
      this.bgTiles = []
    })

    this.config.callbacks.onReady()
  }

  update() {
    if (this.phase !== 'running') return

    const body = this.playerBody
    const onGround = body.blocked.down

    const goLeft = this.cursors.left.isDown || this.wasd.left.isDown || this.mobileLeft
    const goRight = this.cursors.right.isDown || this.wasd.right.isDown || this.mobileRight
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
      (!this.prevMobileJump && this.mobileJump)
    this.prevMobileJump = this.mobileJump

    if (goLeft) {
      body.setVelocityX(-220)
      this._orientPlayerTowardWorld(-1)
    } else if (goRight) {
      body.setVelocityX(220)
      this._orientPlayerTowardWorld(1)
    } else {
      body.setVelocityX(0)
    }

    if (jumpPressed && onGround) {
      body.setVelocityY(-480)
      this.events.emit('playerJumped')
    }

    const fallLine = this.scale.height + Math.round(this.visualScale.playerSpriteSize * 0.85)
    const px = this.playerSprite.x
    const py = this.playerSprite.y
    if (py > fallLine) {
      const standY =
        this.scale.height - this.visualScale.groundHeight - Math.round(this.visualScale.playerBodyHeight * 0.55)
      body.reset(Math.max(50, px - Math.round(this.visualScale.playerSpriteSize * 2)), standY)
    }

    this._animatePlayer()
    this._animateLeaves()
  }

  // ── Background ───────────────────────────────────────────────────────────────
  private _createBackground(_W: number, H: number) {
    this._clearBgLayers()
    if (this.textures.exists(AK.background)) {
      this._spawnBackgroundTiles(H)
      return
    }
    // Fallback: drawn background
    const g = this._drawFallbackBackground(H)
    this.fallbackBgGfx.push(g)
  }

  private _clearBgLayers() {
    for (const tile of this.bgTiles) tile.destroy()
    this.bgTiles = []
    for (const g of this.fallbackBgGfx) g.destroy()
    this.fallbackBgGfx = []
  }

  private _spawnBackgroundTiles(H: number) {
    const bgTexture = this.textures.get(AK.background)
    const bgImg = bgTexture.getSourceImage()
    const srcW = (bgImg as HTMLImageElement).naturalWidth || bgImg.width || 1280
    const srcH = (bgImg as HTMLImageElement).naturalHeight || bgImg.height || 720
    const layout = computeBackgroundTileLayout(srcW, srcH, H, this.worldWidth)
    const dw = layout.displayWidth
    const dh = layout.displayHeight
    const step = layout.tileAdvanceX
    const pad = dw
    const startX = -pad
    const endX = this.worldWidth + pad
    const bottomY = Math.round(H)

    let i = 0
    for (;;) {
      const xRaw = startX + i * step
      if (xRaw > endX) break
      const x = Math.round(xRaw)
      const img = this.add.image(x, bottomY, AK.background).setOrigin(0, 1).setDepth(-10)
      img.setDisplaySize(dw, dh)
      img.setScrollFactor(0.4)
      this.bgTiles.push(img)
      i += 1
    }
  }

  private _rebuildBackgroundTiles(_W: number, H: number) {
    if (!this.textures.exists(AK.background)) return
    for (const tile of this.bgTiles) tile.destroy()
    this.bgTiles = []
    this._spawnBackgroundTiles(H)
  }

  private _drawFallbackBackground(H: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics()
    g.fillStyle(0x87CEEB).fillRect(0, 0, this.worldWidth, H * 0.55)
    g.fillStyle(0xB8D4A8).fillRect(0, H * 0.55, this.worldWidth, H * 0.45)

    const mtnCount = Math.ceil(this.worldWidth / 280) + 1
    g.fillStyle(C.bgMountain, 0.5)
    for (let i = 0; i < mtnCount; i++) {
      const x = i * 280
      const mH = 80 + (i % 3) * 30
      g.fillTriangle(x, H * 0.55, x + 140, H * 0.55 - mH, x + 280, H * 0.55)
    }

    const treePositions = [120, 320, 600, 900, 1150, 1450, 1700, 1950, 2200, 2500, 2700]
    for (const tx of treePositions) {
      this._drawTree(g, tx, H * 0.55, 40 + Math.sin(tx) * 10, H * 0.15)
    }
    g.setScrollFactor(0.4)
    return g
  }

  private _drawTree(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    g.fillStyle(C.treeTrunk).fillRect(x - 5, y - h * 0.3, 10, h * 0.35)
    g.fillStyle(C.treeFoliage)
    g.fillTriangle(x - w * 0.5, y - h * 0.3, x, y - h, x + w * 0.5, y - h * 0.3)
    g.fillTriangle(x - w * 0.4, y - h * 0.5, x, y - h * 1.15, x + w * 0.4, y - h * 0.5)
  }

  // ── Ground ───────────────────────────────────────────────────────────────────
  private _createGround(H: number) {
    const groundH = this.visualScale.groundHeight
    this.groundGroup = this.physics.add.staticGroup()
    const groundY = H - groundH / 2

    // When the gameplay background image is present, it already depicts terrain —
    // only draw procedural ground strips when the texture is missing.
    const hasGameplayBg = this.textures.exists(AK.background)
    if (!hasGameplayBg) {
      const gfx = this.add.graphics()
      gfx.fillStyle(C.ground).fillRect(0, H - groundH, this.worldWidth, groundH)
      gfx.fillStyle(C.groundDark).fillRect(0, H - groundH, this.worldWidth, 4)
      const decoStep = Math.max(16, Math.round(groundH * 0.72))
      for (let i = 0; i < this.worldWidth; i += decoStep) {
        gfx.fillStyle(0x7BB85A, 0.7).fillRect(i, H - groundH - 4, Math.round(decoStep * 0.35), 6)
      }
    }

    const groundBody = this.groundGroup.create(this.worldWidth / 2, groundY) as Phaser.Physics.Arcade.Sprite
    groundBody.setVisible(false).refreshBody()
    ;(groundBody.body as Phaser.Physics.Arcade.StaticBody).setSize(this.worldWidth, groundH)
  }

  // ── Platforms ────────────────────────────────────────────────────────────────
  private _createPlatforms(H: number) {
    const groundH = this.visualScale.groundHeight
    const platBodyH = Math.max(14, Math.round(this.visualScale.platformHeight * 0.85))
    const groundY = H - groundH
    const PLATFORM_Y_WAVE = [-90, -140, -80, -120, -90, -130, -80, -110] as const
    const extraLift = Math.max(0, Math.round((groundH + this.visualScale.playerBodyHeight - 76) * 0.55))
    const platforms = EXPLORER_RESCUE_LEVEL_LAYOUT.platforms.map((p, i) => ({
      x: p.x,
      w: p.w,
      y: groundY + (PLATFORM_Y_WAVE[i % PLATFORM_Y_WAVE.length] ?? -90) - extraLift,
    }))

    const hasVineLog = this.textures.exists(AK.vineLog)
    const gfx = hasVineLog ? null : this.add.graphics()
    const logH = this.visualScale.platformHeight

    for (const p of platforms) {
      if (hasVineLog) {
        const logImg = this.add.image(p.x, p.y + Math.round(logH * 0.35), AK.vineLog)
        logImg.setDisplaySize(p.w, logH)
        logImg.setDepth(2)
      } else if (gfx) {
        gfx.fillStyle(C.log).fillRect(p.x - p.w / 2, p.y, p.w, platBodyH)
        gfx.fillStyle(C.logDark).fillRect(p.x - p.w / 2, p.y, p.w, 4)
        gfx.fillStyle(C.ground, 0.6).fillRect(p.x - p.w / 2, p.y, p.w, 4)
      }

      const plat = this.groundGroup.create(p.x, p.y + Math.round(logH * 0.45)) as Phaser.Physics.Arcade.Sprite
      plat.setVisible(false).refreshBody()
      ;(plat.body as Phaser.Physics.Arcade.StaticBody).setSize(p.w, platBodyH)
    }
  }

  // ── Clue leaves ──────────────────────────────────────────────────────────────
  private _createClueLeaves(H: number) {
    const groundH = this.visualScale.groundHeight
    const lift = Math.max(0, Math.round((groundH + this.visualScale.clueIconSize - 40) * 0.42))
    const groundY = H - groundH
    const cueXs = EXPLORER_RESCUE_LEVEL_LAYOUT.clues.map((c) => c.x)
    const positions = cueXs.map((x, idx) => ({
      x,
      y: groundY - [120, 100, 140][idx]! - lift,
    }))

    const glowR = this.visualScale.clueGlowRadius
    const clueSize = this.visualScale.clueIconSize

    for (let i = 0; i < 3; i++) {
      const pos = positions[i]!
      const trait = this.config.round.clueTraits[i]!
      const container = this.add.container(pos.x, pos.y) as Leaf

      const glow = this.add.graphics()
      glow.fillStyle(C.leafGlow, 0.3).fillCircle(0, 0, glowR)
      glow.lineStyle(2, C.leafGlow, 0.8).strokeCircle(0, 0, glowR)

      const clueKey = this.textures.exists(AK.traitIcon(trait.id))
        ? AK.traitIcon(trait.id)
        : AK.clue(i)
      if (this.textures.exists(clueKey)) {
        const clueImg = this.add.image(0, -4, clueKey).setDisplaySize(clueSize, clueSize)
        container.add([glow, clueImg])
      } else {
        const leaf = this.add.graphics()
        const leafRw = clueSize * 0.62
        const leafRh = clueSize * 0.82
        leaf.fillStyle(C.ground).fillEllipse(0, 0, leafRw, leafRh)
        leaf.fillStyle(C.vineGlow, 0.7).fillEllipse(0, 0, leafRw * 0.65, leafRh * 0.7)

        const emojiPx = `${Math.round(clueSize * 0.42)}px`
        const label = this.add.text(0, Math.round(clueSize * 0.55), trait.emoji, {
          fontSize: emojiPx,
          align: 'center',
        }).setOrigin(0.5)

        container.add([glow, leaf, label])
      }

      container.collected = false
      container.trait = trait
      container.setDepth(3)
      this.clueLeaves.push(container)
    }
  }

  // ── Player ───────────────────────────────────────────────────────────────────
  private _createPlayer(H: number) {
    const startX = 60
    const groundH = this.visualScale.groundHeight
    const standY = H - groundH - Math.round(this.visualScale.playerBodyHeight * 0.55)

    this.player = this.add.container(startX, standY)

    const tk = this.visualScale.playerTokenRadius
    const bg = this.add.graphics()
    bg.fillStyle(0xFFF8E7, 1).fillCircle(0, -8, tk)
    bg.lineStyle(3, 0xC8A870, 1).strokeCircle(0, -8, tk)

    const useExplorerSprite = this.textures.exists(AK.explorerSprite)
    const usePlayerIcon = !useExplorerSprite && this.textures.exists(AK.playerIcon)

    const effectiveRunnerKind: RescueExplorerPlayerTextureKind = useExplorerSprite
      ? 'dedicated_gameplay'
      : usePlayerIcon
        ? (this.config.explorerPlayerTextureKind ?? 'discovery_raster')
        : 'none'

    this.playerFacingPositiveTowardWorldX = rescueExplorerFacingPositiveTowardWorldX({
      textureKind: effectiveRunnerKind,
      runnerDiscoveryMirrorInvert: this.config.runnerDiscoveryMirrorInvert,
    })

    const sp = this.visualScale.playerSpriteSize
    const ip = this.visualScale.playerIconSize

    if (useExplorerSprite) {
      const icon = this.add.image(0, -8, AK.explorerSprite).setDisplaySize(sp, sp)
      this.player.add([bg, icon])
    } else if (usePlayerIcon) {
      const icon = this.add.image(0, -8, AK.playerIcon).setDisplaySize(ip, ip)
      this.player.add([bg, icon])
    } else {
      const body = this.add.graphics()
      this._drawAnimalToken(body, this.config.round.explorerVisualKey, sp)
      this.player.add([bg, body])
    }

    this.player.setDepth(10)

    this.playerSprite = this.physics.add.sprite(startX, standY, '')
    this.playerSprite.setVisible(false)
    this.playerSprite.setCollideWorldBounds(true)
    this.playerSprite.setGravityY(200)
    ;(this.playerSprite.body as Phaser.Physics.Arcade.Body).setSize(
      this.visualScale.playerBodyWidth,
      this.visualScale.playerBodyHeight,
    )
    this.playerSprite.setDepth(10)
    this.playerBody = this.playerSprite.body as Phaser.Physics.Arcade.Body

    this.events.on('postupdate', () => {
      this.player.setPosition(this.playerSprite.x, this.playerSprite.y)
    })

    this._orientPlayerTowardWorld(1)
  }

  private _drawAnimalToken(g: Phaser.GameObjects.Graphics, _visualKey: string, spriteRef: number) {
    const z = scaleGfxToken(spriteRef)
    g.fillStyle(0xE8A020).fillCircle(0, -4, 14 * z)
    g.fillStyle(0xC68B3A).fillRect(-12 * z, 2 * z, 24 * z, 16 * z)
    g.fillStyle(0xE8A020).fillRect(-16 * z, 6 * z, 6 * z, 10 * z)
    g.fillStyle(0xE8A020).fillRect(10 * z, 6 * z, 6 * z, 10 * z)
    g.fillStyle(0xC68B3A).fillRect(-8 * z, 18 * z, 6 * z, 10 * z)
    g.fillStyle(0xC68B3A).fillRect(2 * z, 18 * z, 6 * z, 10 * z)
    g.fillStyle(0x3D2B1F).fillRect(-5 * z, -8 * z, 3 * z, 3 * z)
    g.fillStyle(0x3D2B1F).fillRect(2 * z, -8 * z, 3 * z, 3 * z)
    g.fillStyle(0x3D2B1F).fillCircle(0, -3 * z, 2 * z)
  }

  // ── Choice gates ─────────────────────────────────────────────────────────────
  private _createChoiceGates(H: number) {
    const gw = this.visualScale.choiceGateWidth
    const gh = this.visualScale.choiceGateHeight
    const groundH = this.visualScale.groundHeight
    const gateLift =
      Math.max(110, Math.round(gh * 0.52 + this.visualScale.choiceAnimalIconSize * 0.18))
    const gateY = H - groundH - gateLift
    const startX = this.gateStartX
    const spacing = this.gateSpacingPxUsed

    const hasPortal = this.textures.exists(AK.portalGate)
    const PW = this.visualScale.choiceLabelPanelWidth
    const PH = this.visualScale.choiceLabelPanelHeight
    const iconSize = this.visualScale.choiceTraitIconSize
    const slot = Math.round(PW * 0.28)
    const offsets = [-slot, 0, slot]
    const nameFontPx = `${this.visualScale.choiceNameFontSize}px`
    const wordWrap = Math.max(96, PW - 12)
    const iconY = 14 + Math.round(PH * 0.58)
    const portalImgY = -Math.round(gh / 3)
    const animalY = -Math.round(this.visualScale.choiceAnimalIconSize * 0.48)
    const archLeft = -gw / 2
    const archTop = -Math.round(gh * (2 / 3))

    for (let i = 0; i < EXPLORER_RESCUE_LEVEL_LAYOUT.gateCount; i++) {
      const choice = this.config.round.choices[i]!
      const x = startX + i * spacing
      const container = this.add.container(x, gateY) as Gate

      let archGfx: Phaser.GameObjects.Graphics | null = null

      if (hasPortal) {
        const gateImg = this.add.image(0, portalImgY, AK.portalGate).setDisplaySize(gw, gh)
        gateImg.setDepth(0)
        container.add(gateImg)
      } else {
        archGfx = this.add.graphics()
        archGfx.lineStyle(4, C.gateWood, 1)
        archGfx.strokeRect(archLeft, archTop, gw, gh)
        archGfx.fillStyle(0x3A5C24, 0.3).fillRect(archLeft, archTop, gw, gh)
        container.add(archGfx)
      }

      const choiceIconKey = AK.choiceIcon(i)
      const ca = this.visualScale.choiceAnimalIconSize
      let animalSprite: Phaser.GameObjects.GameObject
      if (this.textures.exists(choiceIconKey)) {
        animalSprite = this.add.image(0, animalY, choiceIconKey).setDisplaySize(ca, ca)
      } else {
        const animalGfx = this.add.graphics()
        this._drawSmallAnimalToken(animalGfx, choice.visualKey, ca)
        animalSprite = animalGfx
      }

      const nameBg = this.add.graphics()
      nameBg.fillStyle(0x000000, 0.6).fillRoundedRect(-PW / 2, 14, PW, PH, 6)

      const nameText = this.add.text(0, 18, choice.name.toUpperCase(), {
        fontFamily: '"Nunito", Arial, sans-serif',
        fontSize: nameFontPx,
        fontStyle: 'bold',
        color: C.textLight,
        align: 'center',
        wordWrap: { width: wordWrap },
      }).setOrigin(0.5, 0)

      const traitObjects: Phaser.GameObjects.GameObject[] = []
      const traits = choice.choiceTraits.slice(0, 3)
      for (let ti = 0; ti < 3; ti++) {
        const trait = traits[ti]
        const ix = offsets[ti] ?? 0

        if (trait) {
          const traitKey = AK.traitIcon(trait.id)
          if (this.textures.exists(traitKey)) {
            const ico = this.add.image(ix, iconY, traitKey).setDisplaySize(iconSize, iconSize)
            traitObjects.push(ico)
          } else {
            const emoji = this.add.text(ix, iconY, trait.emoji, {
              fontSize: `${iconSize}px`,
              align: 'center',
            }).setOrigin(0.5)
            traitObjects.push(emoji)
          }
        }
      }

      container.add([animalSprite, nameBg, nameText, ...traitObjects])
      container.choiceIndex = i
      container.activated = false
      container.setDepth(5)
      container.feedbackRect = { lx: archLeft, ly: archTop, w: gw, h: gh }

      const hitW = Math.max(gw, ca + 12)
      const hitH = Math.max(gh, PH + ca + 40)
      container.setSize(hitW, hitH)
      container.setInteractive({ useHandCursor: true })

      if (archGfx) {
        const paintArch = (wood: number, fill: number, fillAlpha: number) => {
          archGfx!.clear()
          archGfx!.lineStyle(4, wood, 1).strokeRect(archLeft, archTop, gw, gh)
          archGfx!.fillStyle(fill, fillAlpha).fillRect(archLeft, archTop, gw, gh)
        }
        container.on('pointerover', () => {
          if (!container.activated && archGfx) paintArch(C.gateHover, 0xE8A020, 0.2)
        })
        container.on('pointerout', () => {
          if (!container.activated && archGfx) paintArch(C.gateWood, 0x3A5C24, 0.3)
        })
      }

      container.on('pointerdown', () => {
        if (this.phase !== 'choosing' || container.activated || this.isResolvingChoice) return
        this._handleGateClick(i)
      })

      this.gates.push(container)
    }
  }

  private _drawSmallAnimalToken(g: Phaser.GameObjects.Graphics, _visualKey: string, sz: number) {
    const z = scaleGfxToken(sz) * (sz / 80)
    g.fillStyle(0xE8A020).fillCircle(0, -20, 10 * z)
    g.fillStyle(0xC68B3A).fillRect(-8 * z, -12 * z, 16 * z, 12 * z)
    g.fillStyle(0x3D2B1F).fillRect(-4 * z, -23 * z, 2 * z, 2 * z)
    g.fillStyle(0x3D2B1F).fillRect(2 * z, -23 * z, 2 * z, 2 * z)
    g.fillStyle(0x3D2B1F).fillCircle(0, -18 * z, 1.5 * z)
  }

  // ── Vine graphics ─────────────────────────────────────────────────────────────
  private _createVineGraphics() {
    this.vineGraphics = this.add.graphics().setDepth(20)
  }

  // ── Input ────────────────────────────────────────────────────────────────────
  private _setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    }
  }

  // ── Camera ───────────────────────────────────────────────────────────────────
  private _setupCamera(W: number, H: number) {
    const cam = this.cameras.main
    cam.setBounds(0, 0, this.worldWidth, H)
    cam.setDeadzone(W * 0.3, H)
    cam.startFollow(this.player, true, 0.08, 0.08)
    cam.setZoom(1)
  }

  // ── Overlaps ─────────────────────────────────────────────────────────────────
  private _setupOverlaps() {
    this.physics.add.collider(this.playerSprite, this.groundGroup)

    this.events.on('postupdate', () => {
      if (this.phase !== 'running') return
      const px = this.playerSprite.x
      const py = this.playerSprite.y

      for (const leaf of this.clueLeaves) {
        if (leaf.collected) continue
        const dx = Math.abs(leaf.x - px)
        const dy = Math.abs(leaf.y - py)
        if (dx < this.visualScale.clueCollectDistanceX && dy < this.visualScale.clueCollectDistanceY) {
          this._collectLeaf(leaf)
        }
      }

      if (px > this.choosePhaseTriggerX && this.collectedTraits.length === 3) {
        this._enterChoosePhase()
      }
    })
  }

  // ── Leaf collection ───────────────────────────────────────────────────────────
  private _collectLeaf(leaf: Leaf) {
    if (leaf.collected) return
    leaf.collected = true

    if (leaf.trait) {
      this.collectedTraits.push(leaf.trait)
    }

    this.tweens.add({
      targets: leaf,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => leaf.setVisible(false),
    })

    this.cameras.main.flash(200, 255, 215, 0, false)
    this._emitClueUpdate()
  }

  private _emitClueUpdate() {
    this.events.emit('clueCollected', this.collectedTraits.length)
  }

  // ── Phase: choosing ──────────────────────────────────────────────────────────
  private _enterChoosePhase() {
    if (this.phase === 'choosing') return
    this.phase = 'choosing'
    this._setChoiceGateInputEnabled(false)
    this.events.emit('enterChoose')

    if (this.playerBody) {
      this.playerBody.setVelocityX(0)
      this.playerBody.setEnable(false)
    }
  }

  /** Vue choosing overlay owns card picks — Phaser gates must not steal trait-row clicks. */
  private _setChoiceGateInputEnabled(enabled: boolean): void {
    for (const gate of this.gates) {
      if (enabled) {
        gate.setInteractive({ useHandCursor: true })
      } else {
        gate.disableInteractive()
      }
    }
  }

  public chooseMatch(index: number) {
    this._handleGateClick(index)
  }

  private _handleGateClick(index: number) {
    if (index < 0 || index >= this.config.round.choices.length) return
    if (this.phase !== 'choosing') return
    if (this.isResolvingChoice || this.selectedGateIndex !== -1) return

    const choice = this.config.round.choices[index]
    const gate = this.gates[index]
    if (!choice || !gate) return

    this.isResolvingChoice = true
    this.selectedGateIndex = index

    const { isMatch, sharedTraits } = evaluateWildMatchChoice(this.config.round.clueTraits, choice)

    if (isMatch) {
      gate.activated = true
      this.phase = 'result'
      this._setChoiceGateInputEnabled(false)
      this._showCorrectFeedback(gate, choice, sharedTraits)
    } else {
      this.wrongAttempts++
      gate.activated = false
      this._showWrongFeedback(gate)
    }
  }

  private _gateFeedbackLocalRect(gate: Gate): { lx: number; ly: number; w: number; h: number } {
    return gate.feedbackRect ?? { lx: -80, ly: -120, w: 160, h: 160 }
  }

  private _gateFeedbackWorldRect(gate: Gate): { wx: number; wy: number; w: number; h: number } {
    const r = this._gateFeedbackLocalRect(gate)
    return { wx: gate.x + r.lx, wy: gate.y + r.ly, w: r.w, h: r.h }
  }

  private _showWrongFeedback(gate: Gate) {
    const lr = this._gateFeedbackLocalRect(gate)
    const wr = this._gateFeedbackWorldRect(gate)
    const hasPortal = this.textures.exists(AK.portalGate)
    if (!hasPortal) {
      const gfx = gate.getAt(0) as Phaser.GameObjects.Graphics
      gfx.clear()
      gfx.lineStyle(4, C.gateWrong, 1).strokeRect(lr.lx, lr.ly, lr.w, lr.h)
      gfx.fillStyle(0xF44336, 0.25).fillRect(lr.lx, lr.ly, lr.w, lr.h)

      this.time.delayedCall(800, () => {
        gfx.clear()
        gfx.lineStyle(4, C.gateWood, 1).strokeRect(lr.lx, lr.ly, lr.w, lr.h)
        gfx.fillStyle(0x3A5C24, 0.3).fillRect(lr.lx, lr.ly, lr.w, lr.h)
      })
    } else {
      const overlay = this.add.graphics()
      overlay.fillStyle(0xF44336, 0.4).fillRect(wr.wx, wr.wy, wr.w, wr.h)
      overlay.setDepth(6)
      this.time.delayedCall(800, () => overlay.destroy())
    }

    this.events.emit('wrongChoice')

    this.time.delayedCall(EXPLORER_RESCUE_WRONG_FEEDBACK_MS, () => {
      if (gate) gate.activated = false
      this.selectedGateIndex = -1
      this.isResolvingChoice = false
      if (this.phase === 'choosing') {
        this._setChoiceGateInputEnabled(false)
      }
    })
  }

  private _showCorrectFeedback(
    gate: Gate,
    choice: { animalId: string; name: string; visualKey: string },
    sharedTraits: RescueTrait[],
  ) {
    const lr = this._gateFeedbackLocalRect(gate)
    const wr = this._gateFeedbackWorldRect(gate)
    const hasPortal = this.textures.exists(AK.portalGate)
    if (!hasPortal) {
      const gfx = gate.getAt(0) as Phaser.GameObjects.Graphics
      gfx.clear()
      gfx.lineStyle(4, C.gateCorrect, 1).strokeRect(lr.lx, lr.ly, lr.w, lr.h)
      gfx.fillStyle(0x4CAF50, 0.3).fillRect(lr.lx, lr.ly, lr.w, lr.h)
    } else {
      const overlay = this.add.graphics()
      overlay.fillStyle(0x4CAF50, 0.35).fillRect(wr.wx, wr.wy, wr.w, wr.h)
      overlay.setDepth(6)
    }

    this.cameras.main.flash(300, 255, 215, 0, false)
    this._drawVineConnection()

    const isFirst = this.config.isFirstCompletion
    const pointsEarned = isFirst
      ? this.config.round.rewards.firstCompletionLeafPoints
      : this.config.round.rewards.replayLeafPoints

    const restorationBefore = this.config.restorationBefore
    const restorationAfter = isFirst
      ? Math.min(100, restorationBefore + this.config.round.rewards.restorationIncrease)
      : restorationBefore

    const result: ExplorerRescueResult = {
      profileId: this.config.profileId,
      rescueRunCatalogId: this.config.rescueRunCatalogId,
      explorerAnimalId: this.config.round.explorerAnimalId,
      explorerName: this.config.round.explorerName,
      explorerVisualKey: this.config.round.explorerVisualKey,
      chosenMatchAnimalId: choice.animalId,
      chosenMatchName: choice.name,
      chosenMatchVisualKey: choice.visualKey,
      isCorrect: true,
      sharedTraits,
      pointsEarned,
      restorationBefore,
      restorationAfter,
      journalStamp: this.config.round.rewards.journalStamp,
      isFirstCompletion: isFirst,
      completedAt: new Date().toISOString(),
    }

    this.time.delayedCall(600, () => {
      this.events.emit('correctChoice', result)
    })
  }

  private _drawVineConnection() {
    const g = this.vineGraphics
    g.clear()

    if (this.gates.length === 0) return
    const correctGate = this.gates[this.selectedGateIndex] ?? this.gates.find((gate) => {
      const idx = gate.choiceIndex ?? 0
      const gateChoice = this.config.round.choices[idx]
      return gateChoice && evaluateWildMatchChoice(this.config.round.clueTraits, gateChoice).isMatch
    })
    if (!correctGate) return

    const px = this.player.x
    const py = this.player.y
    const gx = correctGate.x
    const gy = correctGate.y - 20
    const mx = (px + gx) / 2
    const my = Math.min(py, gy) - 60

    g.lineStyle(4, C.vineGlow, 1)
    g.beginPath()
    g.moveTo(px, py)
    g.lineTo(mx - 30, my)
    g.lineTo(mx + 30, my)
    g.lineTo(gx, gy)
    g.strokePath()

    const dots = 5
    for (let i = 0; i <= dots; i++) {
      const tVal = i / dots
      const dx = px + (gx - px) * tVal
      const dy = py + (gy - py) * tVal - Math.sin(tVal * Math.PI) * 60
      g.fillStyle(C.leafGlow, 0.9)
      g.fillCircle(dx, dy, 4)
    }
  }

  // ── Animations ───────────────────────────────────────────────────────────────
  /**
   * Turn the explorer horizontally so they visually face velocity sign in world (+X runs right toward objectives).
   * Mirrors {@link rescueExplorerFacingPositiveTowardWorldX} (Phaser texture kind + optional catalog inversion).
   */
  private _orientPlayerTowardWorld(directionSignX: -1 | 1): void {
    this.player.scaleX = this.playerFacingPositiveTowardWorldX ? directionSignX : -directionSignX
  }

  private _animatePlayer() {
    const body = this.playerBody
    if (!body.blocked.down) {
      this.player.scaleY = body.velocity.y < 0 ? 1.15 : 0.9
    } else {
      this.player.scaleY = 1
    }
  }

  private _animateLeaves() {
    const t = this.time.now / 600
    for (let i = 0; i < this.clueLeaves.length; i++) {
      const leaf = this.clueLeaves[i]!
      if (!leaf.collected) {
        leaf.y += Math.sin(t + i) * 0.3
      }
    }
  }

  getPhase() { return this.phase }
  getCollectedCount() { return this.collectedTraits.length }
  getCollectedTraits() { return [...this.collectedTraits] }
}
