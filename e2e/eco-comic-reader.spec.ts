/**
 * Eco-Comic Reader — Playwright E2E tests
 *
 * Tests the no-scroll layout, glass overlay placement, button accessibility,
 * and responsive behaviour on desktop, tablet, and mobile viewports.
 *
 * The dev server is started with VITE_SESSION_ENABLED=false (see playwright.config.ts),
 * so session guards do not block access to the reader route.
 */

import { test, expect } from '@playwright/test'
import {
  assertNoHorizontalOverflow,
  viewportHasNoVerticalPageScroll,
} from './helpers/sceneDecor'
import { gotoLoaded } from './helpers/gotoLoaded'
import { ensureSceneRoutesNotBlockedByWelcome } from './helpers/mockExplorerProfile'

const STORY_ROUTE = '/games/eco-comics/story/secret-wooden-crate'

/** Small tolerance for subpixel rounding and scrollbar width. */
const SCROLL_TOLERANCE_PX = 56

test.describe('Eco-Comic Reader — layout', () => {
  test.describe.configure({ timeout: 120_000 })

  test.beforeEach(async ({ page }) => {
    await ensureSceneRoutesNotBlockedByWelcome(page)
  })

  // ── Desktop 1366×768 ────────────────────────────────────────────────────────

  test.describe('Desktop 1366×768 — no vertical scroll', () => {
    test.use({ viewport: { width: 1366, height: 768 } })

    test('opening scene fits in viewport without vertical scroll', async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 })
      await gotoLoaded(page, STORY_ROUTE)

      await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({
        timeout: 30_000,
      })

      const fits = await viewportHasNoVerticalPageScroll(page, SCROLL_TOLERANCE_PX)
      expect(
        fits,
        'Opening eco-comic scene should not cause vertical scroll on 1366×768',
      ).toBe(true)
    })

    test('scene image is visible on opening', async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 })
      await gotoLoaded(page, STORY_ROUTE)

      await expect(page.locator('img.reader__scene-img')).toBeVisible({ timeout: 30_000 })
    })

    test('dialogue overlay is present over the scene image (not below it)', async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 })
      await gotoLoaded(page, STORY_ROUTE)

      const frame = page.locator('.reader__scene-frame')
      const overlay = page.locator('.reader__dialogue-overlay')

      await expect(frame).toBeVisible({ timeout: 30_000 })
      await expect(overlay).toBeVisible()

      const frameBox = await frame.boundingBox()
      const overlayBox = await overlay.boundingBox()

      expect(frameBox).not.toBeNull()
      expect(overlayBox).not.toBeNull()

      if (frameBox && overlayBox) {
        // Overlay should visually overlap the frame area on desktop
        // (overlay top should be at or below the frame top, and within frame bottom)
        expect(overlayBox.y).toBeGreaterThanOrEqual(frameBox.y - 2)
        expect(overlayBox.y + overlayBox.height).toBeLessThanOrEqual(
          frameBox.y + frameBox.height + SCROLL_TOLERANCE_PX,
        )

        // Verify overlay does not cover too much of the artwork (area ratio check)
        const frameArea = frameBox.width * frameBox.height
        const overlayArea = overlayBox.width * overlayBox.height
        const ratio = overlayArea / frameArea
        expect(ratio, `Overlay covers ${Math.round(ratio * 100)}% of the artwork, which is too much.`).toBeLessThan(0.5)
      }
    })

    test('START button is visible without scrolling', async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 })
      await gotoLoaded(page, STORY_ROUTE)

      const startBtn = page.locator('[data-testid="eco-comic-start-btn"]')
      await expect(startBtn).toBeVisible({ timeout: 30_000 })

      // Confirm it is within the visible viewport (no scroll needed)
      const box = await startBtn.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        expect(box.y + box.height).toBeLessThanOrEqual(768 + 4)
      }
    })

    test('clicking START shows scene_1 still within viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 })
      await gotoLoaded(page, STORY_ROUTE)

      await page.locator('[data-testid="eco-comic-start-btn"]').click()
      await page.waitForTimeout(400)

      await expect(page.locator('[data-testid="eco-comic-next-btn"]')).toBeVisible({
        timeout: 15_000,
      })

      const fits = await viewportHasNoVerticalPageScroll(page, SCROLL_TOLERANCE_PX)
      expect(fits, 'Scene 1 should not cause vertical scroll on 1366×768').toBe(true)
    })

    test('no horizontal overflow on 1366×768', async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 })
      await gotoLoaded(page, STORY_ROUTE)
      await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })
      await assertNoHorizontalOverflow(page)
    })
  })

  // ── Desktop 1440×900 ────────────────────────────────────────────────────────

  test.describe('Desktop 1440×900 — no vertical scroll', () => {
    test.use({ viewport: { width: 1440, height: 900 } })

    test('opening scene fits in viewport on 1440×900', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await gotoLoaded(page, STORY_ROUTE)
      await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })

      const fits = await viewportHasNoVerticalPageScroll(page, SCROLL_TOLERANCE_PX)
      expect(fits, 'Opening scene should not cause vertical scroll on 1440×900').toBe(true)
    })

    test('no horizontal overflow on 1440×900', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await gotoLoaded(page, STORY_ROUTE)
      await assertNoHorizontalOverflow(page)
    })
  })

  // ── Choice scene (scene_8) ─────────────────────────────────────────────────

  test('scene_8 choice buttons are visible without scrolling on 1366×768', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await gotoLoaded(page, STORY_ROUTE)

    // Navigate to scene_8: START + 7 NEXT clicks
    await page.locator('[data-testid="eco-comic-start-btn"]').click()
    for (let i = 0; i < 7; i++) {
      await expect(page.locator('[data-testid="eco-comic-next-btn"]')).toBeVisible({
        timeout: 10_000,
      })
      await page.locator('[data-testid="eco-comic-next-btn"]').click()
      await page.waitForTimeout(200)
    }

    // Choice buttons should be visible
    const choices = page.locator('[data-testid^="eco-comic-choice-"]')
    await expect(choices.first()).toBeVisible({ timeout: 10_000 })

    // No vertical scroll
    const fits = await viewportHasNoVerticalPageScroll(page, SCROLL_TOLERANCE_PX)
    expect(fits, 'Choice scene (scene_8) should not cause vertical scroll').toBe(true)
  })

  // ── No broken image requests ────────────────────────────────────────────────

  test('no failed network requests to scene images on opening', async ({ page }) => {
    const failedRequests: string[] = []

    page.on('requestfailed', (req) => {
      // Only track image requests (not font/API failures which are expected in mock mode)
      if (req.url().includes('/games/eco-comics/')) {
        failedRequests.push(req.url())
      }
    })

    await page.setViewportSize({ width: 1366, height: 768 })
    await gotoLoaded(page, STORY_ROUTE)
    await expect(page.locator('img.reader__scene-img')).toBeVisible({ timeout: 30_000 })

    // Allow time for preload network activity
    await page.waitForTimeout(1000)

    expect(
      failedRequests,
      `Unexpected failed eco-comic image requests: ${failedRequests.join(', ')}`,
    ).toHaveLength(0)
  })

  test('no requests to BIOWIRA_UI_REFERENCES paths', async ({ page }) => {
    const uiRefRequests: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('BIOWIRA_UI_REFERENCES')) {
        uiRefRequests.push(req.url())
      }
    })

    await gotoLoaded(page, STORY_ROUTE)
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })
    expect(uiRefRequests).toHaveLength(0)
  })

  test('no TTS (speech synthesis) request before narration button click', async ({ page }) => {
    let ttsRequested = false

    // Patch speechSynthesis.speak on the page
    await page.addInitScript(() => {
      Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: new Proxy(window.speechSynthesis ?? {}, {
          get(target, prop) {
            if (prop === 'speak') {
              return () => {
                ;(window as Record<string, unknown>).__ttsSpoken = true
              }
            }
            const v = (target as Record<string | symbol, unknown>)[prop]
            return typeof v === 'function' ? v.bind(target) : v
          },
        }),
      })
    })

    await gotoLoaded(page, STORY_ROUTE)
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })

    // Wait 1s to confirm no auto-play
    await page.waitForTimeout(1000)

    ttsRequested = await page.evaluate(() => !!(window as Record<string, unknown>).__ttsSpoken)
    expect(ttsRequested, 'TTS should not be triggered before narration button click').toBe(false)
  })

  test('no prepared narration mp3 is requested before the speaker button is clicked', async ({
    page,
  }) => {
    const narrationMp3: string[] = []
    page.on('request', (req) => {
      const u = req.url()
      if (u.includes('/games/eco-comics/secret-wooden-crate/narration/') && u.endsWith('.mp3')) {
        narrationMp3.push(u)
      }
    })

    await page.setViewportSize({ width: 1366, height: 768 })
    await gotoLoaded(page, STORY_ROUTE)
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })
    await page.waitForTimeout(1200)

    expect(
      narrationMp3,
      'Eco-Comic should not fetch narration audio until the user taps the speaker',
    ).toHaveLength(0)
  })

  test('clicking narration on opening requests opening.mp3 (prepared voice)', async ({ page }) => {
    const hits: string[] = []
    page.on('request', (req) => {
      const u = req.url()
      if (u.endsWith('opening.mp3') && u.includes('narration')) hits.push(u)
    })

    await page.setViewportSize({ width: 1366, height: 768 })
    await gotoLoaded(page, STORY_ROUTE)
    await expect(page.locator('[data-testid="eco-comic-narration-btn"]')).toBeVisible({
      timeout: 30_000,
    })

    await page.locator('[data-testid="eco-comic-narration-btn"]').click()

    await expect.poll(() => hits.length, { timeout: 15_000 }).toBeGreaterThan(0)
    expect(hits[0]).toContain('/games/eco-comics/secret-wooden-crate/narration/opening.mp3')
  })

  test('after START, narration requests scene-01.mp3', async ({ page }) => {
    const hits: string[] = []
    page.on('request', (req) => {
      const u = req.url()
      if (u.endsWith('scene-01.mp3') && u.includes('narration')) hits.push(u)
    })

    await page.setViewportSize({ width: 1366, height: 768 })
    await gotoLoaded(page, STORY_ROUTE)
    await page.locator('[data-testid="eco-comic-start-btn"]').click()

    await expect(page.locator('[data-testid="eco-comic-narration-btn"]')).toBeVisible({
      timeout: 15_000,
    })
    await page.locator('[data-testid="eco-comic-narration-btn"]').click()

    await expect.poll(() => hits.length, { timeout: 15_000 }).toBeGreaterThan(0)
    expect(hits[0]).toContain('/games/eco-comics/secret-wooden-crate/narration/scene-01.mp3')
  })

  test('scene_4 narration requests a single scene-04.mp3 clip', async ({ page }) => {
    const hits: string[] = []
    page.on('request', (req) => {
      const u = req.url()
      if (u.includes('scene-04.mp3') && u.includes('narration')) hits.push(u)
    })

    await page.setViewportSize({ width: 1366, height: 768 })
    await gotoLoaded(page, STORY_ROUTE)
    await page.locator('[data-testid="eco-comic-start-btn"]').click()

    for (let i = 0; i < 3; i++) {
      await expect(page.locator('[data-testid="eco-comic-next-btn"]')).toBeVisible({ timeout: 10_000 })
      await page.locator('[data-testid="eco-comic-next-btn"]').click()
      await page.waitForTimeout(120)
    }

    await page.locator('[data-testid="eco-comic-narration-btn"]').click()

    await expect.poll(() => hits.length, { timeout: 25_000 }).toBeGreaterThan(0)
    expect(hits[0]).toContain('/games/eco-comics/secret-wooden-crate/narration/scene-04.mp3')
  })

  test('prepared opening narration does not POST to /api/v1/tts/generate', async ({ page }) => {
    let ttsPosts = 0
    page.on('request', (req) => {
      if (req.method() !== 'POST') return
      const u = req.url()
      if (u.includes('/api/v1/tts/generate') || u.includes('tts/generate')) ttsPosts++
    })

    await page.setViewportSize({ width: 1366, height: 768 })
    await gotoLoaded(page, STORY_ROUTE)
    await expect(page.locator('[data-testid="eco-comic-narration-btn"]')).toBeVisible({
      timeout: 30_000,
    })

    await page.locator('[data-testid="eco-comic-narration-btn"]').click()
    await page.waitForTimeout(2500)

    expect(ttsPosts, 'Prepared MP3 panels must not call backend TTS').toBe(0)
  })

  // ── Responsive — tablet and mobile ─────────────────────────────────────────

  test('tablet 768×1024 — no horizontal overflow, overlay/buttons readable', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await gotoLoaded(page, STORY_ROUTE)
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })

    await assertNoHorizontalOverflow(page)

    // START button must be visible
    await expect(page.locator('[data-testid="eco-comic-start-btn"]')).toBeVisible()

    // Dialogue overlay present
    await expect(page.locator('.reader__dialogue-overlay')).toBeVisible()
  })

  test('mobile 390×844 — no horizontal overflow, image and overlay readable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoLoaded(page, STORY_ROUTE)
    await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({ timeout: 30_000 })

    await assertNoHorizontalOverflow(page)

    // Scene image present
    await expect(page.locator('img.reader__scene-img')).toBeVisible()

    // Overlay present (flows below image on mobile)
    await expect(page.locator('.reader__dialogue-overlay')).toBeVisible()

    // START button touchable (≥ 44px)
    const startBtn = page.locator('[data-testid="eco-comic-start-btn"]')
    await expect(startBtn).toBeVisible()
    const box = await startBtn.boundingBox()
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })

  // ── Path B newspaper scene overlay placement ────────────────────────────────

  test('path_b_18 overlay uses top-center strip (keeps newspaper headline visible)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await gotoLoaded(page, STORY_ROUTE)

    // Navigate path B: START → 7 NEXTs → choose "Photograph and Report" → 9 NEXTs
    await page.locator('[data-testid="eco-comic-start-btn"]').click()

    for (let i = 0; i < 7; i++) {
      await expect(page.locator('[data-testid="eco-comic-next-btn"]')).toBeVisible({
        timeout: 10_000,
      })
      await page.locator('[data-testid="eco-comic-next-btn"]').click()
      await page.waitForTimeout(200)
    }

    // Choose Path B: "Photograph and Report"
    const pathBBtn = page.locator('[data-testid="eco-comic-choice-path_b_9"]')
    await expect(pathBBtn).toBeVisible({ timeout: 10_000 })
    await pathBBtn.click()
    await page.waitForTimeout(200)

    // Navigate to path_b_18 (9 more NEXTs from path_b_9)
    for (let i = 0; i < 9; i++) {
      await expect(page.locator('[data-testid="eco-comic-next-btn"]')).toBeVisible({
        timeout: 10_000,
      })
      await page.locator('[data-testid="eco-comic-next-btn"]').click()
      await page.waitForTimeout(200)
    }

    // Overlay should now be on screen
    const overlay = page.locator('.reader__dialogue-overlay')
    await expect(overlay).toBeVisible({ timeout: 10_000 })

    // Overlay uses top-center strip (panel layout map — keeps artwork visible)
    const overlayClass = await overlay.getAttribute('class')
    expect(overlayClass).toContain('reader__dialogue-overlay--top-center')
    expect(overlayClass).toContain('reader__dialogue-overlay--strip')
  })

  test('path_a_12 overlay uses top-right strip and has layout metadata after Path A navigation', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await gotoLoaded(page, STORY_ROUTE)

    // Navigate path A: START → 7 NEXTs → choose "Take the Pangolin Now" → 3 NEXTs
    await page.locator('[data-testid="eco-comic-start-btn"]').click()

    for (let i = 0; i < 7; i++) {
      await expect(page.locator('[data-testid="eco-comic-next-btn"]')).toBeVisible({
        timeout: 10_000,
      })
      await page.locator('[data-testid="eco-comic-next-btn"]').click()
      await page.waitForTimeout(200)
    }

    // Choose Path A: "Take the Pangolin Now"
    const pathABtn = page.locator('[data-testid="eco-comic-choice-path_a_9"]')
    await expect(pathABtn).toBeVisible({ timeout: 10_000 })
    await pathABtn.click()
    await page.waitForTimeout(200)

    // Navigate to path_a_12 (3 more NEXTs from path_a_9)
    for (let i = 0; i < 3; i++) {
      await expect(page.locator('[data-testid="eco-comic-next-btn"]')).toBeVisible({
        timeout: 10_000,
      })
      await page.locator('[data-testid="eco-comic-next-btn"]').click()
      await page.waitForTimeout(200)
    }

    // Overlay should now be on screen
    const overlay = page.locator('.reader__dialogue-overlay')
    await expect(overlay).toBeVisible({ timeout: 10_000 })

    // Check metadata attributes
    await expect(overlay).toHaveAttribute('data-panel-id', 'path_a_12')
    await expect(overlay).toHaveAttribute('data-has-choices', 'true')
    await expect(overlay).toHaveAttribute('data-placement', 'top-right')
    await expect(overlay).toHaveAttribute('data-size', 'strip')
    await expect(overlay).toHaveClass(/reader__dialogue-overlay--has-choices/)

    // Bounding boxes check for vertical stacking: text is above choices
    const textLoc = overlay.locator('.reader__dialogue-inner')
    const toolbarLoc = overlay.locator('.reader__overlay-toolbar')
    const textBox = await textLoc.boundingBox()
    const toolbarBox = await toolbarLoc.boundingBox()

    expect(textBox).not.toBeNull()
    expect(toolbarBox).not.toBeNull()
    if (textBox && toolbarBox) {
      expect(textBox.y + textBox.height).toBeLessThanOrEqual(toolbarBox.y + 2)
    }
  })

  // ── Constrained viewports (Docked Fallback) ──────────────────────────────────

  const DOCKED_VIEWPORTS = [
    { width: 1366, height: 640 },
    { width: 1280, height: 720 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
  ]

  for (const { width, height } of DOCKED_VIEWPORTS) {
    test(`docked mode on ${width}×${height} — dialogue is below image and fits without vertical scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await gotoLoaded(page, STORY_ROUTE)

      await expect(page.locator('[data-testid="eco-comic-reader"]')).toBeVisible({
        timeout: 30_000,
      })

      const frame = page.locator('.reader__scene-frame')
      const overlay = page.locator('.reader__dialogue-overlay')

      await expect(frame).toBeVisible({ timeout: 30_000 })
      await expect(overlay).toBeVisible()

      const frameBox = await frame.boundingBox()
      const overlayBox = await overlay.boundingBox()

      expect(frameBox).not.toBeNull()
      expect(overlayBox).not.toBeNull()

      if (frameBox && overlayBox) {
        // Dialogue overlay is docked BELOW the scene frame (not overlapping)
        // Allowing a 5px overlap tolerance due to borders/rounding, but generally y is below.
        expect(overlayBox.y).toBeGreaterThanOrEqual(frameBox.y + frameBox.height - 5)
      }

      // No vertical scroll
      const fits = await viewportHasNoVerticalPageScroll(page, SCROLL_TOLERANCE_PX)
      expect(fits, `Viewport ${width}×${height} in docked mode should not cause vertical scroll`).toBe(true)

      // No horizontal overflow
      await assertNoHorizontalOverflow(page)
    })
  }
})
