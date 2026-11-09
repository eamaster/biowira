import { ConservationStatus } from './enums'

/**
 * Maps IUCN-style codes returned by the BioWira API (list `statusCode`, detail `conservationCode`)
 * to internal ConservationStatus values used for theme colors and STATUS_LABELS.
 */
export function conservationCodeToStatus(code: string | undefined | null): ConservationStatus {
  const c = (code ?? '').trim().toUpperCase()
  switch (c) {
    case 'EX':
      return ConservationStatus.Extinct
    case 'EW':
      return ConservationStatus.ExtinctInTheWild
    case 'CR':
      return ConservationStatus.CriticallyEndangered
    case 'EN':
      return ConservationStatus.Endangered
    case 'VU':
      return ConservationStatus.Vulnerable
    case 'NT':
      return ConservationStatus.NearThreatened
    case 'LC':
      return ConservationStatus.LeastConcern
    case 'DD':
      return ConservationStatus.DataDeficient
    case 'NE':
      return ConservationStatus.NotEvaluated
    default:
      return ConservationStatus.NotEvaluated
  }
}
