// ============================================================
// BioWira Mission Store
// Manages mission state using backend API repositories.
// State machine: preview → in_progress → completed
// History and badges are backend-authoritative.
// ============================================================

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { MissionInstance } from '@/domain/mission'
import type { MissionHistoryItem, NewBadgeDto } from '@/domain/missionApi.dto'
import type { BackendBadge } from '@/domain/badgeApi.dto'
import type { GameJournalRecord } from '@/domain/gameJournal'
import type { NormalizedWeather } from '@/domain/weather'
import { getWeatherDisplay } from '@/domain/weather'
import { STORAGE_KEYS } from '@/app/config'
import { storageService } from '@/services/storageService'
import { useSessionStore } from './sessionStore'
import { useProgressStore } from './progressStore'
import { useGameJournalStore } from './gameJournalStore'
import { fetchWeatherForLocation } from '@/services/weatherService'
import { getLocationById, PRESET_LOCATIONS } from '@/features/missions/data/locationCatalog'
import { repositories } from '@/repositories'
import { getLevelForPoints } from '@/domain/user'
import { ApiError } from '@/services/apiClient'
import { getNatureMissionJournalStampIdFromTitle } from '@/features/game-journal/data/journalMissionMapping'

/** Persisted mission state shape (subset) */
interface PersistedMissionState {
  selectedLocationId: string | null
  activeMission: MissionInstance | null
}

export const useMissionStore = defineStore('mission', () => {
  const sessionStore = useSessionStore()
  const progressStore = useProgressStore()
  const journalStore = useGameJournalStore()

  // ── State ──────────────────────────────────────────────────────────────────

  const profileId = ref<string | null>(null)

  // Persisted
  const selectedLocationId = ref<string | null>(null)
  const activeMission = ref<MissionInstance | null>(null)

  // Backend-authoritative (refreshed from API)
  const history = ref<MissionHistoryItem[]>([])
  const badgeShelfData = ref<BackendBadge[]>([])

  // Transient: badges earned in the most recent completion (for celebration UI)
  const recentlyEarnedBadges = ref<NewBadgeDto[]>([])

  // Latest mission result — populated after completeMission() succeeds,
  // read by MissionResultPage.
  const latestMissionResult = ref<{
    missionTitle: string
    missionDescription: string
    missionEnvironment: string
    missionDurationMinutes: number
    leafPointsEarned: number
    restorationPercentBefore: number
    restorationPercentAfter: number
    restorationPercentDelta: number
    stampId: string
    stampTitle: string
    journalRecordId: string
  } | null>(null)

  // Ephemeral UI state
  const weather = ref<NormalizedWeather | null>(null)
  const weatherLoading = ref(false)
  const weatherError = ref<string | null>(null)
  const missionLoading = ref(false)
  const missionStarting = ref(false)
  const missionCompleting = ref(false)
  const missionError = ref<string | null>(null)

  // ── Computed ────────────────────────────────────────────────────────────────

  const selectedLocation = computed(() => {
    if (!selectedLocationId.value) return null
    return getLocationById(selectedLocationId.value) ?? null
  })

  const completionCount = computed(() => history.value.length)

  const weatherDisplay = computed(() => {
    if (weatherLoading.value) {
      return { label: 'Checking weather...', emoji: '🌿', suggestion: 'Almost ready...' }
    }
    if (weatherError.value) {
      return {
        label: "Let's play inside today",
        emoji: '🌿',
        suggestion: 'We picked a safe indoor mission for you.',
      }
    }
    if (!weather.value) return null
    return getWeatherDisplay(weather.value.condition)
  })

  // ── Profile Hydration ────────────────────────────────────────────────────────

  watch(
    () => sessionStore.activeProfile,
    async (profile) => {
      if (profile) {
        await initForProfile(profile.profileId)
      } else {
        clearState()
      }
    },
    { immediate: true },
  )

  function clearState() {
    profileId.value = null
    selectedLocationId.value = null
    activeMission.value = null
    history.value = []
    badgeShelfData.value = []
    recentlyEarnedBadges.value = []
    weather.value = null
    weatherLoading.value = false
    weatherError.value = null
    missionLoading.value = false
    missionStarting.value = false
    missionCompleting.value = false
    missionError.value = null
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function initForProfile(id: string) {
    if (profileId.value === id) return
    clearState()
    profileId.value = id

    // Restore persisted location and active mission
    const key = STORAGE_KEYS.missionState(id)
    const stored = storageService.get<PersistedMissionState>(key)
    if (stored) {
      selectedLocationId.value = stored.selectedLocationId
      // Restore activeMission only if it was in-progress (not a stale preview)
      if (stored.activeMission && stored.activeMission.status === 'in_progress') {
        activeMission.value = stored.activeMission
      }
    } else {
      selectedLocationId.value = PRESET_LOCATIONS[0]!.id
    }

    // Fetch weather first, then mission preview
    if (selectedLocationId.value) {
      await fetchWeather()
    }
    // Load history and badges from backend
    await Promise.all([refreshHistory(), refreshBadges()])

    // Auto-fetch a mission preview if none is in-progress
    if (!activeMission.value) {
      await fetchMission()
    }
  }

  function _persist() {
    if (!profileId.value) return
    const key = STORAGE_KEYS.missionState(profileId.value)
    const state: PersistedMissionState = {
      selectedLocationId: selectedLocationId.value,
      activeMission: activeMission.value,
    }
    storageService.set(key, state)
  }

  async function selectLocation(locationId: string) {
    if (selectedLocationId.value === locationId) return

    selectedLocationId.value = locationId
    _persist()

    await fetchWeather()
    // Fetch a new mission preview for the new location/weather
    await fetchMission()
  }

  async function fetchWeather() {
    const loc = selectedLocation.value
    if (!loc) return

    weatherLoading.value = true
    weatherError.value = null

    try {
      const res = await fetchWeatherForLocation(loc.latitude, loc.longitude, loc.label)
      weather.value = res
    } catch (e) {
      console.error('[missionStore] Unexpected weather fetch error', e)
      weatherError.value = 'unavailable'
      weather.value = { condition: 'unknown', isOutdoorSafe: false, locationLabel: loc.label }
    } finally {
      weatherLoading.value = false
    }
  }

  /**
   * Fetch a mission preview from GET /missions/weather-adaptive.
   * Uses raw weatherCode and isDay from the weather response.
   * Falls back gracefully to an indoor weather scenario on error.
   */
  async function fetchMission() {
    missionLoading.value = true
    missionError.value = null

    try {
      const weatherCode = weather.value?.weatherCode ?? 0
      const isDay = weather.value?.isDay ?? true

      const preview = await repositories.missions.getWeatherAdaptiveMission({
        weatherCode,
        isDay,
      })

      activeMission.value = {
        instanceId: crypto.randomUUID(),
        templateId: 'api',
        title: preview.title,
        description: preview.description,
        steps: preview.steps,
        durationMinutes: preview.durationMinutes,
        pointsValue: preview.pointsValue,
        environment: preview.isOutdoor ? 'outdoor' : 'indoor',
        generatedAt: new Date().toISOString(),
        completed: false,
        status: 'preview',
        backendMissionId: preview.backendId,
      }
      _persist()
    } catch (err) {
      // 404 MISSION_NOT_FOUND is handled as a safe empty state
      if (err instanceof ApiError && err.status === 404) {
        console.warn('[missionStore] No weather-adaptive mission found for current conditions')
        activeMission.value = null
      } else {
        console.error('[missionStore] Failed to fetch weather-adaptive mission', err)
        missionError.value = 'fetch'
        activeMission.value = null
      }
    } finally {
      missionLoading.value = false
    }
  }

  /**
   * Start a mission: POST /missions/assign then POST /missions/start.
   * Transitions the mission from 'preview' to 'in_progress'.
   */
  async function startMission() {
    if (!activeMission.value || activeMission.value.status !== 'preview') return
    if (!activeMission.value.backendMissionId) return

    missionStarting.value = true
    missionError.value = null

    try {
      const loc = selectedLocation.value
      const { profileMissionId } = await repositories.missions.assignMission({
        missionId: activeMission.value.backendMissionId,
        weatherCode: weather.value?.weatherCode ?? 0,
        isDay: weather.value?.isDay ?? true,
        weatherTemp: weather.value?.temperatureCelsius ?? 28,
        locationLat: loc?.latitude ?? 3.14,
        locationLon: loc?.longitude ?? 101.69,
      })

      await repositories.missions.startMission(profileMissionId)

      activeMission.value = {
        ...activeMission.value,
        status: 'in_progress',
        profileMissionId,
      }
      _persist()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        console.warn('[missionStore] Session expired when starting mission')
        missionError.value = 'session'
      } else {
        console.error('[missionStore] Failed to start mission', err)
        missionError.value = 'start'
      }
    } finally {
      missionStarting.value = false
    }
  }

  /**
   * Complete the current mission: POST /missions/complete.
   * Patches progress from the server response.
   * Refreshes history and badges after completion.
   */
  async function completeMission() {
    if (!activeMission.value || activeMission.value.completed) return

    missionCompleting.value = true
    missionError.value = null

    // profileMissionId is -1 for mock mode (mock still handles it correctly)
    const profileMissionId = activeMission.value.profileMissionId ?? -1

    try {
      const result = await repositories.missions.completeMission(profileMissionId)

      // Mark completed
      activeMission.value = {
        ...activeMission.value,
        status: 'completed',
        completed: true,
      }

      // Store recently earned badges for the celebration UI
      recentlyEarnedBadges.value = result.newBadges

      // Patch progress from server-authoritative response
      if (result.totalPoints > 0) {
        const levelDef = getLevelForPoints(result.totalPoints)
        sessionStore.patchActiveProfile({
          leafPoints: result.totalPoints,
          level: result.newLevel,
          levelTitle: levelDef.title,
        })
        if (progressStore.progress) {
          progressStore.hydrateFromProfile({
            ...sessionStore.activeProfile!,
            leafPoints: result.totalPoints,
            level: result.newLevel,
            levelTitle: levelDef.title,
          })
        }
      } else {
        // Mock or backend returned zeros — add points locally using the mission's declared value
        await progressStore.addPoints(activeMission.value.pointsValue)
      }

      // Refresh history and badges from backend
      await Promise.all([refreshHistory(), refreshBadges()])

      // Follow-up GET /profiles to confirm totalPoints, totalMissions, and
      // streakDays are authoritative and survive a hard refresh.
      try {
        const refreshed = await repositories.profile.getCurrentProfile()
        if (refreshed) {
          sessionStore.patchActiveProfile(refreshed)
          progressStore.hydrateFromProfile(refreshed)
        }
      } catch {
        // Non-critical: complete result patch already applied above
      }

      // Record completion in the unified game journal (non-critical, never throws).
      // Capture the returned record to populate latestMissionResult.
      let journalRecord: GameJournalRecord | null = null
      try {
        const mission = activeMission.value
        if (mission) {
          const pointsAwarded = mission.pointsValue ?? 0
          journalRecord = journalStore.recordGameCompletion({
            categoryId: 'nature-mission',
            sourceId: mission.backendMissionId ? String(mission.backendMissionId) : mission.instanceId,
            title: mission.title,
            description: mission.description,
            leafPointsEarned: pointsAwarded,
            stampId: getNatureMissionJournalStampIdFromTitle(mission.title),
            metadata: {
              missionTitle: mission.title,
              missionType: undefined,
              missionEnvironment: mission.environment,
              missionDurationMinutes: mission.durationMinutes,
            },
          })
          latestMissionResult.value = {
            missionTitle: mission.title,
            missionDescription: mission.description,
            missionEnvironment: mission.environment ?? '',
            missionDurationMinutes: mission.durationMinutes ?? 0,
            leafPointsEarned: pointsAwarded,
            restorationPercentBefore: journalRecord.restorationPercentBefore,
            restorationPercentAfter: journalRecord.restorationPercentAfter,
            restorationPercentDelta: journalRecord.restorationPercentDelta,
            stampId: journalRecord.stampId,
            stampTitle: journalRecord.stampTitle,
            journalRecordId: journalRecord.id,
          }
        }
      } catch (journalErr) {
        console.warn('[missionStore] Failed to record journal completion', journalErr)
      }

      _persist()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        console.warn('[missionStore] Session expired when completing mission')
        missionError.value = 'session'
      } else if (err instanceof ApiError && err.status === 404) {
        console.warn('[missionStore] profileMissionId not found when completing')
        missionError.value = 'complete'
      } else {
        console.error('[missionStore] Failed to complete mission', err)
        missionError.value = 'complete'
      }
    } finally {
      missionCompleting.value = false
    }
  }

  /** Refresh mission history from the backend (last 3 completed missions). */
  async function refreshHistory() {
    try {
      history.value = await repositories.missions.getMissionHistory()
    } catch (err) {
      console.warn('[missionStore] Failed to refresh mission history', err)
    }
  }

  /** Refresh badge shelf from the backend. */
  async function refreshBadges() {
    try {
      badgeShelfData.value = await repositories.badges.getBadges()
    } catch (err) {
      console.warn('[missionStore] Failed to refresh badges', err)
    }
  }

  /** Explicit user request for a new mission (after completing one). */
  async function refreshMission() {
    recentlyEarnedBadges.value = []
    await fetchWeather()
    await fetchMission()
  }

  /**
   * @deprecated Use fetchMission() instead.
   * Kept for backward-compat with any callers not yet updated.
   */
  async function generateMission() {
    await fetchMission()
  }

  return {
    // State
    selectedLocationId,
    activeMission,
    history,
    badgeShelfData,
    recentlyEarnedBadges,
    latestMissionResult,
    weather,
    weatherLoading,
    weatherError,
    missionLoading,
    missionStarting,
    missionCompleting,
    missionError,

    // Computed
    selectedLocation,
    completionCount,
    weatherDisplay,

    // Actions
    selectLocation,
    fetchWeather,
    fetchMission,
    generateMission,
    startMission,
    completeMission,
    refreshHistory,
    refreshBadges,
    refreshMission,
  }
})
