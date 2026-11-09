import { test, expect } from '@playwright/test'
import { assertDecorAvoidsInteractiveCenters, assertNoHorizontalOverflow } from './helpers/sceneDecor'
import { gotoLoaded } from './helpers/gotoLoaded'
import { ensureSceneRoutesNotBlockedByWelcome } from './helpers/mockExplorerProfile'

test.describe('Discover detail layout and chat placement', () => {
  test.describe.configure({ timeout: 120_000 })

  test.beforeEach(async ({ page }) => {
    await ensureSceneRoutesNotBlockedByWelcome(page)
  })

  test('detail view layout and mascot chat interaction', async ({ page }) => {
    // Desktop viewport
    await page.setViewportSize({ width: 1366, height: 768 })
    
    // Open Discover page
    await gotoLoaded(page, '/discover')

    // Click the first animal card to open the detail view
    const firstCard = page.locator('[data-testid="animal-list-card"]').first()
    await expect(firstCard).toBeVisible({ timeout: 25_000 })
    await firstCard.click()

    // Wait for the detail view to be visible
    await expect(page.locator('.profile')).toBeVisible({ timeout: 15_000 })

    // Verify Back to List is visible
    const backBtn = page.locator('.profile__back-btn')
    await expect(backBtn).toBeVisible()

    // Verify animal photo/name/status/scientific name
    const photoFrame = page.locator('.profile__photo-frame')
    await expect(photoFrame).toBeVisible()
    await expect(page.locator('.profile__name')).not.toBeEmpty()
    await expect(page.locator('.profile__sci')).not.toBeEmpty()
    await expect(page.locator('.profile__status-wrap')).toBeVisible()

    // Verify stats are visible
    const statsGrid = page.locator('.profile__stats-grid')
    await expect(statsGrid).toBeVisible()
    await expect(statsGrid.locator('.profile__stat')).toHaveCount(4) // Group, Habitat, Diet, Lifespan

    // Verify action buttons
    const sketchBtn = page.getByRole('button', { name: /Sketch/i })
    const mapBtn = page.getByRole('button', { name: /Map/i })
    const quizBtn = page.getByRole('button', { name: /Take Quiz/i })
    
    await expect(sketchBtn).toBeVisible()
    await expect(mapBtn).toBeVisible()
    await expect(quizBtn).toBeVisible()



    // Verify the mascot chat guide is safely placed and collapsed by default
    const chatGuide = page.locator('.animal-chat-guide')
    await expect(chatGuide).toBeVisible()
    const textPanel = chatGuide.locator('.animal-chat-guide__text-panel')
    await expect(textPanel).toBeVisible()
    await expect(textPanel).toHaveClass(/animal-chat-guide__text-panel--interactive/) // Collapsed

    // Click mascot/bubble to expand chat
    await textPanel.click()
    const chatOverlay = page.locator('.animal-chat-guide__chat-overlay')
    await expect(chatOverlay).toBeVisible()

    // Verify no horizontal overflow
    await assertNoHorizontalOverflow(page)

    // Verify expanded chat does not cover critical elements
    await assertDecorAvoidsInteractiveCenters(page, [
      backBtn,
      page.locator('.profile__photo-frame'),
      sketchBtn,
      mapBtn,
      quizBtn,
      statsGrid,
      page.locator('.profile__narration')
    ])
  })
})
