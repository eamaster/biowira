export enum AnimalCategory {
  All = 'all',
  Mammals = 'mammals',
  Birds = 'birds',
  Reptiles = 'reptiles',
  MarineFreshwater = 'marine_freshwater',
  Amphibians = 'amphibians',
  Insects = 'insects',
}

/**
 * IUCN Red List conservation status values.
 * Replaces the previous 5-value simplified set.
 * All 9 official IUCN categories are represented.
 */
export enum ConservationStatus {
  Extinct              = 'extinct',
  ExtinctInTheWild     = 'extinct_in_the_wild',
  CriticallyEndangered = 'critically_endangered',
  Endangered           = 'endangered',
  Vulnerable           = 'vulnerable',
  NearThreatened       = 'near_threatened',
  LeastConcern         = 'least_concern',
  DataDeficient        = 'data_deficient',
  NotEvaluated         = 'not_evaluated',
}

export enum HabitatZone {
  Rainforest = 'rainforest',
  Mountain = 'mountain',
  River = 'river',
  CoastalArea = 'coastal_area',
  Mangrove = 'mangrove',
  MarineReserve = 'marine_reserve',
}

// ViewMode is no longer used as a primary UI toggle (list-first Discover).
// Kept here as a deprecated-but-compiling export to avoid breaking any
// residual reference during migration. Remove in a future cleanup pass.
/** @deprecated List is now the only primary Discover view. */
export enum ViewMode {
  Map = 'map',
  Grid = 'grid',
}

export enum QuizAnswerResult {
  Correct = 'correct',
  Wrong = 'wrong',
  Pending = 'pending',
}
