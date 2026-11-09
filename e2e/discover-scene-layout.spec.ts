import { test, expect } from '@playwright/test'
import type { Locator } from '@playwright/test'
import {
  assertDecorAvoidsInteractiveCenters,
  assertNoHorizontalOverflow,
  COMMON_DESKTOP_SCENE_VIEWPORTS,
} from './helpers/sceneDecor'
import { gotoLoaded } from './helpers/gotoLoaded'
import { ensureSceneRoutesNotBlockedByWelcome } from './helpers/mockExplorerProfile'

test.describe('Discover scene layout', () => {
  test.describe.configure({ timeout: 120_000 })

  test.beforeEach(async ({ page }) => {
    await ensureSceneRoutesNotBlockedByWelcome(page)
  })

  for (const viewport of COMMON_DESKTOP_SCENE_VIEWPORTS) {
    test(`list view @ ${viewport.width}x${viewport.height}: scene, filters, cards, decor`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await gotoLoaded(page, '/discover')
      await expect(page.locator('.discover-filter-bar')).toBeVisible({ timeout: 60_000 })
      await expect(page.locator('.scene-page')).toBeVisible({ timeout: 25_000 })

      await expect(page.getByRole('tab', { name: /^all$/i }).first()).toBeVisible({
        timeout: 15_000,
      })
      await expect(page.getByRole('tab', { name: /^mammals$/i }).first()).toBeVisible()

      const firstCard = page.locator('[data-testid="animal-list-card"]').first()
      await expect(firstCard).toBeVisible({ timeout: 15_000 })

      const pagination = page.locator('.pagination')
      const paginationFirstNum = pagination.locator('.pagination__btn').filter({ hasText: /^[0-9]+$/ }).first()

      await assertNoHorizontalOverflow(page)

      const probes: Locator[] = [
        firstCard,
        page.getByRole('tab', { name: /^birds$/i }).first(),
      ]

      if ((await pagination.count()) > 0) {
        await expect(paginationFirstNum).toBeVisible()
        probes.push(paginationFirstNum)
      }

      await assertDecorAvoidsInteractiveCenters(page, probes)
    })
  }

  test('animal chat is present and does not block interaction', async ({ page }) => {
    // test 1366x768 and 1440x900 as minimum
    const viewports = [
      { width: 1366, height: 768 },
      { width: 1440, height: 900 }
    ]
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await gotoLoaded(page, '/discover')
      
      const guide = page.locator('.animal-chat-guide')
      await expect(guide).toBeVisible()

      // Should be in interactive (collapsed) state
      const textPanel = page.locator('.animal-chat-guide__text-panel')
      await expect(textPanel).toBeVisible()
      await expect(textPanel).toHaveClass(/animal-chat-guide__text-panel--interactive/)

      // Click to open chat
      await textPanel.click()
      await expect(page.locator('.animal-chat-guide__chat-overlay')).toBeVisible()

      // Verify no horizontal overflow
      await assertNoHorizontalOverflow(page)

      const firstCard = page.locator('[data-testid="animal-list-card"]').first()
      const allTab = page.getByRole('tab', { name: /^all$/i }).first()

      // The chat should not cover center points of these critical interactive elements
      await assertDecorAvoidsInteractiveCenters(page, [
        firstCard,
        allTab
      ])
    }
  })
})
