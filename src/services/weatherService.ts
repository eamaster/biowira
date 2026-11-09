// ============================================================
// BioWira Weather Service
// Fetches and normalises weather data from Open-Meteo.
// Open-Meteo is a free public API — no API key required.
// https://open-meteo.com/en/docs
//
// ALL weather-response parsing is centralised here.
// Components and stores only ever receive NormalizedWeather.
// ============================================================

import type { NormalizedWeather, NormalizedWeatherCondition } from '@/domain/weather'

/**
 * Base URL for the Open-Meteo forecast API.
 * Can be overridden via VITE_WEATHER_API_BASE_URL for CI/testing.
 */
function getWeatherApiBase(): string {
  const override = import.meta.env['VITE_WEATHER_API_BASE_URL']
  if (override && typeof override === 'string' && override.trim() !== '') {
    return override.trim().replace(/\/+$/, '')
  }
  return 'https://api.open-meteo.com/v1'
}

/**
 * WMO Weather Interpretation Codes → NormalizedWeatherCondition
 * Reference: https://open-meteo.com/en/docs#weathervariables
 *
 * 0        Clear sky           → sunny
 * 1,2,3    Partly cloudy, etc  → cloudy
 * 45,48    Fog                 → cloudy (not unsafe, but not ideal)
 * 51-67    Drizzle / Rain      → rainy
 * 71-77    Snow (rare in MY)   → rainy
 * 80-82    Rain showers        → rainy
 * 85-86    Snow showers        → rainy
 * 87-99    Severe / thunder    → stormy (codes 95–99; also 87–94 per WMO where present)
 */
function mapWmoCodeToCondition(code: number, tempCelsius?: number): NormalizedWeatherCondition {
  if (code === 0) {
    // Check for extreme heat (Malaysia: >38°C is unsafe-outdoor)
    if (tempCelsius !== undefined && tempCelsius >= 38) return 'unsafe-outdoor'
    if (tempCelsius !== undefined && tempCelsius >= 34) return 'hot'
    return 'sunny'
  }
  if (code >= 1 && code <= 3) return 'cloudy'
  if (code === 45 || code === 48) return 'cloudy'
  if (code >= 51 && code <= 86) return 'rainy'
  if (code >= 87 && code <= 99) return 'stormy'
  return 'unknown'
}

function isOutdoorSafe(condition: NormalizedWeatherCondition): boolean {
  return condition === 'sunny' || condition === 'cloudy'
}

/**
 * Fetch and normalise weather for the given coordinates.
 *
 * On any error (network failure, parse error, timeout) this function returns
 * a safe fallback: { condition: 'unknown', isOutdoorSafe: false }.
 * The caller must never need to handle exceptions from this function.
 */
export async function fetchWeatherForLocation(
  latitude: number,
  longitude: number,
  locationLabel?: string,
): Promise<NormalizedWeather> {
  const base = getWeatherApiBase()
  const url = `${base}/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 s timeout

    let response: Response
    try {
      response = await fetch(url, { signal: controller.signal })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      console.warn(`[weatherService] HTTP ${response.status} for weather fetch`)
      return { condition: 'unknown', isOutdoorSafe: false, locationLabel }
    }

    const json: unknown = await response.json()

    // Parse and validate the response shape we expect (Open-Meteo v1 forecast API).
    // Legacy: some proxies or older docs used `current` instead of `current_weather`.
    let cw: Record<string, unknown> | null = null
    if (typeof json === 'object' && json !== null) {
      const o = json as Record<string, unknown>
      const cur = o['current_weather']
      if (typeof cur === 'object' && cur !== null) {
        cw = cur as Record<string, unknown>
      } else {
        const legacy = o['current']
        if (typeof legacy === 'object' && legacy !== null) {
          cw = legacy as Record<string, unknown>
        }
      }
    }

    if (!cw) {
      console.warn('[weatherService] Unexpected response shape (no current_weather/current)', json)
      return { condition: 'unknown', isOutdoorSafe: false, locationLabel }
    }

    const rawCode = cw['weathercode']
    let weathercode: number | undefined
    if (typeof rawCode === 'number' && !Number.isNaN(rawCode)) {
      weathercode = rawCode
    } else if (typeof rawCode === 'string') {
      const n = parseInt(rawCode, 10)
      if (!Number.isNaN(n)) weathercode = n
    }

    const tempRaw = cw['temperature']
    let temperature: number | undefined
    if (typeof tempRaw === 'number' && !Number.isNaN(tempRaw)) {
      temperature = tempRaw
    } else if (typeof tempRaw === 'string') {
      const t = parseFloat(tempRaw)
      if (!Number.isNaN(t)) temperature = t
    }

    // Parse is_day: Open-Meteo returns 1 (day) or 0 (night) as a number
    const rawIsDay = cw['is_day']
    let isDay: boolean | undefined
    if (typeof rawIsDay === 'number') {
      isDay = rawIsDay !== 0
    } else if (typeof rawIsDay === 'boolean') {
      isDay = rawIsDay
    }

    if (weathercode === undefined) {
      console.warn('[weatherService] Missing or invalid weathercode in response', cw)
      return { condition: 'unknown', isOutdoorSafe: false, locationLabel }
    }

    const condition = mapWmoCodeToCondition(weathercode, temperature)
    return {
      condition,
      isOutdoorSafe: isOutdoorSafe(condition),
      temperatureCelsius: temperature,
      locationLabel,
      weatherCode: weathercode,
      isDay,
    }
  } catch (err) {
    // Network error, abort, or any other thrown value
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn('[weatherService] Weather fetch timed out')
    } else {
      console.warn('[weatherService] Weather fetch failed', err)
    }
    return { condition: 'unknown', isOutdoorSafe: false, locationLabel }
  }
}
