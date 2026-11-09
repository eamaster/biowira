export interface AttributionSource {
  id: string
  name: string
  url: string
  descriptor?: string
}

export const sources: AttributionSource[] = [
  { id: 'open-meteo', name: 'Open-Meteo', url: 'https://open-meteo.com/', descriptor: 'Weather forecasts' },
  { id: 'iucn', name: 'IUCN Red List', url: 'https://www.iucnredlist.org/', descriptor: 'Conservation status reference' },
  { id: 'gbif', name: 'GBIF', url: 'https://www.gbif.org/', descriptor: 'Biodiversity reference' },
  { id: 'inaturalist', name: 'iNaturalist', url: 'https://www.inaturalist.org/', descriptor: 'Wildlife observation reference' },
  { id: 'wikimedia', name: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/', descriptor: 'Reference photos' }
]
