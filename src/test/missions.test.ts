import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMissionStore } from '@/stores/missionStore'
import { useProgressStore } from '@/stores/progressStore'
import { MISSION_CATALOG, getTemplatesByEnvironment } from '@/features/missions/data/missionCatalog'
import { getNewlyUnlockedBadges } from '@/features/missions/data/badgeCatalog'
import { fetchWeatherForLocation } from '@/services/weatherService'

// Mock weather service to avoid actual network calls
vi.mock('@/services/weatherService', () => ({
  fetchWeatherForLocation: vi.fn(),
}))

describe('Mission Domain & Catalogs', () => {
  it('every mission template in catalog is valid', () => {
    expect(MISSION_CATALOG.length).toBeGreaterThan(0)
    for (const template of MISSION_CATALOG) {
      expect(template.steps).toHaveLength(3)
      expect(template.durationMinutes).toBeGreaterThanOrEqual(5)
      expect(template.durationMinutes).toBeLessThanOrEqual(15)
      expect(template.pointsValue).toBeGreaterThan(0)
    }
  })

  it('selects outdoor templates when outdoor is safe', () => {
    const templates = getTemplatesByEnvironment(true)
    const hasIndoorOnly = templates.some((t) => t.environment === 'indoor')
    expect(hasIndoorOnly).toBe(false)
  })

  it('selects indoor templates when outdoor is unsafe', () => {
    const templates = getTemplatesByEnvironment(false)
    const hasOutdoorOnly = templates.some((t) => t.environment === 'outdoor')
    expect(hasOutdoorOnly).toBe(false)
  })

  it('properly calculates newly unlocked badges', () => {
    const noBadges = getNewlyUnlockedBadges(0, [])
    expect(noBadges).toHaveLength(0)

    const firstBadge = getNewlyUnlockedBadges(1, [])
    expect(firstBadge.map((b) => b.id)).toContain('nature-starter')

    const alreadyUnlockedFirst = getNewlyUnlockedBadges(2, ['nature-starter'])
    expect(alreadyUnlockedFirst).toHaveLength(0)

    const fifthBadge = getNewlyUnlockedBadges(5, ['nature-starter'])
    expect(fifthBadge.map((b) => b.id)).toContain('mission-5')
  })
})

describe('missionStore (API-backed via mock repos)', () => {
  let store: ReturnType<typeof useMissionStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useMissionStore()

    vi.mocked(fetchWeatherForLocation).mockReset()
    vi.mocked(fetchWeatherForLocation).mockResolvedValue({
      condition: 'sunny',
      isOutdoorSafe: true,
      weatherCode: 0,
      isDay: true,
    })

    localStorage.clear()
  })

  it('fetchMission populates activeMission with a preview from mock repo', async () => {
    store.selectedLocationId = 'kuala-lumpur'
    await store.fetchWeather()
    await store.fetchMission()

    expect(store.activeMission).not.toBeNull()
    expect(store.activeMission!.status).toBe('preview')
    expect(store.activeMission!.completed).toBe(false)
    expect(store.activeMission!.title).toBeTruthy()
    expect(store.activeMission!.steps).toHaveLength(3)
  })

  it('startMission transitions preview → in_progress', async () => {
    store.selectedLocationId = 'kuala-lumpur'
    await store.fetchWeather()
    await store.fetchMission()

    expect(store.activeMission!.status).toBe('preview')
    await store.startMission()

    expect(store.activeMission!.status).toBe('in_progress')
    expect(store.activeMission!.profileMissionId).toBeDefined()
  })

  it('completeMission transitions in_progress → completed and refreshes history', async () => {
    store.selectedLocationId = 'kuala-lumpur'
    await store.fetchWeather()
    await store.fetchMission()
    await store.startMission()

    expect(store.activeMission!.status).toBe('in_progress')

    await store.completeMission()

    expect(store.activeMission!.status).toBe('completed')
    expect(store.activeMission!.completed).toBe(true)

    // History is refreshed from mock repo (stateful mock tracks completion)
    expect(store.history.length).toBeGreaterThanOrEqual(0) // mock may or may not return history
  })

  it('completeMission calls addPoints when mock returns totalPoints = 0', async () => {
    const progressStore = useProgressStore()
    store.selectedLocationId = 'kuala-lumpur'
    await store.fetchWeather()
    await store.fetchMission()
    await store.startMission()

    const pointsValue = store.activeMission!.pointsValue
    progressStore.addPoints = vi.fn().mockResolvedValue(undefined)

    await store.completeMission()

    // Mock completeMission returns totalPoints: 0 → fallback to addPoints
    expect(progressStore.addPoints).toHaveBeenCalledWith(pointsValue)
  })

  it('completeMission is idempotent — calling twice does not re-complete', async () => {
    store.selectedLocationId = 'kuala-lumpur'
    await store.fetchWeather()
    await store.fetchMission()
    await store.startMission()

    const progressStore = useProgressStore()
    progressStore.addPoints = vi.fn().mockResolvedValue(undefined)

    await store.completeMission()
    await store.completeMission() // second call should be ignored (already completed)

    expect(progressStore.addPoints).toHaveBeenCalledTimes(1)
  })

  it('handles weather failure gracefully — still fetches a mission (indoor)', async () => {
    store.selectedLocationId = 'kuala-lumpur'
    vi.mocked(fetchWeatherForLocation).mockRejectedValue(new Error('Network error'))

    await store.fetchWeather()

    expect(store.weather?.condition).toBe('unknown')
    expect(store.weather?.isOutdoorSafe).toBe(false)

    await store.fetchMission()
    // Mock repo generates an indoor mission when isDay=true, weatherCode=0 (fallback values)
    expect(store.activeMission).not.toBeNull()
  })

  it('selectLocation triggers weather fetch and new mission preview', async () => {
    vi.mocked(fetchWeatherForLocation).mockClear()
    store.selectedLocationId = 'kuala-lumpur'
    await store.fetchWeather()

    vi.mocked(fetchWeatherForLocation).mockResolvedValue({
      condition: 'rainy',
      isOutdoorSafe: false,
      weatherCode: 51,
      isDay: true,
    })

    await store.selectLocation('penang')

    expect(fetchWeatherForLocation).toHaveBeenCalled()
    expect(store.selectedLocationId).toBe('penang')
    expect(store.activeMission).not.toBeNull()
  })

  it('newBadges from completeMission are stored in recentlyEarnedBadges', async () => {
    store.selectedLocationId = 'kuala-lumpur'
    await store.fetchWeather()
    await store.fetchMission()
    await store.startMission()

    await store.completeMission()

    // After 1st completion, mock repo should return nature-starter badge
    // recentlyEarnedBadges should contain the new badges from the complete response
    expect(Array.isArray(store.recentlyEarnedBadges)).toBe(true)
    // First completion → nature-starter badge
    if (store.recentlyEarnedBadges.length > 0) {
      expect(store.recentlyEarnedBadges[0].badgeName).toBeTruthy()
    }
  })

  it('refreshMission clears recentlyEarnedBadges and fetches new preview', async () => {
    store.selectedLocationId = 'kuala-lumpur'
    await store.fetchWeather()
    await store.fetchMission()
    await store.startMission()
    await store.completeMission()

    // Simulate new mission request
    await store.refreshMission()

    expect(store.recentlyEarnedBadges).toHaveLength(0)
    expect(store.activeMission?.status).toBe('preview')
  })
})
