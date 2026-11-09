import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChildProfile, SessionState } from '@/domain/session'
import { repositories } from '@/repositories'

export const useSessionStore = defineStore('session', () => {
  // ── State ──────────────────────────────────────────────────────────────────

  const sessionState = ref<SessionState>('none')
  const activeProfile = ref<ChildProfile | null>(null)

  /**
   * Becomes true once bootstrapSession() has resolved.
   * The router guard waits on readyPromise before making redirect decisions
   * so there is never a redirect loop or ambiguous half-ready state.
   */
  const isReady = ref(false)

  // Internal resolver — called exactly once when bootstrap completes
  let _readyResolve: (() => void) | null = null
  const readyPromise: Promise<void> = new Promise<void>((resolve) => {
    _readyResolve = resolve
  })

  // ── Computed ────────────────────────────────────────────────────────────────

  const hasActiveSession = computed(
    () => sessionState.value === 'active' && activeProfile.value !== null,
  )

  const activeProfileId = computed(() => activeProfile.value?.profileId ?? null)

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Run once at app startup (from main.ts, BEFORE app.use(router)).
   * Reads stored session from localStorage and resolves readyPromise when done.
   * Any subsequent router guard invocation sees isReady === true.
   */
  async function bootstrapSession(): Promise<void> {
    sessionState.value = 'restoring'
    try {
      const result = await repositories.session.bootstrapSession()
      sessionState.value = result.state
      activeProfile.value = result.profile
    } catch (e) {
      console.error('[sessionStore] Bootstrap failed:', e)
      sessionState.value = 'choosing'
      activeProfile.value = null
    } finally {
      isReady.value = true
      _readyResolve?.()
    }
  }

  /**
   * Activate a profile: persist the session and update state.
   * Called after profile creation or explicit switch.
   */
  async function activateProfile(profile: ChildProfile): Promise<void> {
    await repositories.session.setActiveSession(profile.profileId)
    // Bump lastActiveAt in storage
    const updated = await repositories.profile.updateProfileProgress(profile.profileId, {
      lastActiveAt: new Date().toISOString(),
    })
    activeProfile.value = updated
    sessionState.value = 'active'
  }

  /**
   * Switch to an existing profile by ID.
   * Throws if the profile does not exist.
   */
  async function switchProfile(profileId: string): Promise<void> {
    const profile = await repositories.profile.getProfile(profileId)
    if (!profile) throw new Error(`Profile "${profileId}" not found`)
    await activateProfile(profile)
  }

  /**
   * Clear the active session (explicit logout / explorer switch).
   * Sets state back to 'choosing' so the router guard redirects to /welcome.
   */
  async function clearSession(): Promise<void> {
    await repositories.session.clearSession()
    activeProfile.value = null
    sessionState.value = 'choosing'
  }

  /**
   * Patch the in-memory activeProfile without a full re-fetch.
   * Used by progressStore to keep the nav chip in sync.
   */
  function patchActiveProfile(update: Partial<ChildProfile>): void {
    if (activeProfile.value) {
      activeProfile.value = { ...activeProfile.value, ...update }
    }
  }

  return {
    sessionState,
    activeProfile,
    isReady,
    readyPromise,
    hasActiveSession,
    activeProfileId,
    bootstrapSession,
    activateProfile,
    switchProfile,
    clearSession,
    patchActiveProfile,
  }
})
