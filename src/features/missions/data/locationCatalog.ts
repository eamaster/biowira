// ============================================================
// BioWira — Preset Location Catalog
// Child-friendly preset Malaysian city locations.
// No real geolocation required — children pick from this list.
// ============================================================

import type { PresetLocation } from '@/domain/mission'

/**
 * Preset Malaysian city locations available in the Mission location picker.
 * Keep this list short and recognisable for children aged 6–12.
 */
export const PRESET_LOCATIONS: PresetLocation[] = [
  {
    id: 'kuala-lumpur',
    label: 'Kuala Lumpur',
    region: 'Federal Territory',
    latitude: 3.1390,
    longitude: 101.6869,
  },
  {
    id: 'penang',
    label: 'Penang',
    region: 'Pulau Pinang',
    latitude: 5.4141,
    longitude: 100.3288,
  },
  {
    id: 'johor-bahru',
    label: 'Johor Bahru',
    region: 'Johor',
    latitude: 1.4927,
    longitude: 103.7414,
  },
  {
    id: 'kuching',
    label: 'Kuching',
    region: 'Sarawak',
    latitude: 1.5535,
    longitude: 110.3592,
  },
  {
    id: 'kota-kinabalu',
    label: 'Kota Kinabalu',
    region: 'Sabah',
    latitude: 5.9788,
    longitude: 116.0753,
  },
  {
    id: 'ipoh',
    label: 'Ipoh',
    region: 'Perak',
    latitude: 4.5975,
    longitude: 101.0901,
  },
  {
    id: 'malacca',
    label: 'Malacca City',
    region: 'Melaka',
    latitude: 2.1896,
    longitude: 102.2501,
  },
  {
    id: 'putrajaya',
    label: 'Putrajaya',
    region: 'Federal Territory',
    latitude: 2.9264,
    longitude: 101.6964,
  },
]

/** Resolve a location by its ID. Returns undefined if not found. */
export function getLocationById(id: string): PresetLocation | undefined {
  return PRESET_LOCATIONS.find((loc) => loc.id === id)
}
