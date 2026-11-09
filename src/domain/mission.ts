// ============================================================
// BioWira Mission Domain Types
// Types plus small display helpers shared by mission UI (labels, duration text).
// ============================================================

import type { NormalizedWeatherCondition } from './weather'

/**
 * Whether a mission takes place indoors or outdoors.
 * Both: flexible missions suitable for either environment.
 */
export type MissionEnvironment = 'indoor' | 'outdoor' | 'both'

/** User-visible label for mission environment (result screens, journal metadata). */
export const MISSION_ENVIRONMENT_LABELS: Record<MissionEnvironment, string> = {
  indoor: 'Indoor',
  outdoor: 'Outdoor',
  both: 'Indoor or outdoor',
}

export function labelMissionEnvironment(env: string | undefined | null): string {
  if (env === 'indoor' || env === 'outdoor' || env === 'both') {
    return MISSION_ENVIRONMENT_LABELS[env]
  }
  return 'Nature mission'
}

/** Rounds template duration for display (estimated length, not a live timer). */
export function formatMissionDurationEstimate(minutes: number): string {
  const m = Math.max(0, Math.round(minutes))
  if (m <= 0) return '—'
  return `${m} min`
}

/**
 * A mission template from the central catalog.
 * Templates are static data — they are never mutated at runtime.
 */
export interface MissionTemplate {
  /** Stable unique identifier (e.g. 'observe-plant') */
  id: string
  /** Child-friendly title shown on the card */
  title: string
  /** Short encouraging description */
  description: string
  /**
   * Exactly 3 steps — enforced by type.
   * Each step is a short, clear instruction for a child.
   */
  steps: [string, string, string]
  /** Minutes to complete (must be 5–15 inclusive) */
  durationMinutes: number
  /** Leaf points awarded on completion */
  pointsValue: number
  /** Whether the mission is indoor, outdoor, or works for both */
  environment: MissionEnvironment
  /**
   * Optional: which weather conditions this mission is especially
   * well-suited for. Used for finer mission selection.
   */
  weatherTags?: NormalizedWeatherCondition[]
  /** Optional: icon type for RewardIcon or future badge art */
  iconType?: 'leaf' | 'trophy'
}

/**
 * State machine for a mission instance.
 * - preview:     fetched from GET /missions/weather-adaptive, not yet started
 * - in_progress: assign + start succeeded; child is doing the mission
 * - completed:   POST /missions/complete succeeded
 */
export type MissionStatus = 'preview' | 'in_progress' | 'completed'

/**
 * A unique instance of a mission for a specific profile + session.
 * Backed by real backend IDs when the API is enabled.
 * Persisted per profile so the same mission survives page refresh.
 */
export interface MissionInstance {
  /** Local UUID for Vue :key usage */
  instanceId: string
  /** Template ID — 'api' when backed by backend, or catalog key in mock mode */
  templateId: string
  title: string
  description: string
  steps: [string, string, string]
  durationMinutes: number
  pointsValue: number
  environment: MissionEnvironment
  iconType?: 'leaf' | 'trophy'
  /** ISO date string */
  generatedAt: string
  /** True once the child has completed the mission (derived: status === 'completed') */
  completed: boolean
  /** Current state machine state */
  status: MissionStatus
  /**
   * Backend mission template ID from GET /missions/weather-adaptive.
   * Needed for POST /missions/assign.
   */
  backendMissionId?: number
  /**
   * Backend profile-mission join ID from POST /missions/assign.
   * Needed for POST /missions/start and POST /missions/complete.
   */
  profileMissionId?: number
}

/**
 * Written to history when a mission instance is completed.
 */
export interface MissionHistoryEntry {
  instanceId: string
  templateId: string
  title: string
  /** ISO date string */
  completedAt: string
}

/**
 * A milestone badge definition from the central catalog.
 */
export interface BadgeDefinition {
  id: string
  title: string
  /** Number of mission completions required to unlock this badge */
  milestoneCount: number
  description: string
  /** Emoji icon displayed in the badge shelf */
  emoji: string
}

/**
 * A badge the child has earned, stored per profile.
 */
export interface EarnedBadge {
  badgeId: string
  /** ISO date string */
  earnedAt: string
}

/**
 * One entry in the preset location picker.
 * No real geolocation — children pick from a safe named list.
 */
export interface PresetLocation {
  id: string
  /** Display name shown in the picker (e.g. "Kuala Lumpur") */
  label: string
  /** Optional region label (e.g. "Selangor") */
  region?: string
  latitude: number
  longitude: number
}

/**
 * All mission-related state persisted per profile via storageService.
 * Kept separate from ChildProfile to avoid coupling concerns.
 */
export interface MissionProfileState {
  /** ID of the currently selected preset location, or null if not chosen */
  selectedLocationId: string | null
  /** The active mission instance for this profile */
  activeMission: MissionInstance | null
  /** Full history of completed missions, newest first */
  history: MissionHistoryEntry[]
  /** Badges the child has earned */
  earnedBadges: EarnedBadge[]
}
