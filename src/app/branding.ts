import { ECO_COMICS_LIBRARY_MENU } from '../features/eco-comics/data/ecoComicAssetRegistry'

export const BRANDING = {
  appName: 'BioWira',
  /** SVG preferred for crisp rendering at any display density. */
  wordmark: '/branding/biowira-wordmark.svg',
  /** SVG preferred for crisp in-app icon rendering. */
  appIcon: '/branding/biowira-icon.svg',
  pwaIcon192: '/icons/icon-192.png',
  pwaIcon512: '/icons/icon-512.png',
  appleTouchIcon: '/apple-touch-icon.png',
  favicon: '/favicon.ico',
} as const

// ── Page-specific visual assets ────────────────────────────────────────────────
// Centralised here so components never hardcode public-folder paths.
// To swap or update an asset, change the path here only.
export const HOME_PAGE_ASSETS = {
  /** Child-friendly phrases that rotate in the hero speech bubble. */
  heroPhrases: [
    "Ready to discover amazing animals?",
    "Let's explore wildlife in Malaysia!",
    "Tap a card to begin your adventure!"
  ],

  /**
   * Homepage scene decorations and backgrounds (`/public/backgrounds`).
   * Scenic `url()` layers are applied from `src/styles/_home_scene_paths.scss` (must match these keys).
   */
  homeScene: {
    mobileBackground: '/backgrounds/home-background-mobile.webp',
    tabletBackground: '/backgrounds/home-background-tablet.webp',
    desktopBackground: '/backgrounds/home-background-desktop.webp',
    homeIcon: '/home-page/home.webp',
    gameIcon: '/home-page/game.webp',
    arrowBoard: '/home-page/arrow-navigation-board.webp',
    flowerPlant: '/home-page/flower-plant.webp',
    /** Unused / reserved pixel asset (homepage hero uses scene + text overlay). */
    heroPanel: '/home-page/game-menu-panel.webp',
    /** Wood label ribbon atop dashboard progess-card panels (`HomeWoodRibbon`). */
    ribbon: '/home-page/wood-label-panel-ribbon.webp',
  },

  /** Feature card assets — panel background, icon, and button for each section. */
  featureCards: {
    discover: {
      panel:  '/home-page/discovery-card.webp',
      icon:   '/home-page/discovery-card-icon.webp',
      button: '/home-page/discovery-card-button.webp',
    },
    /**
     * Eco-Comics uses the yellow card assets (same art as the old Fun Facts card).
     * TODO: swap icon for dedicated Eco-Comics art when final assets arrive.
     */
    ecoComics: {
      panel:  '/home-page/facts-card.webp',
      icon:   '/home-page/facts-card-icon.webp',
      button: '/home-page/facts-card-button.webp',
    },
    quiz: {
      panel:  '/home-page/quiz-card.webp',
      icon:   '/home-page/quiz-card-icon.webp',
      button: '/home-page/quiz-card-button.webp',
    },
    missions: {
      panel:  '/home-page/mission-card.webp',
      icon:   '/home-page/mission-card-icon.webp',
      button: '/home-page/mission-card-button.webp',
    },
    rescue: {
      panel:  '/home-page/rescue-card-panel.webp',
      icon:   '/home-page/rescue-card-icon.webp',
      /** Note: source file is named rescue-card_button.webp (underscore, not dash) */
      button: '/home-page/rescue-card_button.webp',
    },
  },

  /** Dashboard / progress panel assets. */
  dashboard: {
    /** Outer progress card panel (note: source filename has typo "progess") */
    progressPanel: '/home-page/progess-card.webp',
    subCard: '/home-page/progress-subcard.webp',
  },
} as const

/** Explorer Rescue Run landing page assets — centralized so no component hardcodes public-folder paths. */
export const EXPLORER_RESCUE_ASSETS = {
  landing: {
    stagePreviewBackground: '/games/explorer-rescue/stage-preview-background.jpg',
    explorerMascot: '/games/explorer-rescue/explorer-mascot.webp',
    passportIcon: '/games/explorer-rescue/passport-icon.webp',
    pawIcon: '/games/explorer-rescue/paw-icon.webp',
    pawTrailIcon: '/games/explorer-rescue/paw-trail-icon.webp',
  },
  gameplay: {
    background: '/games/explorer-rescue/gameplay/game-background.webp',
    portalGate: '/games/explorer-rescue/gameplay/portal-gate.webp',
    vineLogBanner: '/games/explorer-rescue/gameplay/vine-log-banner.webp',
    tigerExplorerSprite: '/games/explorer-rescue/gameplay/tiger-explorer-sprite.webp',
    orangutanExplorerSprite: '/games/explorer-rescue/gameplay/orangutan-explorer-sprite.webp',
    clues: {
      habitatForest: '/games/explorer-rescue/clues/habitat-forest-clue.webp',
      habitatWetlands: '/games/explorer-rescue/clues/habitat-wetlands-clue.webp',
      habitatOcean: '/games/explorer-rescue/clues/habitat-ocean-clue.webp',
      dietCarnivore: '/games/explorer-rescue/clues/diet-carnivore-clue.webp',
      dietHerbivore: '/games/explorer-rescue/clues/diet-herbivore-clue.webp',
      dietInsectivore: '/games/explorer-rescue/clues/diet-insectivore-clue.webp',
      dietOmnivore: '/games/explorer-rescue/clues/diet-omnivore-clue.webp',
      groupMammal: '/games/explorer-rescue/clues/group_mammal-clue.webp',
      groupBird: '/games/explorer-rescue/clues/group-bird-clue.webp',
      groupMarine: '/games/explorer-rescue/clues/group-marine-clue.webp',
      groupReptiles: '/games/explorer-rescue/clues/group-reptiles-clue.webp',
      groupAmphibians: '/games/explorer-rescue/clues/group-amphibians-clue.webp',
      groupInsects: '/games/explorer-rescue/clues/group-insects-clue.webp',
      lifespan: '/games/explorer-rescue/clues/lifespan-clue.webp',
    },
  },
} as const

/**
 * Eco-Comics feature assets.
 * Story-specific scene paths live in ecoComicAssetRegistry.ts (feature-level).
 * This object only holds library-level UI assets (covers, fallbacks).
 */
export const ECO_COMICS_ASSETS = {
  /**
   * Real cover for "The Secret in the Wooden Crate" on the library shelf.
   * Dedicated menu art — reader scenes stay on `secret-wooden-crate` paths.
   */
  storyCover: {
    secretWoodenCrate: ECO_COMICS_LIBRARY_MENU.storybookCover,
  },
  /** Fallback card panel when a story cover is unavailable */
  fallbackCover: HOME_PAGE_ASSETS.featureCards.ecoComics.panel,
  /** Fallback icon when a story icon is unavailable */
  fallbackIcon: HOME_PAGE_ASSETS.featureCards.ecoComics.icon,
} as const

/** Shared rainforest scene visuals for non-home pages (Games, Discover, Quiz, …). Do not duplicate paths. */
export const BIOWIRA_SCENE_ASSETS = {
  rainforestBackground: HOME_PAGE_ASSETS.homeScene.desktopBackground,
  woodRibbon: HOME_PAGE_ASSETS.homeScene.ribbon,
  arrowBoard: HOME_PAGE_ASSETS.homeScene.arrowBoard,
  flowerPlant: HOME_PAGE_ASSETS.homeScene.flowerPlant,
} as const
