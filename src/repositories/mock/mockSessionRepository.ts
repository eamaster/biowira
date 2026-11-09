import type { SessionBootstrapResult, ActiveSession } from '@/domain/session'
import { storageService } from '@/services/storageService'
import { STORAGE_KEYS } from '@/app/config'
import type { ISessionRepository } from '../interfaces'
import { MockProfileRepository } from './mockProfileRepository'

// Shared profile repo instance — session repo delegates to it for profile lookups
const profileRepo = new MockProfileRepository()

export class MockSessionRepository implements ISessionRepository {
  async bootstrapSession(): Promise<SessionBootstrapResult> {
    const session = storageService.get<ActiveSession>(STORAGE_KEYS.ACTIVE_SESSION)

    if (!session) {
      return { state: 'choosing', profile: null }
    }

    const profile = await profileRepo.getProfile(session.profileId)

    if (!profile) {
      // Session references a deleted profile — clean up stale data
      storageService.remove(STORAGE_KEYS.ACTIVE_SESSION)
      return { state: 'choosing', profile: null }
    }

    return { state: 'active', profile }
  }

  async getActiveSession(): Promise<ActiveSession | null> {
    return storageService.get<ActiveSession>(STORAGE_KEYS.ACTIVE_SESSION)
  }

  async setActiveSession(profileId: string): Promise<ActiveSession> {
    const session: ActiveSession = {
      profileId,
      restoredAt: new Date().toISOString(),
    }
    storageService.set(STORAGE_KEYS.ACTIVE_SESSION, session)
    return session
  }

  async clearSession(): Promise<void> {
    storageService.remove(STORAGE_KEYS.ACTIVE_SESSION)
  }
}
