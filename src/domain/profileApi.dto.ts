/**
 * Profile / session API wire shapes and mapping to {@link ChildProfile}.
 * Maps camelCase (current contract) and legacy snake_case where still encountered.
 */
import type { ChildProfile } from '@/domain/session'
import { getLevelForPoints } from '@/domain/user'
import { migrateChildProfile, type LegacyStoredProfile } from '@/domain/profileAnimalMigration'

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null
  return raw as Record<string, unknown>
}

function pickString(
  o: Record<string, unknown>,
  camel: string,
  snake: string,
): string | undefined {
  const a = o[camel]
  const b = o[snake]
  if (typeof a === 'string' && a.length) return a
  if (typeof b === 'string' && b.length) return b
  return undefined
}

function pickNumber(o: Record<string, unknown>, camel: string, snake: string): number | undefined {
  const a = o[camel]
  const b = o[snake]
  if (typeof a === 'number' && Number.isFinite(a)) return a
  if (typeof b === 'number' && Number.isFinite(b)) return b
  if (typeof a === 'string' && a.length) {
    const n = Number(a)
    if (Number.isFinite(n)) return n
  }
  if (typeof b === 'string' && b.length) {
    const n = Number(b)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function pickBool(o: Record<string, unknown>, camel: string, snake: string): boolean | undefined {
  const a = o[camel]
  const b = o[snake]
  if (typeof a === 'boolean') return a
  if (typeof b === 'boolean') return b
  return undefined
}

function pickAnimalIdString(o: Record<string, unknown>): string | undefined {
  const camel = o['animalId']
  const snake = o['animal_id']
  for (const v of [camel, snake]) {
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
    if (typeof v === 'string' && v.length > 0) return v
  }
  return undefined
}

/** Prefer nested `profile`, otherwise treat the payload as a flat profile. */
export function extractProfileWireObject(raw: unknown): Record<string, unknown> | null {
  const flat = asRecord(raw)
  if (!flat) return null
  const nested = flat['profile']
  if (nested && typeof nested === 'object') {
    return nested as Record<string, unknown>
  }
  return flat
}

/**
 * JSON body for POST /profiles — must match backend contract (camelCase).
 * NOTE: `animalId` is no longer part of the request body per the updated API contract.
 * Explorer visual identity is maintained locally via `animalVisualKey`.
 */
export function buildCreateProfileRequestBody(input: {
  displayName: string
  pin: string
  deviceInfo: string
}): Record<string, string | number> {
  return {
    displayName: input.displayName,
    pin: input.pin,
    deviceInfo: input.deviceInfo,
  }
}

export function parseSessionTokenFromResponse(raw: unknown): string | undefined {
  const o = asRecord(raw)
  if (!o) return undefined
  return pickString(o, 'sessionToken', 'session_token')
}

export function parseProfileCodeFromResponse(raw: unknown): string | undefined {
  const o = asRecord(raw)
  if (!o) return undefined
  return pickString(o, 'profileCode', 'profile_code')
}

export function parsePinFromResponse(raw: unknown): string | undefined {
  const o = asRecord(raw)
  if (!o) return undefined
  return pickString(o, 'pin', 'pin')
}

export function mapWireProfileToChildProfile(
  raw: unknown,
  fallback: { animalVisualKey: string; animalIdHint: string },
): ChildProfile {
  const o = extractProfileWireObject(raw) ?? asRecord(raw) ?? {}
  const profileId = pickString(o, 'profileId', 'profile_id') ?? ''
  const displayNickname =
    pickString(o, 'displayName', 'display_nickname') ??
    pickString(o, 'displayNickname', 'display_nickname') ??
    'Explorer'

  const animalId = pickAnimalIdString(o) ?? fallback.animalIdHint ?? ''

  const animalVisualKey =
    pickString(o, 'animalVisualKey', 'explorer_visual_key') ??
    pickString(o, 'explorerVisualKey', 'explorer_visual_key') ??
    fallback.animalVisualKey

  // Backend GET /profiles returns `totalPoints` (not `leafPoints`) and
  // `currentLevel` (not `level`). Map both camelCase variants so create,
  // restore, and GET /profiles responses all hydrate correctly.
  const leafPoints =
    pickNumber(o, 'leafPoints', 'leaf_points') ??
    pickNumber(o, 'totalPoints', 'total_points') ??
    0
  const level =
    pickNumber(o, 'level', 'level') ??
    pickNumber(o, 'currentLevel', 'current_level') ??
    getLevelForPoints(leafPoints).level
  const levelTitle =
    pickString(o, 'levelTitle', 'level_title') ?? getLevelForPoints(leafPoints).title

  const lastAnimalId = pickString(o, 'lastAnimalId', 'last_animal_id')
  const lastAnimalName = pickString(o, 'lastAnimalName', 'last_animal_name')
  const lastQuizTitle = pickString(o, 'lastQuizTitle', 'last_quiz_title')

  // Server-authoritative aggregate counters (from GET /profiles only; absent on create)
  const totalQuizzes = pickNumber(o, 'totalQuizzes', 'total_quizzes')
  const totalMissions = pickNumber(o, 'totalMissions', 'total_missions')
  const streakDays = pickNumber(o, 'streakDays', 'streak_days')

  const createdAt =
    pickString(o, 'createdAt', 'created_at') ?? new Date().toISOString()
  const lastActiveAt =
    pickString(o, 'lastActiveAt', 'last_active_at') ?? new Date().toISOString()
  const guardianBackupLinked =
    pickBool(o, 'guardianBackupLinked', 'guardian_backup_linked') ?? false

  const legacy: LegacyStoredProfile = {
    profileId,
    displayNickname,
    animalId,
    animalVisualKey,
    leafPoints,
    level,
    levelTitle,
    lastAnimalId,
    lastAnimalName,
    lastQuizTitle,
    totalQuizzes,
    totalMissions,
    streakDays,
    createdAt,
    lastActiveAt,
    guardianBackupLinked,
  }
  return migrateChildProfile(legacy)
}
