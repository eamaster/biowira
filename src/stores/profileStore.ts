import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChildProfile, CreateProfileInput, CreateProfileResponse, RestoreProfileInput } from '@/domain/session'
import { repositories } from '@/repositories'
import { useSessionStore } from './sessionStore'

export const useProfileStore = defineStore('profile', () => {
  // ── State ──────────────────────────────────────────────────────────────────

  const profiles = ref<ChildProfile[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function loadProfiles(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      profiles.value = await repositories.profile.listProfiles()
    } catch (e) {
      error.value = 'Could not load explorer profiles'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new child profile and immediately activate it.
   * No auto-seeding — the child always creates their own explorer.
   */
  async function createProfile(input: CreateProfileInput): Promise<CreateProfileResponse> {
    const response = await repositories.profile.createProfile(input)
    profiles.value.push(response.profile)
    // Activate immediately after creation
    const sessionStore = useSessionStore()
    await sessionStore.activateProfile(response.profile)
    return response
  }

  /**
   * Restore a child profile from backend explicitly
   */
  async function restoreProfile(input: RestoreProfileInput): Promise<ChildProfile> {
    const profile = await repositories.profile.restoreProfile(input)
    
    // Add to in-memory list if it doesn't exist
    if (!profiles.value.find(p => p.profileId === profile.profileId)) {
        profiles.value.push(profile)
    }

    // Activate immediately
    const sessionStore = useSessionStore()
    await sessionStore.activateProfile(profile)
    return profile
  }

  /**
   * Switch the active session to an existing profile.
   */
  async function switchToProfile(profileId: string): Promise<void> {
    const sessionStore = useSessionStore()
    await sessionStore.switchProfile(profileId)
  }

  /**
   * Delete a profile. If it is currently active, clears the session
   * so the router guard redirects to /welcome.
   */
  async function deleteProfile(profileId: string): Promise<void> {
    await repositories.profile.deleteProfile(profileId)
    profiles.value = profiles.value.filter((p) => p.profileId !== profileId)
    const sessionStore = useSessionStore()
    if (sessionStore.activeProfile?.profileId === profileId) {
      await sessionStore.clearSession()
    }
  }

  /**
   * Persist progress fields for the given profile.
   * Also patches the in-memory active profile in sessionStore so the nav chip
   * stays current without a separate fetch.
   */
  async function updateProgress(
    profileId: string,
    update: Partial<ChildProfile>,
  ): Promise<ChildProfile> {
    const updated = await repositories.profile.updateProfileProgress(profileId, update)
    // Sync in-memory list
    const idx = profiles.value.findIndex((p) => p.profileId === profileId)
    if (idx !== -1) profiles.value[idx] = updated
    // Patch the active profile ref so UI stays reactive
    const sessionStore = useSessionStore()
    if (sessionStore.activeProfile?.profileId === profileId) {
      sessionStore.patchActiveProfile(updated)
    }
    return updated
  }

  return {
    profiles,
    loading,
    error,
    loadProfiles,
    createProfile,
    restoreProfile,
    switchToProfile,
    deleteProfile,
    updateProgress,
  }
})
