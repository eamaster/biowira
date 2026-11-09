// ============================================================
// BioWira Weather Domain Types
// Normalised weather types for use across the app.
// All weather parsing lives in weatherService.ts — never here.
// ============================================================

/**
 * App-level weather condition, normalised from raw provider codes.
 * Components and stores only ever see this enum — never raw WMO codes.
 */
export type NormalizedWeatherCondition =
  | 'sunny'
  | 'cloudy'
  | 'rainy'
  | 'stormy'
  | 'hot'
  | 'unsafe-outdoor'
  | 'unknown'

/**
 * The normalised weather snapshot the app works with.
 * Produced by weatherService and consumed by missionStore.
 */
export interface NormalizedWeather {
  condition: NormalizedWeatherCondition
  /**
   * True when conditions are safe enough for an outdoor mission.
   * Anything rainy, stormy, or 'unsafe-outdoor' sets this false.
   */
  isOutdoorSafe: boolean
  /** Celsius, if available from the provider response. */
  temperatureCelsius?: number
  /** The label of the location this weather was fetched for (for display). */
  locationLabel?: string
  /**
   * Raw WMO weather interpretation code from the provider.
   * Preserved so mission API calls can pass the exact code the backend expects.
   * Never use this for child-facing UI — use `condition` instead.
   */
  weatherCode?: number
  /**
   * Raw is_day flag from the provider (1 = day, 0 = night).
   * Preserved for the mission API query parameter `isDay`.
   */
  isDay?: boolean
}

/**
 * Human-readable display information for a weather condition.
 * Created by getWeatherDisplay() so templates stay logic-free.
 */
export interface WeatherDisplayInfo {
  /** Child-friendly label e.g. "Sunny!" or "It's raining outside." */
  label: string
  /** Single emoji representing the condition */
  emoji: string
  /** Short indoor/outdoor suggestion e.g. "Great for outdoor missions" */
  suggestion: string
}

/** Map a NormalizedWeatherCondition to child-friendly display info. */
export function getWeatherDisplay(condition: NormalizedWeatherCondition): WeatherDisplayInfo {
  switch (condition) {
    case 'sunny':
      return { label: 'Sunny outside!', emoji: '☀️', suggestion: 'Great for outdoor missions!' }
    case 'cloudy':
      return { label: 'Cloudy skies', emoji: '⛅', suggestion: 'Good for outdoor missions!' }
    case 'rainy':
      return { label: "It's raining", emoji: '🌧️', suggestion: "Let's do an indoor mission today." }
    case 'stormy':
      return { label: 'Stormy weather', emoji: '⛈️', suggestion: 'Stay safe inside with an indoor mission!' }
    case 'hot':
      return { label: 'Very hot today', emoji: '🌡️', suggestion: 'Try a cool indoor mission.' }
    case 'unsafe-outdoor':
      return { label: 'Stay indoors today', emoji: '⚠️', suggestion: "It's not safe outside right now — indoor mission time!" }
    case 'unknown':
    default:
      return {
        label: 'Indoor mission today',
        emoji: '🌿',
        suggestion: "We'll pick a safe indoor mission for you!",
      }
  }
}
