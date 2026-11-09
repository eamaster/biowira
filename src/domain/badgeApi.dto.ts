// ============================================================
// BioWira Badge API DTOs
// Wire shapes returned by GET /api/v1/badges.
// The backend returns ALL badges (earned and locked) personalised
// to the authenticated profile via X-Session-Token.
// Swagger fields are reproduced exactly — no invented extras.
// ============================================================

/**
 * One badge entry in the GET /api/v1/badges response.
 * The backend returns every badge — whether earned or locked — so the
 * frontend must check `isUnlocked` / `earnedAt` to determine status.
 * The response also includes aggregate profile progress fields
 * (currentLevel, totalPoints, totalMissions) as supplementary context.
 */
export interface BadgeCollectionItemDto {
  /** Backend badge id */
  id?: number | string
  badgeName: string
  badgeImageUrl?: string
  description: string
  /** Badge category (e.g. "missions", "level") */
  badgeType?: string
  /** Minimum level required to earn this badge */
  levelRequired?: number
  /** Minimum missions required to earn this badge */
  missionsRequired?: number
  /** Origin label (e.g. "system") */
  source?: string
  /** ISO timestamp when the badge was earned, or null/absent if not yet earned */
  earnedAt?: string | null
  /** True when the profile has unlocked this badge (Swagger: isUnlocked) */
  isUnlocked: boolean
  /** Profile's current level at time of response */
  currentLevel?: number
  /** Profile's total points at time of response */
  totalPoints?: number
  /** Profile's total missions completed at time of response */
  totalMissions?: number
  /** Progress toward earning this badge, expressed as 0–100 percentage */
  progressPercentage?: number
}

/** Domain badge model used in Vue templates and stores */
export interface BackendBadge {
  id?: number | string
  badgeName: string
  badgeImageUrl?: string
  description: string
  badgeType?: string
  levelRequired?: number
  missionsRequired?: number
  source?: string
  earnedAt?: string | null
  /** True when this badge has been earned by the active profile */
  isUnlocked: boolean
  currentLevel?: number
  totalPoints?: number
  totalMissions?: number
  progressPercentage?: number
}

export function mapBadgeCollectionItemDto(dto: BadgeCollectionItemDto): BackendBadge {
  return {
    id: dto.id,
    badgeName: dto.badgeName,
    badgeImageUrl: dto.badgeImageUrl,
    description: dto.description,
    badgeType: dto.badgeType,
    levelRequired: dto.levelRequired,
    missionsRequired: dto.missionsRequired,
    source: dto.source,
    earnedAt: dto.earnedAt,
    isUnlocked: dto.isUnlocked,
    currentLevel: dto.currentLevel,
    totalPoints: dto.totalPoints,
    totalMissions: dto.totalMissions,
    progressPercentage: dto.progressPercentage,
  }
}
