import { HOME_FEATURE_CARDS } from '@/features/home/homeFeatureCards'
import type { HomeFeatureCardId } from '@/features/home/components/HomeFeatureCard.vue'
import type { HomeFeatureCardConfig } from '@/features/home/homeFeatureCards'

export const GAME_MENU_CARD_IDS = ['missions', 'rescue', 'comics'] as const

const GAME_MENU_COPY: Record<(typeof GAME_MENU_CARD_IDS)[number], {
  title: string
  description: string
  buttonLabel: string
}> = {
  missions: {
    title: 'Nature Missions',
    description: 'Do small nature activities.',
    buttonLabel: 'Start Mission',
  },
  rescue: {
    title: 'Explorer Rescue Run',
    description: 'Run, jump, and find your Wild Match!',
    buttonLabel: 'Start Rescue',
  },
  comics: {
    title: 'Eco-Comics',
    description: 'Read short pixel stories about protecting Malaysia\'s wildlife.',
    buttonLabel: 'Read Comics',
  },
}

function getHomeFeatureCardById(id: HomeFeatureCardId): HomeFeatureCardConfig {
  const card = HOME_FEATURE_CARDS.find((item) => item.id === id)
  if (!card) {
    throw new Error(`Missing HOME_FEATURE_CARDS entry for "${id}"`)
  }
  return card
}

/**
 * Games hub rows: assets and `routeName` from `HOME_FEATURE_CARDS`; titles/descriptions/button
 * labels are games-menu copy.
 */
export const GAME_MENU_CARDS: HomeFeatureCardConfig[] = GAME_MENU_CARD_IDS.map((id) => {
  const source = getHomeFeatureCardById(id)
  const copy = GAME_MENU_COPY[id]
  return {
    ...source,
    title: copy.title,
    description: copy.description,
    buttonLabel: copy.buttonLabel,
  }
})
