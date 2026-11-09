// ============================================================
// BioWira Session & Profile Domain Models
// Passwordless child-profile system — no passwords, no emails,
// no real names required for child accounts.
// ============================================================

/** State of the session lifecycle */
export type SessionState = 'none' | 'restoring' | 'active' | 'choosing'

/** A pseudonymous child explorer profile stored per device */
export interface ChildProfile {
  /** Pseudonymous UUID — never the child's real name */
  profileId: string
  /** Safe preset nickname shown in the UI */
  displayNickname: string
  /**
   * Stable explorer animal id (same family as Animal.id / API `animal_id`).
   * Not used as the AnimalIcon registry key — use `animalVisualKey` for rendering.
   */
  animalId: string
  /** Registry visual key for AnimalIcon — must match iconRegistry / animal assets */
  animalVisualKey: string
  /** Cumulative leaf points (mapped from backend `totalPoints`) */
  leafPoints: number
  /** Current level number (mapped from backend `currentLevel`) */
  level: number
  /** Current level title string */
  levelTitle: string
  /** Last animal browsed */
  lastAnimalId?: string
  lastAnimalName?: string
  /** Last quiz title started */
  lastQuizTitle?: string
  /**
   * Total quizzes completed — populated from GET /profiles response.
   * Not persisted locally; refreshed from backend after quiz/mission events.
   */
  totalQuizzes?: number
  /**
   * Total missions completed — populated from GET /profiles response.
   * Not persisted locally; refreshed from backend after quiz/mission events.
   */
  totalMissions?: number
  /**
   * Current activity streak in days — populated from GET /profiles response.
   * Not persisted locally; refreshed from backend after quiz/mission events.
   */
  streakDays?: number
  /** ISO date string */
  createdAt: string
  /** ISO date string, updated on each activation */
  lastActiveAt: string
  /** Whether a guardian backup has been linked (future) */
  guardianBackupLinked: boolean
}

/** Lightweight view used in profile picker */
export interface ProfileSummary {
  profileId: string
  displayNickname: string
  animalId: string
  animalVisualKey: string
  level: number
  leafPoints: number
}

/** Input for creating a new profile */
export interface CreateProfileInput {
  displayNickname: string
  /**
   * Backend animal id (from GET /animals when using API) or mock slug when animals → mock.
   * Stored on {@link ChildProfile#animalId} as a string.
   */
  animalId: string
  /** AnimalIcon registry key — required so UI can render before/without GET /profiles enrichment */
  animalVisualKey: string
}

export interface RestoreProfileInput {
  profileCode: string
  pin: string
}

export interface CreateProfileResponse {
  profile: ChildProfile
  profileCode: string
  pin: string
}

export interface QuizProgressPayload {
  score: number
  totalQuestions: number
  correctAnswers: number
  pointsEarned: number
}

/** An active device session, persisted locally */
export interface ActiveSession {
  profileId: string
  /** ISO date string when session was last restored */
  restoredAt: string
  // sessionToken is omitted in mock mode — reserved for future API auth
}

/** Result of the session bootstrap check at app launch */
export interface SessionBootstrapResult {
  state: SessionState
  profile: ChildProfile | null
}

/** Guardian backup status — future-ready, not implemented */
export type GuardianBackupMethod = 'email' | 'passkey' | 'none'

export interface GuardianBackupStatus {
  linked: boolean
  method: GuardianBackupMethod
}
