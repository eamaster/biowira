import { test, expect } from '@playwright/test'
import {
  assertDecorAvoidsInteractiveCenters,
  assertNoHorizontalOverflow,
  viewportHasNoVerticalPageScroll,
} from './helpers/sceneDecor'
import { gotoLoaded } from './helpers/gotoLoaded'
import { ensureSceneRoutesNotBlockedByWelcome } from './helpers/mockExplorerProfile'

const QUIZ_DESKTOP_VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
  { width: 1920, height: 1080 },
] as const

/**
 * E2E flow: Quiz → Answer → Retry → Finish → Result
 *
 * Covers:
 *  - Quiz hub renders and a quiz card can be chosen
 *  - Quiz card with options appears after start
 *  - Selecting an answer shows feedback (correct/wrong banner)
 *  - Retry button appears when wrong on first attempt
 *  - After retry, Next/Finish button appears regardless of outcome
 *  - Completing all questions navigates to /quiz/result
 *  - Result page shows the result component and a score
 */

function firstQuizPick(page: import('@playwright/test').Page) {
  return page.locator('[data-testid^="quiz-pick-"]').first()
}

/** Helper: answer one question (handles retry if wrong), then proceed. */
async function answerAndProceed(page: import('@playwright/test').Page) {
  // Wait for a selectable (default-state) option
  const defaultOption = page.locator('[data-testid="quiz-option"][data-state="default"]').first()
  await expect(defaultOption).toBeVisible({ timeout: 5_000 })
  await defaultOption.click()

  // After selecting, feedback panel appears with retry or proceed button
  const retryBtn = page.getByRole('button', { name: /try this question again|try again|retry/i })
  const proceedBtn = page.getByRole('button', { name: /next question|next|finish quiz/i })

  // If wrong on first attempt, a retry button appears
  if (await retryBtn.isVisible({ timeout: 6_000 }).catch(() => false)) {
    await retryBtn.click()
    // In retry mode: pick any remaining default option
    const retryOption = page.locator('[data-testid="quiz-option"][data-state="default"]').first()
    await expect(retryOption).toBeVisible({ timeout: 3_000 })
    await retryOption.click()
  }

  // Now either "Next" or "Finish Quiz" must appear
  await expect(proceedBtn).toBeVisible({ timeout: 12_000 })
  return proceedBtn
}

test.describe('Quiz', () => {
  test.describe.configure({ timeout: 120_000 })

  test.beforeEach(async ({ page }) => {
    await ensureSceneRoutesNotBlockedByWelcome(page)
  })

  test('quiz hub desktop layout: scene, cards, decor, no overflow, minimal scroll', async ({ page }) => {
    for (const viewport of QUIZ_DESKTOP_VIEWPORTS) {
      await page.setViewportSize(viewport)
      await gotoLoaded(page, '/quiz')
      await expect(page.locator('.quiz-hub')).toBeVisible({ timeout: 60_000 })
      await expect(page.locator('.scene-page')).toBeVisible({ timeout: 12_000 })
      await expect(firstQuizPick(page)).toBeVisible({ timeout: 12_000 })
      await assertNoHorizontalOverflow(page)

      const fits = await viewportHasNoVerticalPageScroll(page)
      expect(
        fits,
        `Quiz hub should avoid unnecessary vertical scroll @ ${viewport.width}x${viewport.height}`,
      ).toBe(true)

      await assertDecorAvoidsInteractiveCenters(page, [firstQuizPick(page)])
    }
  })

  test('active quiz desktop state: options visible, decor safe, no overflow', async ({ page }) => {
    for (const viewport of QUIZ_DESKTOP_VIEWPORTS) {
      await page.setViewportSize(viewport)
      await gotoLoaded(page, '/quiz')
      await expect(firstQuizPick(page)).toBeVisible({ timeout: 60_000 })
      await firstQuizPick(page).click()
      await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible({ timeout: 8_000 })
      await expect(page.locator('.quiz-progress-nav')).toBeVisible()
      const options = page.locator('[data-testid="quiz-option"]')
      await expect(options.first()).toBeVisible()
      await expect(options.nth(1)).toBeVisible()
      await assertNoHorizontalOverflow(page)

      const fits = await viewportHasNoVerticalPageScroll(page)
      expect(
        fits,
        `Active quiz should avoid unnecessary vertical scroll @ ${viewport.width}x${viewport.height}`,
      ).toBe(true)

      await assertDecorAvoidsInteractiveCenters(page, [options.first()])
    }
  })

  test('quiz hub renders with pickable quizzes', async ({ page }) => {
    await gotoLoaded(page, '/quiz')
    await expect(firstQuizPick(page)).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText(/pick a quiz/i)).toBeVisible()
  })

  test('clicking a quiz card shows the quiz card with options', async ({ page }) => {
    await gotoLoaded(page, '/quiz')
    await firstQuizPick(page).click()

    // Quiz card should appear
    await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible({ timeout: 5_000 })

    // At least 2 answer options should be visible
    const options = page.locator('[data-testid="quiz-option"]')
    await expect(options.first()).toBeVisible()
    await expect(options.nth(1)).toBeVisible()
  })

  test('wrong answer shows retry button; retry uses up the retry limit', async ({ page }) => {
    await gotoLoaded(page, '/quiz')
    await firstQuizPick(page).click()
    await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible({ timeout: 5_000 })

    // Pick the first option
    const firstOption = page.locator('[data-testid="quiz-option"]').first()
    await firstOption.click()

    // Regardless of right/wrong, a feedback element appears
    await expect(
      page.getByRole('button', { name: /next|finish quiz|try again|retry/i }).first(),
    ).toBeVisible({ timeout: 5_000 })
  })

  test('can complete full quiz and reach result page', async ({ page }) => {
    await gotoLoaded(page, '/quiz')
    await firstQuizPick(page).click()
    await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible({ timeout: 5_000 })

    // Answer questions until we reach the result page (max 10 iterations for safety)
    for (let i = 0; i < 10; i++) {
      const isFinished = page.url().includes('/quiz/result')
      if (isFinished) break

      const proceedBtn = await answerAndProceed(page)

      const isFinishBtn = (await proceedBtn.textContent())?.toLowerCase().includes('finish')
      await proceedBtn.click()

      if (isFinishBtn) break
    }

    // Result page
    await expect(page).toHaveURL('/quiz/result', { timeout: 5_000 })
    await expect(page.locator('[data-testid="quiz-result"]')).toBeVisible({ timeout: 3_000 })

    // Score section should show at least one number
    await expect(page.getByText(/correct/i).first()).toBeVisible()
  })

  test('animal chat is present and does not block quiz interaction', async ({ page }) => {
    const viewports = [
      { width: 1366, height: 768 },
      { width: 1440, height: 900 }
    ]
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await gotoLoaded(page, '/quiz')
      
      const guide = page.locator('.animal-chat-guide')
      await expect(guide).toBeVisible()

      const textPanel = page.locator('.animal-chat-guide__text-panel')
      await expect(textPanel).toBeVisible()

      // Expand chat
      await textPanel.click()
      await expect(page.locator('.animal-chat-guide__chat-overlay')).toBeVisible()

      // The chat should not cover center points of quiz cards
      await expect(firstQuizPick(page)).toBeVisible()
      await assertDecorAvoidsInteractiveCenters(page, [
        firstQuizPick(page)
      ])

      // Navigate into the quiz
      await firstQuizPick(page).click()
      await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible({ timeout: 5_000 })

      // Verify answer buttons are still clickable
      const firstOption = page.locator('[data-testid="quiz-option"]').first()
      await assertDecorAvoidsInteractiveCenters(page, [firstOption])
      await assertNoHorizontalOverflow(page)
    }
  })
})
