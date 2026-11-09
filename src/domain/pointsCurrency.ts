/**
 * Single logical currency for cumulative totals, quiz rewards, and missions.
 * Components should import from here instead of scattering "pts" / coin icons.
 */
import type { GameplayIconKey } from '@/app/iconRegistry'

/** GameplayIcon / registry key used everywhere real Leaf Points are shown */
export const LEAF_POINTS_GAMEPLAY_ICON_KEY: GameplayIconKey = 'leafLevel'

export const LEAF_POINTS_LABEL = 'Leaf Points'

export function formatLeafPointsCount(value: number): string {
  return value.toLocaleString()
}
