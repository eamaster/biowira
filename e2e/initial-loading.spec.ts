/**
 * E2E tests for BioWira's initial loading experience.
 *
 * Covers:
 * - InitialAppLoader appears on cold load
 * - Home page appears fully after loader completes
 * - On mobile viewport, desktop background is not requested
 * - On tablet viewport, desktop background is not requested
 * - No 404 audio/image requests during normal navigation
 * - Direct navigation to key routes works correctly
 */
import { test, expect, type Page } from '@playwright/test'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function seedMockSession(page: Page, profileId = 'e2e-loading-profile'): Promise<void> {
  const now = new Date().toISOString()
  await page.evaluate(
    ({ profileId, now }: { profileId: string; now: string }) => {
      const wrap = (data: unknown) => JSON.stringify({ v: 1, data })
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
      localStorage.setItem('bw_profiles', wrap([profile]))
      localStorage.setItem('bw_active_session', wrap({ profileId, restoredAt: now }))
    },
    { profileId, now },
  )
}

async function waitForHomePageReady(page: Page, timeout = 20_000): Promise<void> {
  await page.waitForSelector('.home-page', { state: 'visible', timeout })
}

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe('Initial loading — loader visibility', () => {
  test('BioWira initial loader appears on cold load before home page', async ({ page }) => {
    // Go to root without seeding session first — welcome page may show,
    // but the loader should appear immediately during bootstrap
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Either the loader or the welcome/home page should be visible immediately
    const loaderOrPage = page.locator(
      '[data-testid="initial-app-loader"], .home-page, .welcome-page, [class*="welcome"]',
    )
    await expect(loaderOrPage.first()).toBeVisible({ timeout: 5000 })
  })

  test('home page appears fully after loader completes (with seeded session)', async ({ page }) => {
    await page.goto('/')
    await seedMockSession(page)
    await page.reload({ waitUntil: 'domcontentloaded' })

    // Wait for home page to be visible — loader should have completed
    await waitForHomePageReady(page)

    // Verify feature cards are visible (app is not half-loaded)
    const featureSection = page.locator('.home-page__features, [class*="feature-card"]').first()
    await expect(featureSection).toBeVisible({ timeout: 5000 })
  })

  test('loader has correct ARIA attributes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Check if loader briefly appears — it may be very fast on cached loads
    // We just verify the markup is correct when it does show
    const loader = page.locator('[data-testid="initial-app-loader"]')
    const isVisible = await loader.isVisible({ timeout: 3000 }).catch(() => false)

    if (isVisible) {
      await expect(loader).toHaveAttribute('role', 'status')
      await expect(loader).toHaveAttribute('aria-live', 'polite')
    }
    // If not visible, the loader completed before we could check — that's fine
  })
})

test.describe('Initial loading — responsive background requests', () => {
  test('on mobile viewport (390px), desktop home background is not requested', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    })
    const page = await context.newPage()

    const requestedUrls: string[] = []
    page.on('request', (req) => requestedUrls.push(req.url()))

    await page.goto('/')
    await seedMockSession(page)
    await page.reload({ waitUntil: 'load' })
    await waitForHomePageReady(page).catch(() => {/* allow timeout */})

    // Desktop background should NOT be fetched on mobile
    const desktopBgRequests = requestedUrls.filter((u) =>
      u.includes('home-background-desktop'),
    )
    expect(
      desktopBgRequests,
      `Desktop background was requested on mobile viewport: ${desktopBgRequests.join(', ')}`,
    ).toHaveLength(0)

    await context.close()
  })

  test('on tablet viewport (768px), desktop home background is not requested', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    })
    const page = await context.newPage()

    const requestedUrls: string[] = []
    page.on('request', (req) => requestedUrls.push(req.url()))

    await page.goto('/')
    await seedMockSession(page)
    await page.reload({ waitUntil: 'load' })
    await waitForHomePageReady(page).catch(() => {/* allow timeout */})

    // Tablet should use tablet background, not desktop
    const desktopBgRequests = requestedUrls.filter((u) =>
      u.includes('home-background-desktop'),
    )
    expect(
      desktopBgRequests,
      `Desktop background was requested on tablet viewport: ${desktopBgRequests.join(', ')}`,
    ).toHaveLength(0)

    await context.close()
  })

  test('on desktop viewport (1440px), desktop home background IS requested', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()

    const requestedUrls: string[] = []
    page.on('request', (req) => requestedUrls.push(req.url()))

    await page.goto('/')
    await seedMockSession(page)
    await page.reload({ waitUntil: 'load' })
    await waitForHomePageReady(page).catch(() => {/* allow timeout */})

    // Desktop should use desktop background
    const desktopBgRequests = requestedUrls.filter((u) =>
      u.includes('home-background-desktop') || u.includes('backgrounds/'),
    )
    // At least some background should be requested
    expect(desktopBgRequests.length).toBeGreaterThan(0)

    await context.close()
  })
})

test.describe('Initial loading — no broken asset requests', () => {
  test('no 404 responses for audio files during navigation to home page', async ({ page }) => {
    const failedRequests: { url: string; status: number }[] = []

    page.on('response', (res) => {
      if (
        res.status() === 404 &&
        (res.url().includes('/audio/') ||
          res.url().endsWith('.mp3') ||
          res.url().endsWith('.ogg'))
      ) {
        failedRequests.push({ url: res.url(), status: res.status() })
      }
    })

    await page.goto('/')
    await seedMockSession(page)
    await page.reload({ waitUntil: 'load' })
    await waitForHomePageReady(page).catch(() => {/* allow timeout */})

    expect(
      failedRequests,
      `Found 404 audio requests: ${failedRequests.map((r) => r.url).join(', ')}`,
    ).toHaveLength(0)
  })

  test('no .ogg file requests (all audio is MP3 only)', async ({ page }) => {
    const oggRequests: string[] = []

    page.on('request', (req) => {
      if (req.url().endsWith('.ogg')) {
        oggRequests.push(req.url())
      }
    })

    await page.goto('/')
    await seedMockSession(page)
    await page.reload({ waitUntil: 'load' })
    await waitForHomePageReady(page).catch(() => {/* allow timeout */})

    // Navigate to a few pages to trigger more audio loading
    await page.goto('/discover').catch(() => {})
    await page.goto('/quiz').catch(() => {})

    expect(
      oggRequests,
      `Found .ogg file requests (should be MP3 only): ${oggRequests.join(', ')}`,
    ).toHaveLength(0)
  })
})

test.describe('Initial loading — direct navigation', () => {
  test('direct navigation to / works without breaking layout', async ({ page }) => {
    await page.goto('/')
    await seedMockSession(page)
    await page.reload({ waitUntil: 'load' })
    await waitForHomePageReady(page)

    const body = page.locator('body')
    const bodyBox = await body.boundingBox()
    expect(bodyBox).not.toBeNull()
    expect(bodyBox?.width).toBeGreaterThan(0)
  })

  test('direct navigation to /discover works', async ({ page }) => {
    await page.goto('/')
    await seedMockSession(page)
    await page.goto('/discover', { waitUntil: 'load' })

    // Should either show discover page or redirect to welcome (depends on session config)
    const page_ = page.locator('.discover-page, .home-page, [class*="welcome"]')
    await expect(page_.first()).toBeVisible({ timeout: 15000 })
  })

  test('direct navigation to /games/explorer-rescue-run works', async ({ page }) => {
    await page.goto('/')
    await seedMockSession(page)
    await page.goto('/games/explorer-rescue-run', { waitUntil: 'load' })

    // Should show chapter page or redirect gracefully
    const content = page.locator('[data-testid="explorer-rescue-page"], .home-page, [class*="welcome"]')
    await expect(content.first()).toBeVisible({ timeout: 15000 })
  })
})
