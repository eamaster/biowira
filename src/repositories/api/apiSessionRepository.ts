// API Session Repository — scaffolded, typed, documented.
// These endpoints are assumed; the backend does not exist yet.
// The app remains fully functional in VITE_USE_MOCK=true mode.
//
// Assumed API contract:
//   POST /session/restore  → bootstrap session from device token / cookie
//   GET  /session          → get current active session
//   POST /session/logout   → clear server-side session

import { apiClient, ApiError } from '@/services/apiClient'
import type { ActiveSession, SessionBootstrapResult } from '@/domain/session'
import type { ISessionRepository } from '../interfaces'
import { storageService } from '@/services/storageService'
import { STORAGE_KEYS } from '@/app/config'
import { ApiProfileRepository } from './apiProfileRepository'

const profileRepo = new ApiProfileRepository()

export class ApiSessionRepository implements ISessionRepository {
  async bootstrapSession(): Promise<SessionBootstrapResult> {
    try {
      const token = storageService.get<string>(STORAGE_KEYS.SESSION_TOKEN)
      if (!token) return { state: 'choosing', profile: null }

      // Validate session with GET /profiles (which returns the current active profile)
      // We rely on the apiClient automatically attaching the X-Session-Token
      const profile = await profileRepo.getCurrentProfile()
      if (!profile) return { state: 'choosing', profile: null }
      
      return { state: 'active', profile }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        storageService.remove(STORAGE_KEYS.SESSION_TOKEN)
      }
      return { state: 'choosing', profile: null }
    }
  }

  async getActiveSession(): Promise<ActiveSession | null> {
    const token = storageService.get<string>(STORAGE_KEYS.SESSION_TOKEN)
    if (!token) return null
    return {
      profileId: 'unknown',
      restoredAt: new Date().toISOString()
    }
  }

  async setActiveSession(profileId: string): Promise<ActiveSession> {
    // For local switching, the app relies on the token from create/restore.
    return {
      profileId,
      restoredAt: new Date().toISOString()
    }
  }

  async clearSession(): Promise<void> {
    try {
      if (storageService.get(STORAGE_KEYS.SESSION_TOKEN)) {
        await apiClient.delete('/profiles/session')
      }
    } catch {
      // Ignore if server token is already invalidated
    } finally {
      storageService.remove(STORAGE_KEYS.SESSION_TOKEN)
    }
  }
}
