import { test, expect } from '@playwright/test'
import {
  assertDecorAvoidsInteractiveCenters,
  assertNoHorizontalOverflow,
  COMMON_DESKTOP_SCENE_VIEWPORTS,
  viewportHasNoVerticalPageScroll,
} from './helpers/sceneDecor'
import { gotoLoaded } from './helpers/gotoLoaded'
import { ensureSceneRoutesNotBlockedByWelcome } from './helpers/mockExplorerProfile'

test.describe('Games menu visual cards', () => {
  test.describe.configure({ timeout: 120_000 })

  test.beforeEach(async ({ page }) => {
    await ensureSceneRoutesNotBlockedByWelcome(page)
  })

  test('Games page shows missions, rescue, and eco-comics menu cards', async ({ page }) => {
    await gotoLoaded(page, '/games')

    await expect(page.locator('.games-page__cards')).toBeVisible({ timeout: 60_000 })
    await expect(page.locator('.scene-page')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('.pixel-page-ribbon')).toHaveCount(0)

    const missions = page.locator('[data-testid="games-menu-card-missions"]')
    const rescue = page.locator('[data-testid="games-menu-card-rescue"]')
    const comics = page.locator('[data-testid="games-menu-card-comics"]')

    await expect(missions).toBeVisible()
    await expect(rescue).toBeVisible()
    await expect(comics).toBeVisible()

    await expect(page.locator('[data-testid="games-menu-card-quiz"]')).toHaveCount(0)

    await expect(missions.locator('.hfc__btn')).toBeVisible()
    await expect(rescue.locator('.hfc__btn')).toBeVisible()
    await expect(comics.locator('.hfc__btn')).toBeVisible()
  })

  test('Desktop scene layout: decorations, hub cards, buttons, viewport fit', async ({ page }) => {
    for (const viewport of COMMON_DESKTOP_SCENE_VIEWPORTS) {
      await page.setViewportSize(viewport)
      await gotoLoaded(page, '/games')
      await expect(page.locator('.games-page__cards')).toBeVisible({ timeout: 60_000 })
      await expect(page.locator('.scene-page')).toBeVisible({ timeout: 20_000 })
      await assertNoHorizontalOverflow(page)

      const fits = await viewportHasNoVerticalPageScroll(page)
      expect(fits, `Games hub should avoid unnecessary vertical scroll @ ${viewport.width}x${viewport.height}`).toBe(true)

      const missionsBtn = page.locator('[data-testid="games-menu-card-missions"] .hfc__btn')
      const rescueBtn = page.locator('[data-testid="games-menu-card-rescue"] .hfc__btn')
      const comicsBtn = page.locator('[data-testid="games-menu-card-comics"] .hfc__btn')

      await assertDecorAvoidsInteractiveCenters(page, [missionsBtn, rescueBtn, comicsBtn])
    }
  })

  test('Games page has no horizontal overflow on desktop, tablet, and mobile', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await gotoLoaded(page, '/games')
      await assertNoHorizontalOverflow(page)
    }
  })

  test('Explorer Rescue Run card navigates to chapter route', async ({ page }) => {
    await gotoLoaded(page, '/games')
    await expect(page.locator('.games-page__cards')).toBeVisible({ timeout: 60_000 })
    await page.locator('[data-testid="games-menu-card-rescue"]').click()
    await expect(page).toHaveURL(/\/games\/explorer-rescue-run$/)
  })

  test('animal chat is present and does not block games menu interaction', async ({ page }) => {
    const viewports = [
      { width: 1366, height: 768 },
      { width: 1440, height: 900 }
    ]
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await gotoLoaded(page, '/games')
      
      const guide = page.locator('.animal-chat-guide')
      await expect(guide).toBeVisible()

      const textPanel = page.locator('.animal-chat-guide__text-panel')
      await expect(textPanel).toBeVisible()

      // Expand chat
      await textPanel.click()
      await expect(page.locator('.animal-chat-guide__chat-overlay')).toBeVisible()

      const missionsBtn = page.locator('[data-testid="games-menu-card-missions"] .hfc__btn')
      const rescueBtn = page.locator('[data-testid="games-menu-card-rescue"] .hfc__btn')
      const comicsBtn = page.locator('[data-testid="games-menu-card-comics"] .hfc__btn')

      // The chat should not cover center points of game card buttons
      await assertDecorAvoidsInteractiveCenters(page, [
        missionsBtn,
        rescueBtn,
        comicsBtn
      ])
      await assertNoHorizontalOverflow(page)
    }
  })
})
