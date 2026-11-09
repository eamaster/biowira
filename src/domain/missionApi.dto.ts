// ============================================================
// BioWira Mission API DTOs
// Wire shapes returned by the backend mission endpoints.
// Map these to domain models before passing to Vue templates.
// ============================================================

// ── Input types ────────────────────────────────────────────────────────────────

export interface WeatherAdaptiveMissionQueryInput {
  weatherCode: number
  isDay: boolean
}

export interface AssignMissionInput {
  missionId: number
  weatherCode: number
  isDay: boolean
  weatherTemp: number
  locationLat: number
  locationLon: number
}

// ── Response wire shapes (exact Swagger field names) ──────────────────────────

/** GET /api/missions/weather-adaptive response */
export interface WeatherAdaptiveMissionDto {
  id: number
  title: string
  description: string
  step1: string
  step2: string
  step3: string
  timeLimitMin: number
  isOutdoor: boolean
  isDayOnly: boolean
  pointsReward: number
  imageUrl?: string
  typeName?: string
}

/** POST /api/missions/assign response */
export interface AssignMissionResponseDto {
  profileMissionId: number
}

/** One item in GET /api/missions/history response */
export interface MissionHistoryItemDto {
  missionId: number
  title: string
  description?: string
  typeName?: string
  pointsEarned: number
  isOutdoor: boolean
  imageUrl?: string
  completedAt: string
}

/** Shared reward/progress payload — returned by complete & quiz save-progress */
export interface RewardProgressDto {
  totalPoints: number
  newLevel: number
  leveledUp: boolean
  newFactsUnlocked: number
  newBadges: NewBadgeDto[]
}

export interface NewBadgeDto {
  badgeName: string
  badgeImageUrl: string
  description: string
}

// ── Domain models (used in stores and Vue templates) ─────────────────────────

/** A mission returned from GET /missions/weather-adaptive — not yet started */
export interface MissionPreview {
  /** Backend mission ID (needed for assign call) */
  backendId: number
  title: string
  description: string
  steps: [string, string, string]
  durationMinutes: number
  pointsValue: number
  isOutdoor: boolean
  isDayOnly: boolean
  typeName: string
  imageUrl?: string
}

/** One entry in the backend mission history (last 3 completed) */
export interface MissionHistoryItem {
  missionId: number
  title: string
  typeName: string
  pointsEarned: number
  isOutdoor: boolean
  imageUrl?: string
  completedAt: string
}

/** Reward/progress result from completing a mission */
export interface MissionCompleteResult {
  totalPoints: number
  newLevel: number
  leveledUp: boolean
  newFactsUnlocked: number
  newBadges: NewBadgeDto[]
}

/** Reward/progress result from saving quiz progress */
export interface QuizSaveProgressResult {
  totalPoints: number
  newLevel: number
  leveledUp: boolean
  newFactsUnlocked: number
  newBadges: NewBadgeDto[]
}

// ── Mappers ────────────────────────────────────────────────────────────────────

export function mapWeatherAdaptiveMissionDto(dto: WeatherAdaptiveMissionDto): MissionPreview {
  return {
    backendId: dto.id,
    title: dto.title,
    description: dto.description,
    steps: [dto.step1, dto.step2, dto.step3],
    durationMinutes: dto.timeLimitMin,
    pointsValue: dto.pointsReward,
    isOutdoor: dto.isOutdoor,
    isDayOnly: dto.isDayOnly,
    typeName: dto.typeName ?? 'Nature',
    imageUrl: dto.imageUrl,
  }
}

export function mapMissionHistoryItemDto(dto: MissionHistoryItemDto): MissionHistoryItem {
  return {
    missionId: dto.missionId,
    title: dto.title,
    typeName: dto.typeName ?? 'Nature',
    pointsEarned: dto.pointsEarned,
    isOutdoor: dto.isOutdoor,
    imageUrl: dto.imageUrl,
    completedAt: dto.completedAt,
  }
}
