import type { IBadgeRepository } from '../interfaces'
import type { BackendBadge } from '@/domain/badgeApi.dto'

/**
 * Mock badge repository for unit tests and local development.
 * Returns an empty badge list — badge data is backend-authoritative.
 * In test environments, badge display is verified via API integration tests only.
 */
export class MockBadgeRepository implements IBadgeRepository {
  async getBadges(): Promise<BackendBadge[]> {
    return []
  }
}
