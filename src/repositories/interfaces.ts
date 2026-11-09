import type { Animal, AnimalListItem, AnimalOccurrence } from '@/domain/animal'
import type { AnimalCategory } from '@/domain/enums'
import type { FunFact } from '@/domain/funFact'
import type { Quiz, QuizResult } from '@/domain/quiz'
import type { UserProgress } from '@/domain/user'
import type {
  ChildProfile,
  CreateProfileInput,
  RestoreProfileInput,
  CreateProfileResponse,
  QuizProgressPayload,
  ActiveSession,
  SessionBootstrapResult,
} from '@/domain/session'
import type {
  AssignMissionInput,
  MissionCompleteResult,
  MissionHistoryItem,
  MissionPreview,
  QuizSaveProgressResult,
  WeatherAdaptiveMissionQueryInput,
} from '@/domain/missionApi.dto'
import type { BackendBadge } from '@/domain/badgeApi.dto'
import type { ImageAttribution } from '@/domain/imageAttribution'

export interface PaginatedAnimalResult {
  items: AnimalListItem[]
  totalCount: number
}

export interface IAnimalRepository {
  getAll(): Promise<AnimalListItem[]>
  getByCategory(category: AnimalCategory): Promise<AnimalListItem[]>
  getPage(category: AnimalCategory, offset: number, limit: number): Promise<PaginatedAnimalResult>
  getById(id: string): Promise<Animal | null>
  getOccurrencesByAnimalId(animalId: string): Promise<AnimalOccurrence[]>
}

export interface IFunFactRepository {
  /**
   * GET /fun-facts — all facts across animals with personalised lock state.
   * Requires X-Session-Token (sent automatically by apiClient).
   * NOTE: The global collection DTO does NOT include animalId per item.
   * Implementation fetches GET /animals first to build enrichment context,
   * then calls GET /fun-facts/{animalId} per animal (option 2 strategy).
   */
  getAll(): Promise<FunFact[]>
  getById(id: string): Promise<FunFact | null>
  /**
   * GET /fun-facts/{animalId} — personalised facts for one animal.
   * Requires X-Session-Token (sent automatically by apiClient).
   * Called lazily when the child flips a card.
   * Animal context is required for enrichment (name, visual key, image URL).
   */
  getByAnimalId(
    animalId: string,
    animalContext: {
      commonName: string
      categoryEmoji: string
      visualKey?: string
      imageUrl?: string
      /** From GET /animals list enrichment — optional citation for animal photo fallbacks */
      imageAttribution?: ImageAttribution
    },
    force?: boolean,
  ): Promise<FunFact[]>
  /**
   * Purge all internal caches for this repository instance.
   * Must be called after a profile level-up so that the next getByAnimalId()
   * fetches fresh personalised access state from the backend.
   * Without this, the per-animal in-memory Map returns stale userLevel / accessStatus.
   */
  clearCache(): void
}

export interface IQuizRepository {
  getAll(): Promise<Quiz[]>
  getById(id: string): Promise<Quiz | null>
  submitResult(result: QuizResult): Promise<void>
  /**
   * POST /quizzes/save-progress
   * Request body MUST be exactly: { totalQuestions, correctAnswers }
   * Do NOT include profileId, score, or pointsEarned — backend computes these.
   * Returns server-authoritative reward/progress.
   * In mock mode this is a quiet no-op that returns zeroed values.
   */
  saveProgress(totalQuestions: number, correctAnswers: number): Promise<QuizSaveProgressResult>
}

// ── Mission Repository ─────────────────────────────────────────────────────────

export interface IMissionRepository {
  /** GET /missions/weather-adaptive?weatherCode=&isDay= — fetch a mission preview for current conditions */
  getWeatherAdaptiveMission(input: WeatherAdaptiveMissionQueryInput): Promise<MissionPreview>
  /** POST /missions/assign — assign the mission to the profile, returns profileMissionId */
  assignMission(input: AssignMissionInput): Promise<{ profileMissionId: number }>
  /** POST /missions/start — mark the mission as started (body: { profileMissionId }) */
  startMission(profileMissionId: number): Promise<void>
  /** GET /missions/history — returns the LAST 3 completed missions only, newest first */
  getMissionHistory(): Promise<MissionHistoryItem[]>
  /** POST /missions/complete — complete the mission, returns updated rewards */
  completeMission(profileMissionId: number): Promise<MissionCompleteResult>
}

// ── Badge Repository ───────────────────────────────────────────────────────────

export interface IBadgeRepository {
  /**
   * GET /badges — returns ALL badges (earned + locked) for the authenticated profile.
   * Requires X-Session-Token (sent automatically by apiClient).
   * Response includes lock/unlock state, progress percentage, and aggregate
   * profile counters (currentLevel, totalPoints, totalMissions).
   */
  getBadges(): Promise<BackendBadge[]>
}

export interface IUserRepository {
  getProgress(): Promise<UserProgress>
  addPoints(points: number): Promise<UserProgress>
  updateLastAnimal(animalId: string, animalName: string): Promise<void>
  updateLastQuiz(quizTitle: string): Promise<void>
}

// ── Child Profile Repository ───────────────────────────────────────────────────

export interface IProfileRepository {
  /** List all profiles stored on this device */
  listProfiles(): Promise<ChildProfile[]>
  /**
   * GET /profiles — get the current profile tied to the active session token.
   * Returns backend-authoritative totals (totalPoints, currentLevel, totalQuizzes, etc.).
   * Call after create/restore/quiz-save/mission-complete to sync local catalog.
   */
  getCurrentProfile(): Promise<ChildProfile | null>
  /** Get a single profile by its pseudonymous ID from local catalog */
  getProfile(profileId: string): Promise<ChildProfile | null>
  /** Create a new child explorer profile */
  createProfile(input: CreateProfileInput): Promise<CreateProfileResponse>
  /** Restore an existing child explorer profile from another device */
  restoreProfile(input: RestoreProfileInput): Promise<ChildProfile>
  /** Persist generic progress fields back to the stored profile */
  updateProfileProgress(profileId: string, update: Partial<ChildProfile>): Promise<ChildProfile>
  /** Save completed quiz attempt to the backend */
  saveQuizProgress(profileId: string, payload: QuizProgressPayload): Promise<ChildProfile>
  /** Permanently remove a profile (local device operation, does not delete backend profile) */
  deleteProfile(profileId: string): Promise<void>
}

// ── Session Repository ─────────────────────────────────────────────────────────

export interface ISessionRepository {
  /** Check stored session; return active profile if found, choosing state if not */
  bootstrapSession(): Promise<SessionBootstrapResult>
  /** Return the raw stored session object if one exists */
  getActiveSession(): Promise<ActiveSession | null>
  /** Persist a new active session for the given profile ID */
  setActiveSession(profileId: string): Promise<ActiveSession>
  /** Remove the active session (logout / profile switch) */
  clearSession(): Promise<void>
}
