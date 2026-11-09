import { test, expect } from '@playwright/test'
import { assertNoHorizontalOverflow } from './helpers/sceneDecor'
import { gotoLoaded } from './helpers/gotoLoaded'
import { ensureSceneRoutesNotBlockedByWelcome, seedMockActiveExplorerProfile } from './helpers/mockExplorerProfile'

// ── Games Menu journal CTA ─────────────────────────────────────────────────────

test.describe('Games Menu — Journal Book CTA', () => {
  test.describe.configure({ timeout: 120_000 })

  test.beforeEach(async ({ page }) => {
    await ensureSceneRoutesNotBlockedByWelcome(page)
  })

  test('Open Journal Book button/card is visible on Games page', async ({ page }) => {
    await gotoLoaded(page, '/games')
    await expect(page.locator('.games-page__cards')).toBeVisible({ timeout: 60_000 })

    const journalCta = page.locator('[data-testid="games-journal-cta"]')
    await expect(journalCta).toBeVisible()

    const openBtn = page.locator('[data-testid="games-open-journal-btn"]')
    await expect(openBtn).toBeVisible()
    await expect(openBtn).toContainText('Open Journal Book')
  })

  test('Clicking Open Journal Book opens Journal Game Histories menu', async ({ page }) => {
    await gotoLoaded(page, '/games')
    await expect(page.locator('.games-page__cards')).toBeVisible({ timeout: 60_000 })

    await page.locator('[data-testid="games-open-journal-btn"]').click()
    await expect(page).toHaveURL(/\/games\/journal$/, { timeout: 20_000 })

    await expect(page.locator('[data-testid="journal-menu-page"]')).toBeVisible({ timeout: 20_000 })
  })

  test('Games page still shows 3 game cards after journal CTA addition', async ({ page }) => {
    await gotoLoaded(page, '/games')
    await expect(page.locator('.games-page__cards')).toBeVisible({ timeout: 60_000 })

    await expect(page.locator('[data-testid="games-menu-card-missions"]')).toBeVisible()
    await expect(page.locator('[data-testid="games-menu-card-rescue"]')).toBeVisible()
    await expect(page.locator('[data-testid="games-menu-card-comics"]')).toBeVisible()

    // Ensure the journal CTA is NOT counted as a game card
    const gamecards = page.locator('[data-testid^="games-menu-card-"]')
    await expect(gamecards).toHaveCount(3)
  })
})

// ── Empty histories notification ──────────────────────────────────────────────

test.describe('Journal — Empty histories notification', () => {
  test.describe.configure({ timeout: 120_000 })

  test.beforeEach(async ({ page }) => {
    await ensureSceneRoutesNotBlockedByWelcome(page)
  })

  test('Clicking empty category shows exact notification message', async ({ page }) => {
    await gotoLoaded(page, '/games/journal')
    await expect(page.locator('[data-testid="journal-menu-page"]')).toBeVisible({ timeout: 30_000 })

    // Click an empty category (no records in fresh state)
    await page.locator('[data-testid="journal-category-card-nature-mission"]').click()
    await expect(page.locator('[data-testid="journal-empty-notice"]')).toBeVisible({ timeout: 10_000 })

    const msg = page.locator('[data-testid="journal-empty-message"]')
    await expect(msg).toHaveText('Please complete a game to unlock the stamps!')
  })

  test('Play Games button in empty notice redirects to /games', async ({ page }) => {
    await gotoLoaded(page, '/games/journal')
    await expect(page.locator('[data-testid="journal-menu-page"]')).toBeVisible({ timeout: 30_000 })

    await page.locator('[data-testid="journal-category-card-eco-comic"]').click()
    await page.locator('[data-testid="journal-play-games-btn"]').click()

    await expect(page).toHaveURL(/\/games$/, { timeout: 10_000 })
  })
})

// ── Eco-Comics library ────────────────────────────────────────────────────────

test.describe('Eco-Comics library', () => {
  test.describe.configure({ timeout: 120_000 })

  test.beforeEach(async ({ page }) => {
    await ensureSceneRoutesNotBlockedByWelcome(page)
  })

  test('/games/eco-comics shows library with available story', async ({ page }) => {
    await gotoLoaded(page, '/games/eco-comics')
    await expect(page.locator('[data-testid="eco-comics-library-page"]')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('[data-testid="eco-comics-book-secret-wooden-crate"]')).toBeVisible()
  })

  test('Available story cover image is rendered and not broken', async ({ page }) => {
    await gotoLoaded(page, '/games/eco-comics')
    await expect(page.locator('[data-testid="eco-comics-library-page"]')).toBeVisible({ timeout: 30_000 })

    const coverImg = page.locator('[data-testid="eco-comics-book-secret-wooden-crate"] img.eco-lib__cover-img')
    await expect(coverImg).toBeVisible()
    // Image should have loaded from /games/eco-comics path (not BIOWIRA_UI_REFERENCES)
    const src = await coverImg.getAttribute('src')
    expect(src).toContain('/games/eco-comics/menu/')
    expect(src).not.toContain('BIOWIRA_UI_REFERENCES')
    // Check natural dimensions to verify image is not broken (loaded)
    const naturalWidth = await coverImg.evaluate((img: HTMLImageElement) => img.naturalWidth)
    expect(naturalWidth).toBeGreaterThan(0)
  })

  test('Coming-soon books are visible and locked', async ({ page }) => {
    await gotoLoaded(page, '/games/eco-comics')
    await expect(page.locator('[data-testid="eco-comics-library-page"]')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('[data-testid="eco-comics-coming-soon-1"]')).toBeVisible()
    await expect(page.locator('[data-testid="eco-comics-coming-soon-2"]')).toBeVisible()
  })

  test('Back to Games button is inside the panel and navigates', async ({ page }) => {
    await gotoLoaded(page, '/games/eco-comics')
    await expect(page.locator('[data-testid="eco-comics-library-page"]')).toBeVisible({ timeout: 30_000 })
    const backBtn = page.locator('[data-testid="eco-comics-back-btn"]')
    await expect(backBtn).toBeVisible()
    await backBtn.click()
    await expect(page).toHaveURL(/\/games$/, { timeout: 10_000 })
  })

  test('Available story opens reader on click', async ({ page }) => {
    await gotoLoaded(page, '/games/eco-comics')
    await expect(page.locator('[data-testid="eco-comics-book-secret-wooden-crate"]')).toBeVisible({ timeout: 30_000 })
    await page.locator('[data-testid="eco-comics-book-secret-wooden-crate"]').click()
    await expect(page).toHaveURL(/\/games\/eco-comics\/story\/secret-wooden-crate/, { timeout: 10_000 })
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 10_000 })
  })

  test('No horizontal overflow on Eco-Comics library at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoLoaded(page, '/games/eco-comics')
    await expect(page.locator('[data-testid="eco-comics-library-page"]')).toBeVisible({ timeout: 30_000 })
    await assertNoHorizontalOverflow(page)
  })

  test('No horizontal overflow on library at 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await gotoLoaded(page, '/games/eco-comics')
    await expect(page.locator('[data-testid="eco-comics-library-page"]')).toBeVisible({ timeout: 30_000 })
    await assertNoHorizontalOverflow(page)
  })
})

// ── Eco-Comic reader ──────────────────────────────────────────────────────────

test.describe('Eco-Comic reader', () => {
  test.describe.configure({ timeout: 120_000 })

  test.beforeEach(async ({ page }) => {
    await ensureSceneRoutesNotBlockedByWelcome(page)
  })

  test('Reader shows START button on opening panel (not NEXT/BACK)', async ({ page }) => {
    await gotoLoaded(page, '/games/eco-comics/story/secret-wooden-crate')
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })

    await expect(page.locator('[data-testid="eco-comic-start-btn"]')).toBeVisible()
    await expect(page.locator('[data-testid="eco-comic-back-btn"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="eco-comic-next-btn"]')).toHaveCount(0)
  })

  test('Opening scene image is visible and not broken', async ({ page }) => {
    await gotoLoaded(page, '/games/eco-comics/story/secret-wooden-crate')
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })

    const img = page.locator('.reader__scene-img')
    await expect(img).toBeVisible()
    const src = await img.getAttribute('src')
    expect(src).toContain('/games/eco-comics/secret-wooden-crate/initial/opening.webp')
    const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth)
    expect(naturalWidth).toBeGreaterThan(0)
  })

  test('Narration/speaker button is visible on opening panel', async ({ page }) => {
    await gotoLoaded(page, '/games/eco-comics/story/secret-wooden-crate')
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })

    await expect(page.locator('[data-testid="eco-comic-narration-btn"]')).toBeVisible()
  })

  test('Clicking narration button triggers TTS request (intercepted)', async ({ page }) => {
    // Intercept the TTS endpoint and return a mock response
    await page.route('**/api/v1/tts/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          textHash: 'mock-hash-123',
          voiceId: 'mock-voice',
          modelId: 'mock-model',
          speed: 1,
          mimeType: 'audio/mpeg',
          cached: true,
          audioUrl: '/api/v1/tts/audio/mock-hash-123',
          timings: [],
        }),
      })
    })
    // Also intercept the audio file fetch to avoid actual audio
    await page.route('**/api/v1/tts/audio/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'audio/mpeg', body: '' })
    })

    await gotoLoaded(page, '/games/eco-comics/story/secret-wooden-crate')
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })

    // Verify no TTS request fired before clicking
    let ttsRequestFired = false
    page.on('request', (req) => {
      if (req.url().includes('/tts/generate')) ttsRequestFired = true
    })

    // Click narration button
    const narrationBtn = page.locator('[data-testid="eco-comic-narration-btn"]')
    await expect(narrationBtn).toBeVisible()
    await narrationBtn.click()

    // Give time for async fetch
    await page.waitForTimeout(1000)
    expect(ttsRequestFired).toBe(true)
  })

  test('START advances to scene 1 which shows a real image', async ({ page }) => {
    await gotoLoaded(page, '/games/eco-comics/story/secret-wooden-crate')
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })

    await page.locator('[data-testid="eco-comic-start-btn"]').click()
    await page.waitForTimeout(300)

    // Should now be on scene_1
    await expect(page.locator('[data-testid="eco-comic-next-btn"]')).toBeVisible()
    // BACK button should now exist (history: [opening])
    await expect(page.locator('[data-testid="eco-comic-back-btn"]')).toBeVisible()

    const img = page.locator('.reader__scene-img')
    const src = await img.getAttribute('src')
    expect(src).toContain('scene-01.webp')
  })

  test('BACK from scene 1 returns to opening (not library)', async ({ page }) => {
    await gotoLoaded(page, '/games/eco-comics/story/secret-wooden-crate')
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })

    // Go to scene_1
    await page.locator('[data-testid="eco-comic-start-btn"]').click()
    await page.waitForTimeout(300)
    await expect(page.locator('[data-testid="eco-comic-back-btn"]')).toBeVisible()

    // Click BACK — should return to opening, not navigate away
    await page.locator('[data-testid="eco-comic-back-btn"]').click()
    await page.waitForTimeout(300)

    // Should be on opening panel (START button visible)
    await expect(page.locator('[data-testid="eco-comic-start-btn"]')).toBeVisible()
    // Still on the same page
    await expect(page).toHaveURL(/\/games\/eco-comics\/story\/secret-wooden-crate/)
  })

  test('Choice buttons appear on scene_8 and story progresses', async ({ page }) => {
    await gotoLoaded(page, '/games/eco-comics/story/secret-wooden-crate')
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })

    // Navigate opening → scene_1 → ... → scene_8
    for (let i = 0; i < 9; i++) {
      const startBtn = page.locator('[data-testid="eco-comic-start-btn"]')
      const nextBtn = page.locator('[data-testid="eco-comic-next-btn"]')
      if (await startBtn.isVisible()) await startBtn.click()
      else if (await nextBtn.isVisible()) await nextBtn.click()
      await page.waitForTimeout(150)
    }

    // Should see choice buttons
    await expect(page.locator('[data-testid^="eco-comic-choice-"]').first()).toBeVisible({ timeout: 5_000 })
  })

  test('Reader progresses through panels on NEXT click (regression)', async ({ page }) => {
    await gotoLoaded(page, '/games/eco-comics/story/secret-wooden-crate')
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })

    // Click START then NEXT a few times
    await page.locator('[data-testid="eco-comic-start-btn"]').click()
    await page.waitForTimeout(200)
    for (let i = 0; i < 3; i++) {
      const nextBtn = page.locator('[data-testid="eco-comic-next-btn"]')
      if (await nextBtn.isVisible()) {
        await nextBtn.click()
        await page.waitForTimeout(200)
      }
    }
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible()
  })

  test('No horizontal overflow on reader at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoLoaded(page, '/games/eco-comics/story/secret-wooden-crate')
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })
    await assertNoHorizontalOverflow(page)
  })

  test('No horizontal overflow on reader at 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await gotoLoaded(page, '/games/eco-comics/story/secret-wooden-crate')
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })
    await assertNoHorizontalOverflow(page)
  })

  test('No requests to BIOWIRA_UI_REFERENCES path', async ({ page }) => {
    const badRequests: string[] = []
    page.on('request', (req) => {
      if (req.url().toLowerCase().includes('biowira_ui_references')) {
        badRequests.push(req.url())
      }
    })
    await gotoLoaded(page, '/games/eco-comics/story/secret-wooden-crate')
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })
    expect(badRequests).toHaveLength(0)
  })
})

// ── Journal menu responsive ───────────────────────────────────────────────────

test.describe('Journal — Responsive layout', () => {
  test.describe.configure({ timeout: 120_000 })

  test.beforeEach(async ({ page }) => {
    await ensureSceneRoutesNotBlockedByWelcome(page)
  })

  test('Journal menu has no horizontal overflow on mobile (390px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoLoaded(page, '/games/journal')
    await expect(page.locator('[data-testid="journal-menu-page"]')).toBeVisible({ timeout: 30_000 })
    await assertNoHorizontalOverflow(page)
  })

  test('Journal menu has no horizontal overflow on tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await gotoLoaded(page, '/games/journal')
    await expect(page.locator('[data-testid="journal-menu-page"]')).toBeVisible({ timeout: 30_000 })
    await assertNoHorizontalOverflow(page)
  })

  test('Journal menu has no horizontal overflow on desktop (1366px)', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await gotoLoaded(page, '/games/journal')
    await expect(page.locator('[data-testid="journal-menu-page"]')).toBeVisible({ timeout: 30_000 })
    await assertNoHorizontalOverflow(page)
  })
})

// ── Journal stamp page with seeded records ────────────────────────────────────

test.describe('Journal — Stamp page navigation with seeded records', () => {
  test.describe.configure({ timeout: 120_000 })

  async function seedJournalRecords(page: import('@playwright/test').Page) {
    await page.evaluate(() => {
      const profileId = 'e2e-scene-layout-profile'
      const now = new Date().toISOString()

      const journalState = {
        profileId,
        records: [
          {
            id: 'rec-1',
            categoryId: 'eco-comic',
            sourceId: 'test-a',
            title: 'Story A',
            description: 'Ending A',
            completedAt: new Date(Date.now() - 1000).toISOString(),
            leafPointsEarned: 80,
            stampId: 'wildlife-secret-agent',
            stampTitle: 'Wildlife Secret Agent',
            stampDescription: 'Reported evidence safely.',
            restorationPercentAfter: 20,
            metadata: { storyId: 'secret-wooden-crate', endingId: 'photograph-and-report' },
          },
          {
            id: 'rec-2',
            categoryId: 'eco-comic',
            sourceId: 'test-b',
            title: 'Story B',
            description: 'Ending B',
            completedAt: now,
            leafPointsEarned: 50,
            stampId: 'family-team-hero',
            stampTitle: 'Family Team Hero',
            stampDescription: 'Saved pangolin with family.',
            restorationPercentAfter: 40,
            metadata: { storyId: 'secret-wooden-crate', endingId: 'call-a-parent' },
          },
        ],
        unlockedStampIds: ['wildlife-secret-agent', 'family-team-hero'],
        updatedAt: now,
      }

      const wrap = (data: unknown) => JSON.stringify({ v: 1, data })
      localStorage.setItem(`bw_game_journal_${profileId}`, wrap(journalState))
    })
  }

  test.beforeEach(async ({ page }) => {
    await ensureSceneRoutesNotBlockedByWelcome(page)
  })

  test('Stamp page shows arrow controls when multiple records seeded', async ({ page }) => {
    await seedJournalRecords(page)
    await gotoLoaded(page, '/games/journal/eco-comic')
    await expect(
      page.locator('[data-testid="journal-stamp-page-eco-comic"]'),
    ).toBeVisible({ timeout: 30_000 })

    // First page: no prev arrow, has next arrow
    await expect(page.locator('[data-testid="journal-prev-btn"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="journal-next-btn"]')).toBeVisible()

    // Flip to next page
    await page.locator('[data-testid="journal-next-btn"]').click()

    // Last page: has prev arrow, no next arrow
    await expect(page.locator('[data-testid="journal-prev-btn"]')).toBeVisible()
    await expect(page.locator('[data-testid="journal-next-btn"]')).toHaveCount(0)
  })

  test('Stamp page shows locked/unlocked stamps correctly per journal page', async ({ page }) => {
    await seedJournalRecords(page)
    await gotoLoaded(page, '/games/journal/eco-comic')
    await expect(
      page.locator('[data-testid="journal-stamp-page-eco-comic"]'),
    ).toBeVisible({ timeout: 30_000 })

    // Page 1 (oldest session): only wildlife-secret-agent from that completion
    const agentStamp = page.locator('[data-testid="journal-stamp-wildlife-secret-agent"]')
    await expect(agentStamp).toBeVisible()
    await expect(agentStamp).toHaveClass(/journal-stamp--unlocked/)

    const guardianStamp = page.locator('[data-testid="journal-stamp-pangolin-guardian"]')
    await expect(guardianStamp).toBeVisible()
    await expect(guardianStamp).toHaveClass(/journal-stamp--locked/)

    const heroStamp = page.locator('[data-testid="journal-stamp-family-team-hero"]')
    await expect(heroStamp).toHaveClass(/journal-stamp--locked/)

    await page.locator('[data-testid="journal-next-btn"]').click()

    // Page 2: cumulative wildlife + family-team-hero
    await expect(agentStamp).toHaveClass(/journal-stamp--unlocked/)
    await expect(heroStamp).toHaveClass(/journal-stamp--unlocked/)
    await expect(guardianStamp).toHaveClass(/journal-stamp--locked/)
  })
})
