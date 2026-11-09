// ============================================================
// BioWira Game Journal — Asset Registry
//
// Single source of truth for all journal WEBP sprites.
// All paths point to public/games/journal-book/*.
// Components NEVER hardcode public-folder paths.
// To swap an asset, change the path here only.
//
// No reference to BIOWIRA_UI_REFERENCES at runtime.
// ============================================================

import type { GameJournalCategoryId } from '@/domain/gameJournal'
import { resolveClueVisualByDisplayLabel } from '@/features/explorer-rescue-run/data/explorerRescueClues'

// ── Shared book frame and navigation assets ───────────────────────────────────

const J = '/games/journal-book'

export const GAME_JOURNAL_ASSETS = {
  shared: {
    /** Compact open-book frame (≈1335×604) — optional / legacy; journal menu uses bookFrameWide */
    bookFrameCompact: `${J}/journal_book_1.webp`,
    /** Wide open-book frame (≈1866×757) — stamp pages + journal category menu */
    bookFrameWide:    `${J}/journal_book_2.webp`,
    /** Left page-flip arrow */
    leftArrow:        `${J}/journal_book_left_arrow.webp`,
    /** Right page-flip arrow */
    rightArrow:       `${J}/journal_book_right_arrow.webp`,
    /** Journal Book object sprite for Games Menu CTA */
    journalBookSprite:`${J}/journal_book_sprite.webp`,
  },

  menu: {
    /** Nature Mission category card sprite */
    natureMissionCard:    `${J}/journal-menu/journal_menu_nature_mission_card.webp`,
    /** Eco-Comic category card sprite */
    ecoComicCard:         `${J}/journal-menu/journal_menu_eco_comic_card.webp`,
    /** Explorer Rescue Run category card sprite */
    explorerRescueRunCard:`${J}/journal-menu/journal_menu_explorer_rescue_run_card.webp`,
  },

  ecoComic: {
    /** Grey padlocked stamp used for locked Eco-Comic endings */
    lockedStamp:    `${J}/eco-comic/eco_comic_locked_stamp.webp`,
    /** "Rescued Animal" pangolin polaroid card for the left page */
    pangolinCard:   `${J}/eco-comic/eco_comic_pangolin_card.webp`,
    /** Crate+pangolin decorative icon for Story Description area */
    descriptionIcon:`${J}/eco-comic/eco_comic_pangolin_description_icon.webp`,
    stamps: {
      /** Family Team Hero — first ending */
      familyTeamHero:      `${J}/eco-comic/eco_comic_stamp1.webp`,
      /** Pangolin Guardian — second ending */
      pangolinGuardian:    `${J}/eco-comic/eco_comic_stamp2.webp`,
      /** Wildlife Secret Agent — third ending */
      wildlifeSecretAgent: `${J}/eco-comic/eco_comic_stamp3.webp`,
    },
  },

  explorerRescueRun: {
    /** Clue panel background/frame for Shared Clue Badges */
    cluePanel:             `${J}/explorer-rescue-run/explorer_rescue_run_clue_panel.webp`,
    /** Frog/toad animal card (left page) */
    frogCard:              `${J}/explorer-rescue-run/explorer_rescue_run_frog_card.webp`,
    /** Frog/toad rescue stamp (center page) */
    frogStamp:             `${J}/explorer-rescue-run/explorer_rescue_run_frog_stamp.webp`,
    /** Sun Bear + Bornean Orangutan animal card (left page) */
    sunbearOrangutanCard:  `${J}/explorer-rescue-run/explorer_rescue_run_sunbear_orangutan_card.webp`,
    /** Sun Bear rescue stamp standalone (center page) */
    sunbearStamp:          `${J}/explorer-rescue-run/explorer_rescue_run_sunbear_stamp.webp`,
    /** Sun Bear stamp combined with card layout */
    sunbearStampWithCard:  `${J}/explorer-rescue-run/explorer_rescue_run_sunbear_stamp_with_card.webp`,
  },

  natureMission: {
    /** Bornean Orangutan animal card */
    orangutanCard:              `${J}/nature-mission/nature_mission_orangutan_card.webp`,
    /** Orangutan description icon — tree/compass variant */
    orangutanDescriptionIcon1:  `${J}/nature-mission/nature_mission_orangutan_description_icon_1.webp`,
    /** Orangutan description icon — leaf variant */
    orangutanDescriptionIcon2:  `${J}/nature-mission/nature_mission_orangutan_description_icon_2.webp`,
    /** Orangutan Tree Spotter stamp */
    orangutanStamp:             `${J}/nature-mission/nature_mission_orangutan_stamp.webp`,
    /** Sun Bear animal card */
    sunbearCard:                `${J}/nature-mission/nature_mission_sunbear_card.webp`,
    /** Sun Bear Honey Hunt description icon */
    sunbearDescriptionIcon:     `${J}/nature-mission/nature_mission_sunbear_description_icon.webp`,
    /** Sun Bear Honey Hunt stamp */
    sunbearStamp:               `${J}/nature-mission/nature_mission_sunbear_stamp.webp`,
    /** Malayan Tiger animal card */
    tigerCard:                  `${J}/nature-mission/nature_mission_tiger_card.webp`,
    /** Tiger Territory Walk description icon */
    tigerDescriptionIcon:       `${J}/nature-mission/nature_mission_tiger_description_icon.webp`,
    /** Tiger Territory Walk stamp */
    tigerStamp:                 `${J}/nature-mission/nature_mission_tiger_stamp.webp`,
  },
} as const

// ── Resolver helpers ──────────────────────────────────────────────────────────

/**
 * Get the WEBP sprite for a journal menu category card.
 */
export function getJournalCategoryCardAsset(categoryId: GameJournalCategoryId): string {
  switch (categoryId) {
    case 'nature-mission':      return GAME_JOURNAL_ASSETS.menu.natureMissionCard
    case 'eco-comic':           return GAME_JOURNAL_ASSETS.menu.ecoComicCard
    case 'explorer-rescue-run': return GAME_JOURNAL_ASSETS.menu.explorerRescueRunCard
  }
}

/**
 * Get the Eco-Comic stamp WEBP for a given stampId.
 * Returns locked stamp for unknown/locked stamps.
 */
export function getEcoComicStampAsset(stampId: string, isUnlocked: boolean): string {
  if (!isUnlocked) return GAME_JOURNAL_ASSETS.ecoComic.lockedStamp
  const map: Record<string, string> = {
    'family-team-hero':       GAME_JOURNAL_ASSETS.ecoComic.stamps.familyTeamHero,
    'pangolin-guardian':      GAME_JOURNAL_ASSETS.ecoComic.stamps.pangolinGuardian,
    'wildlife-secret-agent':  GAME_JOURNAL_ASSETS.ecoComic.stamps.wildlifeSecretAgent,
  }
  return map[stampId] ?? GAME_JOURNAL_ASSETS.ecoComic.lockedStamp
}

/**
 * Determine which Explorer Rescue Run WEBPs to use based on animal names.
 * Returns the card and stamp assets appropriate for the rescue pairing.
 */
export function getExplorerRescueJournalAssets(
  rescueAnimalName: string,
  wildMatchName: string,
): { cardAsset: string; stampAsset: string } {
  const combined = `${rescueAnimalName} ${wildMatchName}`.toLowerCase()
  const isFrogPairing = /frog|toad|amphibian/i.test(combined)
  const isSunBearOrangutan =
    /sun.?bear/i.test(combined) && /orangutan/i.test(combined)

  if (isFrogPairing) {
    return {
      cardAsset:  GAME_JOURNAL_ASSETS.explorerRescueRun.frogCard,
      stampAsset: GAME_JOURNAL_ASSETS.explorerRescueRun.frogStamp,
    }
  }
  if (isSunBearOrangutan) {
    return {
      cardAsset:  GAME_JOURNAL_ASSETS.explorerRescueRun.sunbearOrangutanCard,
      stampAsset: GAME_JOURNAL_ASSETS.explorerRescueRun.sunbearStamp,
    }
  }
  // Generic fallback — use blank card + blank as stamp (caller renders CSS fallback)
  return {
    cardAsset:  '',
    stampAsset: '',
  }
}

/**
 * Determine which Nature Mission WEBPs to use based on the stamp art key.
 */
export interface NatureMissionJournalAssets {
  animalCardAsset: string
  stampAsset: string
  descriptionIconAssets: string[]
}

export function getNatureMissionJournalAssets(stampArtKey: string): NatureMissionJournalAssets {
  const nm = GAME_JOURNAL_ASSETS.natureMission
  switch (stampArtKey) {
    case 'mission-tiger-territory':
      return {
        animalCardAsset: nm.tigerCard,
        stampAsset: nm.tigerStamp,
        descriptionIconAssets: [nm.tigerDescriptionIcon],
      }
    case 'mission-sun-bear-honey':
      return {
        animalCardAsset: nm.sunbearCard,
        stampAsset: nm.sunbearStamp,
        descriptionIconAssets: [nm.sunbearDescriptionIcon],
      }
    case 'mission-orangutan-tree':
    case 'mission-nature-walk':
      return {
        animalCardAsset: nm.orangutanCard,
        stampAsset: nm.orangutanStamp,
        descriptionIconAssets: [nm.orangutanDescriptionIcon1, nm.orangutanDescriptionIcon2],
      }
    default:
      return {
        animalCardAsset: '',
        stampAsset: '',
        descriptionIconAssets: [],
      }
  }
}

/**
 * Return all journal WEBP asset URLs (deduped) for tests and optional warming.
 */
export function getAllJournalAssetUrls(): string[] {
  const urls: string[] = []

  function collect(obj: Record<string, unknown>): void {
    for (const val of Object.values(obj)) {
      if (typeof val === 'string' && val.startsWith('/games/journal-book/')) {
        urls.push(val)
      } else if (typeof val === 'object' && val !== null) {
        collect(val as Record<string, unknown>)
      }
    }
  }

  collect(GAME_JOURNAL_ASSETS as unknown as Record<string, unknown>)
  return [...new Set(urls)]
}

// ── Clue badge icons — delegate to Explorer Rescue clue registry ─────────────

/** @deprecated Prefer `resolveClueVisualByDisplayLabel` / `resolveSharedClueBadgesForJournal`. */
export function getClueIconByLabel(label: string): string {
  return resolveClueVisualByDisplayLabel(label).iconPath
}

/** @deprecated Prefer `resolveClueVisualByDisplayLabel` / `resolveSharedClueBadgesForJournal`. */
export function getClueEmojiByLabel(label: string): string {
  return resolveClueVisualByDisplayLabel(label).fallbackEmoji
}
