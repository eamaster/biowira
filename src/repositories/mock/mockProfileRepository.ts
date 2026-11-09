import type { ChildProfile, CreateProfileInput, RestoreProfileInput, CreateProfileResponse, QuizProgressPayload } from '@/domain/session'
import { getLevelForPoints } from '@/domain/user'
import { storageService } from '@/services/storageService'
import { STORAGE_KEYS, SESSION_OPTIONS } from '@/app/config'
import type { IProfileRepository } from '../interfaces'
import {
  migrateChildProfile,
  profileNeedsPersistenceRewrite,
  type LegacyStoredProfile,
} from '@/domain/profileAnimalMigration'
import {
  assertValidExplorerAnimalId,
  findExplorerAnimalChoice,
} from '@/features/welcome/data/explorerAnimalCatalog'

export class MockProfileRepository implements IProfileRepository {
  private load(): ChildProfile[] {
    const raw = storageService.get<LegacyStoredProfile[]>(STORAGE_KEYS.PROFILES) ?? []
    let dirty = false
    const migrated = raw.map((p) => {
      const m = migrateChildProfile(p)
      if (profileNeedsPersistenceRewrite(p, m)) dirty = true
      return m
    })
    if (dirty) this.save(migrated)
    return migrated
  }

  private save(profiles: ChildProfile[]): void {
    storageService.set(STORAGE_KEYS.PROFILES, profiles)
  }

  async listProfiles(): Promise<ChildProfile[]> {
    return this.load()
  }

  async getCurrentProfile(): Promise<ChildProfile | null> {
      // In mock mode, we assume the first one is the active session if we need a current one, 
      // or we just return null and let mock session repo handle it.
      // But actually, mockSessionRepo calls getProfile(session.profileId) and that's sufficient.
      // Return null or stub.
      return null
  }

  async getProfile(profileId: string): Promise<ChildProfile | null> {
    const profiles = this.load()
    return profiles.find((p) => p.profileId === profileId) ?? null
  }

  async createProfile(input: CreateProfileInput): Promise<CreateProfileResponse> {
    assertValidExplorerAnimalId(input.animalId)
    const entry = findExplorerAnimalChoice(input.animalId)!
    const profiles = this.load()
    if (profiles.length >= SESSION_OPTIONS.maxProfilesPerDevice) {
      throw new Error(
        `Maximum of ${SESSION_OPTIONS.maxProfilesPerDevice} explorer profiles reached on this device`,
      )
    }
    const levelDef = getLevelForPoints(0)
    const now = new Date().toISOString()
    const profile: ChildProfile = {
      profileId: crypto.randomUUID(),
      displayNickname: input.displayNickname,
      animalId: entry.backendAnimalId,
      animalVisualKey: input.animalVisualKey ?? entry.animalVisualKey,
      leafPoints: 0,
      level: levelDef.level,
      levelTitle: levelDef.title,
      createdAt: now,
      lastActiveAt: now,
      guardianBackupLinked: false,
    }
    profiles.push(profile)
    this.save(profiles)
    return {
      profile: { ...profile },
      profileCode: 'MOCK-CODE',
      pin: '1234'
    }
  }

  async restoreProfile(_input: RestoreProfileInput): Promise<ChildProfile> {
    const profiles = this.load()
    const found = profiles[0]
    if (!found) throw new Error('No mock profiles available to restore')
    return found
  }

  async saveQuizProgress(profileId: string, payload: QuizProgressPayload): Promise<ChildProfile> {
    const profiles = this.load()
    const idx = profiles.findIndex((p) => p.profileId === profileId)
    if (idx === -1) throw new Error(`Profile "${profileId}" not found`)
    
    // Simplistic mock behavior: just add points
    const merged = { ...profiles[idx]!, leafPoints: profiles[idx]!.leafPoints + payload.pointsEarned }
    const migrated = migrateChildProfile(merged as LegacyStoredProfile)
    profiles[idx] = migrated
    this.save(profiles)
    return { ...migrated }
  }

  async updateProfileProgress(
    profileId: string,
    update: Partial<ChildProfile>,
  ): Promise<ChildProfile> {
    const profiles = this.load()
    const idx = profiles.findIndex((p) => p.profileId === profileId)
    if (idx === -1) throw new Error(`Profile "${profileId}" not found`)
    const merged = { ...profiles[idx]!, ...update }
    const migrated = migrateChildProfile(merged as LegacyStoredProfile)
    profiles[idx] = migrated
    this.save(profiles)
    return { ...migrated }
  }

  async deleteProfile(profileId: string): Promise<void> {
    const profiles = this.load()
    this.save(profiles.filter((p) => p.profileId !== profileId))
  }
}
