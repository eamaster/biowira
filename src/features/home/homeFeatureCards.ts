import { ROUTE_NAMES } from '@/app/config'
import { HOME_PAGE_ASSETS } from '@/app/branding'
import type { HomeFeatureCardId } from './components/HomeFeatureCard.vue'

export type HomeFeatureCardConfig = {
  id: HomeFeatureCardId
  title: string
  description: string
  buttonLabel: string
  routeName: (typeof ROUTE_NAMES)[keyof typeof ROUTE_NAMES]
  panelSrc: string
  iconSrc: string
  buttonSrc: string
}

export const HOME_FEATURE_CARDS: HomeFeatureCardConfig[] = [
  {
    id: 'discover',
    title: 'Discover Animals',
    description: 'Browse the animal list and learn!',
    buttonLabel: 'Go Explore',
    routeName: ROUTE_NAMES.discover,
    panelSrc: HOME_PAGE_ASSETS.featureCards.discover.panel,
    iconSrc: HOME_PAGE_ASSETS.featureCards.discover.icon,
    buttonSrc: HOME_PAGE_ASSETS.featureCards.discover.button,
  },
  {
    id: 'comics',
    title: 'Eco-Comics',
    description: 'Read short stories about helping nature.',
    buttonLabel: 'Read Comics',
    routeName: ROUTE_NAMES.ecoComics,
    panelSrc: HOME_PAGE_ASSETS.featureCards.ecoComics.panel,
    iconSrc: HOME_PAGE_ASSETS.featureCards.ecoComics.icon,
    buttonSrc: HOME_PAGE_ASSETS.featureCards.ecoComics.button,
  },
  {
    id: 'quiz',
    title: 'Take Animal Quiz',
    description: 'Test your wildlife knowledge!',
    buttonLabel: 'Start Quiz',
    routeName: ROUTE_NAMES.quiz,
    panelSrc: HOME_PAGE_ASSETS.featureCards.quiz.panel,
    iconSrc: HOME_PAGE_ASSETS.featureCards.quiz.icon,
    buttonSrc: HOME_PAGE_ASSETS.featureCards.quiz.button,
  },
  {
    id: 'missions',
    title: 'Nature Missions',
    description: 'Help nature today!',
    buttonLabel: 'Start Mission',
    routeName: ROUTE_NAMES.missions,
    panelSrc: HOME_PAGE_ASSETS.featureCards.missions.panel,
    iconSrc: HOME_PAGE_ASSETS.featureCards.missions.icon,
    buttonSrc: HOME_PAGE_ASSETS.featureCards.missions.button,
  },
  {
    id: 'rescue',
    title: 'Explorer Rescue Run',
    description: 'Run, jump, and find your Wild Match!',
    buttonLabel: 'Start Rescue',
    routeName: ROUTE_NAMES.explorerRescue,
    panelSrc: HOME_PAGE_ASSETS.featureCards.rescue.panel,
    iconSrc: HOME_PAGE_ASSETS.featureCards.rescue.icon,
    buttonSrc: HOME_PAGE_ASSETS.featureCards.rescue.button,
  },
]
