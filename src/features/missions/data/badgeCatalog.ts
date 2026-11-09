// ============================================================
// BioWira — Badge Milestone Catalog
// Milestone badges awarded for completing missions.
// All badge definitions are centralised here.
// ============================================================

import type { BadgeDefinition } from '@/domain/mission'

/**
 * Badge milestones awarded at specific mission completion counts.
 * milestoneCount must be in ascending order.
 */
export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: 'nature-starter',
    title: 'Nature Starter',
    milestoneCount: 1,
    description: 'You completed your very first nature mission!',
    emoji: '🌱',
  },
  {
    id: 'mission-5',
    title: 'Eco Explorer',
    milestoneCount: 5,
    description: 'You completed 5 nature missions — you are an Eco Explorer!',
    emoji: '🌿',
  },
  {
    id: 'mission-10',
    title: 'Nature Guardian',
    milestoneCount: 10,
    description: 'Amazing! 10 missions done — you are a true Nature Guardian!',
    emoji: '🌳',
  },
  // Extended milestone (beyond core 5 / 10) — intentional bonus for long-term explorers
  {
    id: 'mission-20',
    title: 'Rainforest Hero',
    milestoneCount: 20,
    description: 'Wow! 20 missions! You are a legendary Rainforest Hero!',
    emoji: '🦅',
  },
]

/**
 * Check which new badges should be unlocked given the current completion count
 * and the list of already-earned badge IDs.
 *
 * Returns only the newly-triggered badges (not already earned ones).
 */
export function getNewlyUnlockedBadges(
  completionCount: number,
  alreadyEarnedIds: string[],
): BadgeDefinition[] {
  return BADGE_CATALOG.filter(
    (badge) =>
      completionCount >= badge.milestoneCount && !alreadyEarnedIds.includes(badge.id),
  )
}
