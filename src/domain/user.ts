export interface UserProgress {
  userId: string
  displayName: string
  leafPoints: number
  level: number
  levelTitle: string
  lastAnimalId?: string
  lastAnimalName?: string
  lastQuizTitle?: string
}

export interface LevelDefinition {
  level: number
  title: string
  minPoints: number
  maxPoints: number
}

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { level: 1, title: 'Nature Newbie', minPoints: 0, maxPoints: 199 },
  { level: 2, title: 'Animal Explorer', minPoints: 200, maxPoints: 499 },
  { level: 3, title: 'Forest Scout', minPoints: 500, maxPoints: 999 },
  { level: 4, title: 'Wildlife Guardian', minPoints: 1000, maxPoints: 1999 },
  { level: 5, title: 'Rainforest Hero', minPoints: 2000, maxPoints: Infinity },
]

export function getLevelForPoints(points: number): LevelDefinition {
  return (
    LEVEL_DEFINITIONS.find((l) => points >= l.minPoints && points <= l.maxPoints) ??
    LEVEL_DEFINITIONS[0]!
  )
}

export function getLevelProgress(points: number): number {
  const level = getLevelForPoints(points)
  if (level.maxPoints === Infinity) return 100
  const range = level.maxPoints - level.minPoints
  const progress = points - level.minPoints
  return Math.min(100, Math.round((progress / range) * 100))
}

// ── Per-domain repository source ─────────────────────────────────────────────
// 'api'  — use the real REST API repository for this domain
// 'mock' — use the local/localStorage mock repository for this domain
export type RepoSource = 'api' | 'mock'

// ── Narration source ──────────────────────────────────────────────────────────
// 'browser' — Web Speech API fallback only (set VITE_NARRATION_SOURCE=browser for dev)
// 'api'     — BioWira backend ElevenLabs cached TTS endpoint /api/v1/tts/generate
// Never put ElevenLabs or other API credentials in frontend config.
export type NarrationSource = 'browser' | 'api'

export interface RepoSources {
  animals: RepoSource
  session: RepoSource
  profile: RepoSource
  user: RepoSource
  funFacts: RepoSource
  quizzes: RepoSource
  missions: RepoSource
  badges: RepoSource
}

export interface AppConfig {
  apiBaseUrl: string
  /** Legacy global switch — kept for backward compat / direct test overrides. Per-domain repoSources wins. */
  useMock: boolean
  /** Per-domain repository source selection. Fine-grained — each domain is independent. */
  repoSources: RepoSources
  appVersion: string
  pointsPerQuizCorrect: number
  bonusForPerfectQuiz: number
  maxRetries: number
  /** When false the session guard is bypassed (useful for unit tests / CI) */
  sessionEnabled: boolean
  /**
   * Narration backend selection.
   * 'browser' — Web Speech API fallback (set VITE_NARRATION_SOURCE=browser for explicit dev fallback).
   * 'api'     — BioWira backend ElevenLabs cached TTS endpoint /api/v1/tts/generate (default).
   * Never set ElevenLabs credentials in frontend env files.
   */
  narrationSource: NarrationSource
  /** ElevenLabs TTS parameters — resolved from VITE_TTS_* env vars with safe defaults. */
  tts: {
    voiceId: string
    modelId: string
    speed: number
  }
}


export interface UserProgressDTO {
  user_id: string
  display_name: string
  leaf_points: number
  level: number
  level_title: string
  last_animal_id?: string
  last_animal_name?: string
  last_quiz_title?: string
}

export function mapUserProgressFromDTO(dto: UserProgressDTO): UserProgress {
  return {
    userId: dto.user_id,
    displayName: dto.display_name,
    leafPoints: dto.leaf_points,
    level: dto.level,
    levelTitle: dto.level_title,
    lastAnimalId: dto.last_animal_id,
    lastAnimalName: dto.last_animal_name,
    lastQuizTitle: dto.last_quiz_title,
  }
}
