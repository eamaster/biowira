import { expect, type Page } from '@playwright/test'
import { gotoLoaded } from './gotoLoaded'

/**
 * Persist a mock active profile in localStorage (storageService envelope v1), then
 * reload so bootstrap resolves a session-aware home instead of the welcome chooser.
 *
 * Needed when Playwright reuses an existing dev server where `VITE_SESSION_ENABLED !== 'false'`,
 * because the router would otherwise redirect `/games`, `/quiz`, `/discover`, … to `/welcome`.
 */
export async function seedMockActiveExplorerProfile(page: Page): Promise<void> {
  await gotoLoaded(page, '/')
  await page.evaluate(() => {
    const profileId = 'e2e-scene-layout-profile'
    const now = new Date().toISOString()
    const profile = {
      profileId,
      displayNickname: 'Explorer',
      animalId: 'malayan-tiger',
      animalVisualKey: 'malayan-tiger',
      leafPoints: 12,
      level: 1,
      levelTitle: 'Nature Newbie',
      createdAt: now,
      lastActiveAt: now,
      guardianBackupLinked: false,
    }
    const wrap = (data: unknown) => JSON.stringify({ v: 1, data })
    localStorage.setItem('bw_profiles', wrap([profile]))
    localStorage.setItem('bw_active_session', wrap({ profileId, restoredAt: now }))
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
}

/** Choosing an existing explorer profile sometimes shows Continue on the welcome chooser first. */
export async function resumeSessionFromChooser(page: Page): Promise<void> {
  const card = page.getByRole('article', { name: /explorer:/i }).first()
  const btn = card.getByRole('button')
  try {
    await btn.waitFor({ state: 'visible', timeout: 20_000 })
  } catch {
    return // Already past chooser or session bypass
  }
  await btn.click()
  // Continue triggers async profile switch + router push; DOMContentLoaded can fire too early.
  await expect(page.locator('.home-page')).toBeVisible({ timeout: 20_000 })
}

export async function ensureSceneRoutesNotBlockedByWelcome(page: Page): Promise<void> {
  await seedMockActiveExplorerProfile(page)
  await resumeSessionFromChooser(page)
}
