import { test, expect } from '@playwright/test'

/**
 * Persist a mock active profile in localStorage (storageService envelope v1), then
 * reload so bootstrap can resolve `/` to Home instead of Welcome.
 */
async function seedMockActiveProfile(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(() => {
    const profileId = 'e2e-home-discover-profile'
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

/** Profile may still show chooser once — activate with Continue when needed. */
async function resumeSessionFromChooser(page: import('@playwright/test').Page) {
  const continueBtn = page.getByRole('button', { name: /continue/i }).first()
  if (await continueBtn.isVisible({ timeout: 3_500 }).catch(() => false)) {
    await continueBtn.click()
    await page.waitForLoadState('domcontentloaded')
  }
}

/**
 * E2E flow: Home → Discover → Animal profile (list + detail views).
 *
 * Works whether Playwright spawned the mock dev server or a local reused server:
 * resumes an existing explorer profile from the Welcome chooser when needed.
 */

test.describe('Home → Discover', () => {
  test.beforeEach(async ({ page }) => {
    await seedMockActiveProfile(page)
  })

  test('home page renders title and all five feature cards', async ({ page }) => {
    await page.goto('/')
    await resumeSessionFromChooser(page)
    await expect(page).toHaveTitle(/BioWira/)

    const discover = page.locator('[data-testid="home-feature-card-discover"]')
    await expect(discover).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid="home-feature-card-comics"]')).toBeVisible()
    await expect(page.locator('[data-testid="home-feature-card-quiz"]')).toBeVisible()
    await expect(page.locator('[data-testid="home-feature-card-missions"]')).toBeVisible()
    await expect(page.locator('[data-testid="home-feature-card-rescue"]')).toBeVisible()
  })

  test('rescue card navigates to /games/explorer-rescue-run', async ({ page }) => {
    await page.goto('/')
    await resumeSessionFromChooser(page)
    await page.locator('[data-testid="home-feature-card-rescue"]').click()
    await expect(page).toHaveURL(/\/games\/explorer-rescue-run/)
  })

  test('navigate home → discover → open animal profile → back to list', async ({ page }) => {
    await page.goto('/')
    await resumeSessionFromChooser(page)
    await page.locator('[data-testid="home-feature-card-discover"]').click()
    await expect(page).toHaveURL('/discover')

    const tigerRow = page.locator('[data-testid="animal-list-card"]').filter({ hasText: 'Malayan Tiger' }).first()
    await expect(tigerRow).toBeVisible({ timeout: 15_000 })
    await tigerRow.click()

    await expect(page.locator('[data-testid="animal-profile-wildlife"]')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /Back to List/i }).click()
    await expect(tigerRow).toBeVisible({ timeout: 10_000 })
  })

  test('discover list cards use spirit icons for Malayan Tiger (not wildlife hero URL)', async ({ page }) => {
    await page.goto('/discover')
    await resumeSessionFromChooser(page)
    await page.goto('/discover')
    await expect(page).toHaveURL(/\/discover$/)

    const row = page.locator('[data-testid="animal-list-card"]').filter({ hasText: 'Malayan Tiger' }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })
    const icon = row.locator('.discover-animal-icon').first()
    await expect(icon).toBeVisible()
    const src = await icon.getAttribute('src')
    expect(src ?? '').not.toContain('wildlife-0')
  })

  test('discover animal detail shows cited wildlife image, attribution, Common Name, and spirit badge', async ({
    page,
  }) => {
    await page.goto('/discover')
    await resumeSessionFromChooser(page)
    await page.goto('/discover')

    await page.locator('[data-testid="animal-list-card"]').filter({ hasText: 'Malayan Tiger' }).first().click()

    await expect(page.locator('[data-testid="animal-profile-wildlife"]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid="animal-profile-wildlife"] img')).toHaveAttribute('src', /wildlife-0/)

    await expect(page.getByText('PhotoMaster99')).toBeVisible()
    await expect(page.getByText(/CC BY-SA 4\.0/)).toBeVisible()
    await expect(page.getByText('Common Name:')).toBeVisible()
    await expect(page.locator('.profile__spirit-badge')).toBeVisible()
  })
})
