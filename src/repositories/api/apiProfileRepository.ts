import { apiClient } from '@/services/apiClient'
import type {
  ChildProfile,
  CreateProfileInput,
  RestoreProfileInput,
  CreateProfileResponse,
  QuizProgressPayload,
} from '@/domain/session'
import type { IProfileRepository } from '../interfaces'
import {
  migrateChildProfile,
  profileNeedsPersistenceRewrite,
  type LegacyStoredProfile,
} from '@/domain/profileAnimalMigration'
import { generatePin } from '@/utils/security'
import { getDeviceInfo } from '@/services/deviceInfo'
import { storageService } from '@/services/storageService'
import { STORAGE_KEYS } from '@/app/config'
import {
  buildCreateProfileRequestBody,
  mapWireProfileToChildProfile,
  parsePinFromResponse,
  parseProfileCodeFromResponse,
  parseSessionTokenFromResponse,
} from '@/domain/profileApi.dto'
import { getLevelForPoints } from '@/domain/user'

export class ApiProfileRepository implements IProfileRepository {
  private loadLocalCatalog(): ChildProfile[] {
    const raw = storageService.get<LegacyStoredProfile[]>(STORAGE_KEYS.PROFILES) ?? []
    let dirty = false
    const migrated = raw.map((p) => {
      const m = migrateChildProfile(p)
      if (profileNeedsPersistenceRewrite(p, m)) dirty = true
      return m
    })
    if (dirty) this.saveLocalCatalog(migrated)
    return migrated
  }

  private saveLocalCatalog(profiles: ChildProfile[]): void {
    storageService.set(STORAGE_KEYS.PROFILES, profiles)
  }

  private addProfileToCatalog(profile: ChildProfile): void {
    const profiles = this.loadLocalCatalog()
    const existingIdx = profiles.findIndex((p) => p.profileId === profile.profileId)
    if (existingIdx !== -1) {
      const existing = profiles[existingIdx]!
      // Merge: server data takes priority for progress fields, but preserve
      // locally-known visual key and locally-tracked activity fields when the
      // API response omits them (GET /profiles may not return lastAnimalId/Name
      // or lastQuizTitle, so a plain spread would wipe locally-saved values).
      profiles[existingIdx] = {
        ...existing,
        ...profile,
        animalVisualKey: profile.animalVisualKey || existing.animalVisualKey,
        lastAnimalId:   profile.lastAnimalId   ?? existing.lastAnimalId,
        lastAnimalName: profile.lastAnimalName ?? existing.lastAnimalName,
        lastQuizTitle:  profile.lastQuizTitle  ?? existing.lastQuizTitle,
      }
    } else {
      profiles.push(profile)
    }
    this.saveLocalCatalog(profiles)
  }

  async listProfiles(): Promise<ChildProfile[]> {
    return this.loadLocalCatalog()
  }

  async getCurrentProfile(): Promise<ChildProfile | null> {
    try {
      const dto = await apiClient.get<unknown>('/profiles')
      // Peek at profileId to find any locally-stored visual key.
      // GET /profiles does not return animalVisualKey, so we must carry it
      // forward from the local catalog to prevent a blank explorer avatar.
      const rawRec = dto && typeof dto === 'object' ? (dto as Record<string, unknown>) : {}
      const profileId = String(rawRec['profileId'] ?? rawRec['profile_id'] ?? '')
      const existingLocal = profileId
        ? this.loadLocalCatalog().find((p) => p.profileId === profileId) ?? null
        : null
      const profile = mapWireProfileToChildProfile(dto, {
        animalVisualKey: existingLocal?.animalVisualKey ?? '',
        animalIdHint: existingLocal?.animalId ?? '',
      })
      if (!profile.profileId) return null
      this.addProfileToCatalog(profile)
      // Return the catalog-merged version so locally-tracked fields
      // (lastAnimalId, lastAnimalName, lastQuizTitle) are never lost when
      // the API response omits them.
      return this.loadLocalCatalog().find((p) => p.profileId === profile.profileId) ?? profile
    } catch {
      return null
    }
  }

  async getProfile(profileId: string): Promise<ChildProfile | null> {
    return this.loadLocalCatalog().find((p) => p.profileId === profileId) ?? null
  }

  async createProfile(input: CreateProfileInput): Promise<CreateProfileResponse> {
    if (!input.animalVisualKey?.trim()) {
      throw new Error('Explorer animal visual key is required')
    }
    const pin = generatePin()
    // animalId is no longer sent in the POST /profiles request body per the updated API contract.
    // Explorer visual identity is maintained locally via animalVisualKey.
    const body = buildCreateProfileRequestBody({
      displayName: input.displayNickname,
      pin,
      deviceInfo: getDeviceInfo(),
    })
    const dto = await apiClient.post<unknown>('/profiles', body)

    const token = parseSessionTokenFromResponse(dto)
    if (token) {
      storageService.set(STORAGE_KEYS.SESSION_TOKEN, token)
    }

    const profile = mapWireProfileToChildProfile(dto, {
      animalVisualKey: input.animalVisualKey,
      animalIdHint: input.animalId,
    })
    this.addProfileToCatalog(profile)

    const profileCode = parseProfileCodeFromResponse(dto) ?? ''
    const responsePin = parsePinFromResponse(dto) ?? pin

    return {
      profile,
      profileCode,
      pin: responsePin,
    }
  }

  async restoreProfile(input: RestoreProfileInput): Promise<ChildProfile> {
    const dto = await apiClient.post<unknown>('/profiles/restore', {
      profileCode: input.profileCode,
      pin: input.pin,
      deviceInfo: getDeviceInfo(),
    })

    const token = parseSessionTokenFromResponse(dto)
    if (token) {
      storageService.set(STORAGE_KEYS.SESSION_TOKEN, token)
    }

    const profile = mapWireProfileToChildProfile(dto, {
      animalVisualKey: '',
      animalIdHint: '',
    })
    this.addProfileToCatalog(profile)
    return profile
  }

  /**
   * @deprecated Route to repositories.quizzes.saveProgress() instead.
   * The `/profiles/progress` endpoint does not exist in the backend contract.
   * This method is kept only to satisfy the IProfileRepository interface.
   * It applies the progress update locally (no network call) as a safe fallback.
   */
  async saveQuizProgress(
    profileId: string,
    payload: QuizProgressPayload,
  ): Promise<ChildProfile> {
    // No /profiles/progress endpoint exists — apply progress locally only.
    const local = this.loadLocalCatalog().find((p) => p.profileId === profileId)
    if (!local) {
      throw new Error(`Profile "${profileId}" not found`)
    }
    const merged: LegacyStoredProfile = {
      ...local,
      leafPoints: local.leafPoints + payload.pointsEarned,
    }
    const levelDef = getLevelForPoints(merged.leafPoints)
    merged.level = levelDef.level
    merged.levelTitle = levelDef.title
    const migrated = migrateChildProfile(merged)
    this.addProfileToCatalog(migrated)
    return migrated
  }

  /**
   * Generic profile field updates: there is no documented PATCH/POST for arbitrary profile fields.
   * Persist locally so session activation and progress UX stay consistent without 404s.
   */
  async updateProfileProgress(
    profileId: string,
    update: Partial<ChildProfile>,
  ): Promise<ChildProfile> {
    const profiles = this.loadLocalCatalog()
    const idx = profiles.findIndex((p) => p.profileId === profileId)
    if (idx === -1) {
      throw new Error(`Profile "${profileId}" not found`)
    }
    const merged = { ...profiles[idx]!, ...update } as LegacyStoredProfile
    const migrated = migrateChildProfile(merged)
    profiles[idx] = migrated
    this.saveLocalCatalog(profiles)
    return migrated
  }

  async deleteProfile(profileId: string): Promise<void> {
    const profiles = this.loadLocalCatalog()
    this.saveLocalCatalog(profiles.filter((p) => p.profileId !== profileId))
  }
}
