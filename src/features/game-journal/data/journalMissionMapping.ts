// ============================================================
// BioWira Game Journal — Nature Mission Display Mapping
//
// Maps mission titles/sourceIds to journal display data
// (animal, WEBP assets, CTA label). Used by the Nature Mission journal renderer.
//
// Rules:
// - Keyword matching is case-insensitive against mission title.
// - Falls back to a safe generic display if no keyword matches.
// - Do NOT hardcode this logic in Vue templates.
// ============================================================

import { getAnimalIconUrl } from '@/app/iconRegistry'
import { stripDisplayEmoji } from '@/domain/displayText'
import { GAME_JOURNAL_ASSETS, type NatureMissionJournalAssets } from './gameJournalAssetRegistry'

export interface MissionJournalDisplay {
  /** Animal shown in the "Mission Animal" polaroid card */
  animalId: string
  animalName: string
  animalIconUrl: string | undefined
  animalEmoji: string
  /** CTA button label for the bottom action bar */
  ctaLabel: string
  /** Internal key for resolving WEBP stamp/card assets */
  stampArtKey: string
  /** Pre-resolved WEBP assets for this mission type */
  assets: NatureMissionJournalAssets
}

interface MissionKeywordRule {
  keywords: string[]
  display: MissionJournalDisplay
}

const MISSION_KEYWORD_RULES: MissionKeywordRule[] = [
  {
    keywords: ['tiger', 'territory', 'patrol'],
    display: {
      animalId: 'malayan-tiger',
      animalName: 'Malayan Tiger',
      animalIconUrl: getAnimalIconUrl('malayan-tiger'),
      animalEmoji: '🐯',
      ctaLabel: 'Go to Patrol Path',
      stampArtKey: 'mission-tiger-territory',
      assets: {
        animalCardAsset: GAME_JOURNAL_ASSETS.natureMission.tigerCard,
        stampAsset: GAME_JOURNAL_ASSETS.natureMission.tigerStamp,
        descriptionIconAssets: [GAME_JOURNAL_ASSETS.natureMission.tigerDescriptionIcon],
      },
    },
  },
  {
    keywords: ['sun bear', 'sunbear', 'honey', 'honey hunt'],
    display: {
      animalId: 'sun-bear',
      animalName: 'Sun Bear',
      animalIconUrl: getAnimalIconUrl('sun-bear'),
      animalEmoji: '🐻',
      ctaLabel: 'Go to Honey Hunt Path',
      stampArtKey: 'mission-sun-bear-honey',
      assets: {
        animalCardAsset: GAME_JOURNAL_ASSETS.natureMission.sunbearCard,
        stampAsset: GAME_JOURNAL_ASSETS.natureMission.sunbearStamp,
        descriptionIconAssets: [GAME_JOURNAL_ASSETS.natureMission.sunbearDescriptionIcon],
      },
    },
  },
  {
    keywords: ['orangutan', 'nest builder', 'tree spotter', 'tree spot'],
    display: {
      animalId: 'bornean-orangutan',
      animalName: 'Bornean Orangutan',
      animalIconUrl: getAnimalIconUrl('bornean-orangutan'),
      animalEmoji: '🦧',
      ctaLabel: 'Go to Tree Spotter Path',
      stampArtKey: 'mission-orangutan-tree',
      assets: {
        animalCardAsset: GAME_JOURNAL_ASSETS.natureMission.orangutanCard,
        stampAsset: GAME_JOURNAL_ASSETS.natureMission.orangutanStamp,
        descriptionIconAssets: [
          GAME_JOURNAL_ASSETS.natureMission.orangutanDescriptionIcon1,
          GAME_JOURNAL_ASSETS.natureMission.orangutanDescriptionIcon2,
        ],
      },
    },
  },
  {
    keywords: ['hornbill', 'rhinoceros hornbill'],
    display: {
      animalId: 'rhinoceros-hornbill',
      animalName: 'Rhinoceros Hornbill',
      animalIconUrl: getAnimalIconUrl('rhinoceros-hornbill'),
      animalEmoji: '🦜',
      ctaLabel: 'Go to Hornbill Path',
      stampArtKey: 'mission-hornbill',
      assets: { animalCardAsset: '', stampAsset: '', descriptionIconAssets: [] },
    },
  },
  {
    keywords: ['pangolin'],
    display: {
      animalId: 'sunda-pangolin',
      animalName: 'Sunda Pangolin',
      animalIconUrl: getAnimalIconUrl('sunda-pangolin'),
      animalEmoji: '🦔',
      ctaLabel: 'Go to Mission Path',
      stampArtKey: 'mission-pangolin',
      assets: { animalCardAsset: '', stampAsset: '', descriptionIconAssets: [] },
    },
  },
  {
    keywords: ['proboscis', 'monkey'],
    display: {
      animalId: 'proboscis-monkey',
      animalName: 'Proboscis Monkey',
      animalIconUrl: getAnimalIconUrl('proboscis-monkey'),
      animalEmoji: '🐒',
      ctaLabel: 'Go to Mission Path',
      stampArtKey: 'mission-proboscis',
      assets: { animalCardAsset: '', stampAsset: '', descriptionIconAssets: [] },
    },
  },
  {
    keywords: ['bird', 'bird listener', 'bird sound'],
    display: {
      animalId: 'rhinoceros-hornbill',
      animalName: 'Rhinoceros Hornbill',
      animalIconUrl: getAnimalIconUrl('rhinoceros-hornbill'),
      animalEmoji: '🐦',
      ctaLabel: 'Go to Mission Path',
      stampArtKey: 'mission-bird',
      assets: { animalCardAsset: '', stampAsset: '', descriptionIconAssets: [] },
    },
  },
  {
    keywords: ['plant', 'leaf', 'tree', 'nature walk', 'garden'],
    display: {
      animalId: 'bornean-orangutan',
      animalName: 'Bornean Orangutan',
      animalIconUrl: getAnimalIconUrl('bornean-orangutan'),
      animalEmoji: '🌿',
      ctaLabel: 'Go to Mission Path',
      stampArtKey: 'mission-nature-walk',
      assets: {
        animalCardAsset: GAME_JOURNAL_ASSETS.natureMission.orangutanCard,
        stampAsset: GAME_JOURNAL_ASSETS.natureMission.orangutanStamp,
        descriptionIconAssets: [GAME_JOURNAL_ASSETS.natureMission.orangutanDescriptionIcon1],
      },
    },
  },
]

/** Generic fallback used when no keyword matches the mission title. */
const MISSION_GENERIC_DISPLAY: MissionJournalDisplay = {
  animalId: 'malayan-tiger',
  animalName: 'Nature Explorer',
  animalIconUrl: getAnimalIconUrl('malayan-tiger'),
  animalEmoji: '🌿',
  ctaLabel: 'Go to Mission Path',
  stampArtKey: 'mission-generic',
  assets: { animalCardAsset: '', stampAsset: '', descriptionIconAssets: [] },
}

/**
 * Resolve journal display data for a Nature Mission record.
 * Matches keywords in the mission title (case-insensitive).
 * Falls back to a safe generic display when no keyword matches.
 */
export function resolveMissionJournalDisplay(
  missionTitle: string | undefined,
): MissionJournalDisplay {
  if (!missionTitle) return MISSION_GENERIC_DISPLAY

  const lower = missionTitle.toLowerCase()

  for (const rule of MISSION_KEYWORD_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.display
    }
  }

  return MISSION_GENERIC_DISPLAY
}

/**
 * Nature Mission hub / result surfaces: plain title (no flair emoji) + animal spirit for {@link AnimalIcon}.
 * Keeps keyword rules and assets in {@link resolveMissionJournalDisplay} — Vue never matches strings.
 */
export function resolveMissionCardTitleDisplay(missionTitle: string | undefined): {
  titleText: string
  animalIconKey: string
  animalFallbackEmoji: string
} {
  const trimmed = missionTitle?.trim() ?? ''
  const journal = resolveMissionJournalDisplay(trimmed.length > 0 ? trimmed : undefined)
  const stripped = stripDisplayEmoji(trimmed)
  return {
    titleText: stripped.length > 0 ? stripped : trimmed,
    animalIconKey: journal.animalId,
    animalFallbackEmoji: journal.animalEmoji,
  }
}

/** Stamp ids on the journal menu chip for the three featured animal missions (aligned with game journal stamp catalog). */
export const NATURE_MISSION_JOURNAL_MENU_STAMP_IDS = [
  'mission-tiger-territory',
  'mission-sun-bear-honey',
  'mission-orangutan-tree',
] as const

/**
 * Map a completed mission title to the unified journal {@link GameJournalStampDefinition.stampId}.
 * Non-featured missions (catalog keyword rules outside the three animals) use nature-mission-helper.
 */
export function getNatureMissionJournalStampIdFromTitle(missionTitle: string | undefined): string {
  const { stampArtKey } = resolveMissionJournalDisplay(missionTitle)
  if ((NATURE_MISSION_JOURNAL_MENU_STAMP_IDS as readonly string[]).includes(stampArtKey)) {
    return stampArtKey
  }
  if (stampArtKey === 'mission-nature-walk') {
    return 'mission-orangutan-tree'
  }
  return 'nature-mission-helper'
}
