import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchWeatherForLocation } from '@/services/weatherService'

describe('weatherService.fetchWeatherForLocation', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('parses Open-Meteo current_weather (code 0) as sunny when mild', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        current_weather: { weathercode: 0, temperature: 22 },
      }),
    } as Response)

    const w = await fetchWeatherForLocation(3.14, 101.69, 'KL')
    expect(w.condition).toBe('sunny')
    expect(w.isOutdoorSafe).toBe(true)
    expect(w.locationLabel).toBe('KL')
  })

  it('accepts string weathercode from API', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        current_weather: { weathercode: '61', temperature: '24' },
      }),
    } as Response)

    const w = await fetchWeatherForLocation(3.14, 101.69)
    expect(w.condition).toBe('rainy')
    expect(w.isOutdoorSafe).toBe(false)
  })

  it('supports legacy current object shape', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        current: { weathercode: 2, temperature: 20 },
      }),
    } as Response)

    const w = await fetchWeatherForLocation(1, 100)
    expect(w.condition).toBe('cloudy')
    expect(w.isOutdoorSafe).toBe(true)
  })

  it('maps WMO 87+ to stormy (avoids falling through to unknown)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        current_weather: { weathercode: 96, temperature: 25 },
      }),
    } as Response)

    const w = await fetchWeatherForLocation(3, 101)
    expect(w.condition).toBe('stormy')
    expect(w.isOutdoorSafe).toBe(false)
  })

  it('returns safe indoor fallback on HTTP error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    } as Response)

    const w = await fetchWeatherForLocation(3, 101, 'Test')
    expect(w.condition).toBe('unknown')
    expect(w.isOutdoorSafe).toBe(false)
    expect(w.locationLabel).toBe('Test')
  })

  it('returns safe indoor fallback on network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network'))

    const w = await fetchWeatherForLocation(3, 101)
    expect(w.condition).toBe('unknown')
    expect(w.isOutdoorSafe).toBe(false)
  })
})
