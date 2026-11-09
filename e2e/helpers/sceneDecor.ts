/**
 * Scene layout assertions for rainforest pages (BioWiraScenePage).
 */

import type { BoundingBox, Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export const COMMON_DESKTOP_SCENE_VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
] as const

/** Synchronous DOM read — avoids locator stability waits that can wedge on layered decor <img>s. */
async function clientRectBySelector(page: Page, selector: string): Promise<BoundingBox> {
  return page.$eval(selector, (el) => {
    const r = (el as Element).getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  })
}

export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const { scrollW, clientW } = await page.evaluate(() => ({
    scrollW: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    clientW: document.documentElement.clientWidth,
  }))
  expect(
    scrollW,
    `Expected no horizontal overflow (scroll ${scrollW}px vs viewport ${clientW}px)`,
  ).toBeLessThanOrEqual(clientW + 2)
}

/** Page-level vertical slack for font metrics / scrollbar / subpixel rounding. */
const VERTICAL_OVERFLOW_FUDGE_PX = 56

/** True when scrolling is unnecessary for hub-style pages (everything fits viewport). */
export async function viewportHasNoVerticalPageScroll(page: Page, fudgePx = VERTICAL_OVERFLOW_FUDGE_PX): Promise<boolean> {
  return page.evaluate(
    ({ fudgePx: f }) =>
      Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight <= f,
    { fudgePx },
  )
}

export async function assertSceneCornerDecorRendered(page: Page): Promise<void> {
  const arrow = page.locator('.scene-page__decor--arrow')
  const flower = page.locator('.scene-page__decor--flower')
  await expect(arrow).toBeVisible({ timeout: 15_000 })
  await expect(flower).toBeVisible({ timeout: 15_000 })

  const arrowBox = await clientRectBySelector(page, '.scene-page__decor--arrow')
  const flowerBox = await clientRectBySelector(page, '.scene-page__decor--flower')
  expect(arrowBox.width, 'decor arrow bounding width').toBeGreaterThan(8)
  expect(arrowBox.height, 'decor arrow bounding height').toBeGreaterThan(8)
  expect(flowerBox.width, 'decor flower bounding width').toBeGreaterThan(8)
  expect(flowerBox.height, 'decor flower bounding height').toBeGreaterThan(8)

  await assertDecorPointerEventsNone(page)

  await assertDecorationZOrderBelowNav(page)
}

async function assertDecorPointerEventsNone(page: Page): Promise<void> {
  const pe = await page.evaluate(() =>
    [...document.querySelectorAll('.scene-page__decor')].every(
      (el) => window.getComputedStyle(el).pointerEvents === 'none',
    ),
  )
  expect(pe, 'corner decor images keep pointer-events: none').toBe(true)
}

/**
 * Decor stacking should exceed scene parchment (`--z-scene-surface` / 3), stay far below `--z-nav` (300).
 */
async function assertDecorationZOrderBelowNav(page: Page): Promise<void> {
  await page.evaluate(() => {
    const layer = document.querySelector('.scene-page__decor-layer') as HTMLElement | null
    const surface = document.querySelector('.scene-page__content') as HTMLElement | null
    const nav = document.querySelector('.top-nav') as HTMLElement | null
    if (!layer || !surface) throw new Error('Missing scene layering nodes')
    const zLayer = Number.parseFloat(window.getComputedStyle(layer).zIndex) || 0
    const zSurface = Number.parseFloat(window.getComputedStyle(surface).zIndex) || 0
    if (zLayer <= zSurface) {
      throw new Error(`Decor z-index (${zLayer}) must exceed surface (${zSurface})`)
    }
    if (nav) {
      const zNav = Number.parseFloat(window.getComputedStyle(nav).zIndex) || 0
      if (zNav <= zLayer || zNav < 100) throw new Error('Expected nav stacking above corner decor')
    }
  })
}

function pointInRect(
  px: number,
  py: number,
  r: BoundingBox | null | undefined,
  inset = 0,
): boolean {
  if (!r) return false
  return (
    px >= r.x + inset &&
    px <= r.x + r.width - inset &&
    py >= r.y + inset &&
    py <= r.y + r.height - inset
  )
}

/** Button center coordinates must remain outside decor boxes (hits still reach the button). */
export async function assertDecorAvoidsInteractiveCenters(page: Page, buttonLocators: Locator[]) {
  await assertSceneCornerDecorRendered(page)

  const arrowBox = await clientRectBySelector(page, '.scene-page__decor--arrow')
  const flowerBox = await clientRectBySelector(page, '.scene-page__decor--flower')

  for (const btn of buttonLocators) {
    await expect(btn).toBeVisible({ timeout: 10_000 })
    const bb = await btn.boundingBox()
    if (!bb) continue
    const cx = bb.x + bb.width / 2
    const cy = bb.y + bb.height / 2
    expect(
      pointInRect(cx, cy, arrowBox, 6) || pointInRect(cx, cy, flowerBox, 6),
      `Decor overlaps button center (${Math.round(cx)}, ${Math.round(cy)})`,
    ).toBe(false)
  }
}
