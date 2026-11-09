import { test, expect, type Locator, type Page } from '@playwright/test'

/**
 * Responsive layout tests for the homepage (BioWira Home).
 *
 * Viewport matrix runs on Chromium only (explicit sizes); the `mobile-chrome` project
 * skips these to avoid conflicting device presets.
 */

export const HOME_VIEWPORTS = [
  { name: '320×740', width: 320, height: 740 },
  { name: '337×812', width: 337, height: 812 },
  { name: '360×800', width: 360, height: 800 },
  { name: '390×844', width: 390, height: 844 },
  { name: '414×896', width: 414, height: 896 },
  { name: '768×1024', width: 768, height: 1024 },
  { name: '820×1180', width: 820, height: 1180 },
  { name: '1024×768', width: 1024, height: 768 },
  { name: '1280×800', width: 1280, height: 800 },
  { name: '1440×900', width: 1440, height: 900 },
] as const

const FEATURE_CARD_NAMES = [
  /discover animals/i,
  /popular fun facts/i,
  /take animal quiz/i,
  /nature missions/i,
  /explorer rescue run/i,
]

/** Basenames of scene layers under `/backgrounds` (from the central registry). */
const SCENE_MOBILE_FILENAME = 'home-background-mobile.webp'
const SCENE_TABLET_FILENAME = 'home-background-tablet.webp'
const SCENE_DESKTOP_FILENAME = 'home-background-desktop.webp'

const PREVIEW_SUITE_ACTIVE = process.env.E2E_PREVIEW === '1'

/**
 * Persist mock session (storageService v1 envelope). After reload, bootstrap should unlock `/`;
 * if the app still lands on Welcome (e.g. API session repo in a reused dev server), activate via Continue.
 */
async function seedMockActiveProfile(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(() => {
    const profileId = 'e2e-home-profile'
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

  const home = page.locator('.home-page')
  try {
    await home.waitFor({ state: 'visible', timeout: 8000 })
    return
  } catch {
    // fall through — Welcome may still be resolving profiles / session sources
  }

  const continueBtn = page.getByRole('button', { name: /continue/i }).first()
  if (await continueBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
    await continueBtn.click()
  }
  await home.waitFor({ state: 'visible', timeout: 20_000 })
}

async function verticalGapBetween(upper: Locator, lower: Locator): Promise<number> {
  const u = await upper.boundingBox()
  const l = await lower.boundingBox()
  expect(u, 'upper bounding box').toBeTruthy()
  expect(l, 'lower bounding box').toBeTruthy()
  if (!u || !l) return 0
  return l.y - (u.y + u.height)
}

async function expectReasonableGap(
  upper: Locator,
  lower: Locator,
  minGap: number,
  maxGap: number,
): Promise<void> {
  const gap = await verticalGapBetween(upper, lower)
  expect(gap, `gap ${minGap}..${maxGap}, got ${gap}`).toBeGreaterThanOrEqual(minGap)
  expect(gap, `gap ${minGap}..${maxGap}, got ${gap}`).toBeLessThanOrEqual(maxGap)
}

function expectRoughlyConsistentGaps(gapA: number, gapB: number, tolerance: number): void {
  expect(Math.abs(gapA - gapB), `gaps ${gapA} vs ${gapB} (±${tolerance})`).toBeLessThanOrEqual(
    tolerance,
  )
}

/** Axis-aligned overlap with small tolerance for sub-pixel rounding. */
function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  tol = 2,
): boolean {
  return !(
    a.x + a.width <= b.x + tol ||
    b.x + b.width <= a.x + tol ||
    a.y + a.height <= b.y + tol ||
    b.y + b.height <= a.y + tol
  )
}

/** Drop Workbox caches + unregister SWs so scene CSS cannot stick to an outdated precache revision. */
async function resetStalePwaSurface(page: Page): Promise<void> {
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  })
}

async function getHomeSceneComputedBackgroundImage(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.querySelector('.home-page')
    return el ? getComputedStyle(el).backgroundImage : ''
  })
}

async function flushMediaQueryLayout(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve())
        })
      }),
  )
}

/** Policy: `$bp-sm` (480px) vs `$bp-xl` (1280px) aligned with BioWira tokens. */
function viewportSceneTier(width: number): 'mobile' | 'tablet' | 'desktop' {
  if (width <= 480) return 'mobile'
  if (width >= 1280) return 'desktop'
  return 'tablet'
}

function assertComputedSceneMatchesTier(backgroundImage: string, tier: 'mobile' | 'tablet' | 'desktop'): void {
  if (tier === 'mobile') {
    expect(backgroundImage, 'mobile viewport must show mobile scenic WebP').toContain(SCENE_MOBILE_FILENAME)
    expect(backgroundImage, 'tablet scenic must not load on mobile').not.toContain(SCENE_TABLET_FILENAME)
    expect(backgroundImage, 'desktop scenic must not load on mobile').not.toContain(SCENE_DESKTOP_FILENAME)
  } else if (tier === 'tablet') {
    expect(backgroundImage, 'tablet viewport must show tablet scenic WebP').toContain(SCENE_TABLET_FILENAME)
    expect(backgroundImage, 'mobile scenic must not load on tablet').not.toContain(SCENE_MOBILE_FILENAME)
    expect(backgroundImage, 'desktop scenic must not load on tablet').not.toContain(SCENE_DESKTOP_FILENAME)
  } else {
    expect(backgroundImage, 'desktop viewport must show desktop scenic WebP').toContain(SCENE_DESKTOP_FILENAME)
    expect(backgroundImage, 'mobile scenic must not load on desktop').not.toContain(SCENE_MOBILE_FILENAME)
    expect(backgroundImage, 'tablet scenic must not load on desktop').not.toContain(SCENE_TABLET_FILENAME)
  }
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const ok = await page.evaluate(() => {
    const root = document.documentElement
    /** Tolerate sub-pixel layout + wide flex nav wordmark rounding without user-visible scrollbars */
    return root.scrollWidth <= root.clientWidth + 32
  })
  expect(ok).toBe(true)
}

/**
 * Decorative images must not be the hit target above key panel content (stacking: decor behind UI).
 */
async function expectDecorDoesNotObstruct(
  page: Page,
  decorTestId: string,
  panelTestId: string,
): Promise<void> {
  const decorLoc = page.locator(`[data-testid="${decorTestId}"]`)
  if (!(await decorLoc.isVisible().catch(() => false))) return

  const ok = await page.evaluate(
    ([dId, pId]) => {
      const decorEl = document.querySelector(`[data-testid="${dId}"]`) as HTMLElement | null
      const panelEl = document.querySelector(`[data-testid="${pId}"]`) as HTMLElement | null
      if (!decorEl || !panelEl) return true

      const r = panelEl.getBoundingClientRect()
      const pts: [number, number][] = [
        [r.left + 16, r.top + 28],
        [r.left + r.width * 0.38, r.top + r.height * 0.48],
        [r.right - 16, r.top + r.height * 0.42],
        [r.left + r.width * 0.5, r.bottom - 20],
      ]

      const isDecor = (el: Element | null): boolean =>
        Boolean(el && (el === decorEl || decorEl.contains(el)))

      for (const [x, y] of pts) {
        if (isDecor(document.elementFromPoint(x, y))) return false
      }
      return true
    },
    [decorTestId, panelTestId],
  )

  expect(ok, `${decorTestId} should not obstruct ${panelTestId}`).toBe(true)
}

async function assertDecorationsBelowDashboards(page: Page): Promise<void> {
  for (const decorId of ['home-decor-arrow', 'home-decor-flower'] as const) {
    await expectDecorDoesNotObstruct(page, decorId, 'home-dashboard-continue')
    await expectDecorDoesNotObstruct(page, decorId, 'home-dashboard-progress')
  }

  const bar = page.getByTestId('home-dashboard-progress').locator('.progress-bar__track').first()
  if (await bar.isVisible().catch(() => false)) {
    for (const decorId of ['home-decor-arrow', 'home-decor-flower'] as const) {
      const decor = page.getByTestId(decorId)
      if (!(await decor.isVisible().catch(() => false))) continue
      const decorBox = await decor.boundingBox()
      const barBox = await bar.boundingBox()
      if (!decorBox || !barBox || !rectsOverlap(decorBox, barBox, 4)) continue

      const cx = barBox.x + barBox.width / 2
      const cy = barBox.y + barBox.height / 2
      const topTestId = await page.evaluate(([x, y]) => {
        return (
          document.elementFromPoint(x, y)?.closest('[data-testid]')?.getAttribute('data-testid') ?? null
        )
      }, [cx, cy])
      expect(topTestId, 'element above progress track').not.toBe(decorId)
    }
  }
}

for (const viewport of HOME_VIEWPORTS) {
  test.describe(`Homepage responsive — ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== 'chromium',
        'viewport matrix uses explicit width/height (skip duplicate mobile-chrome preset)',
      )
      await seedMockActiveProfile(page)
    })

    test('A: no horizontal overflow; hero & feature cards reachable', async ({ page }) => {
      await expect(page).toHaveTitle(/BioWira/)
      await expectNoHorizontalOverflow(page)

      await expect(page.locator('.home-page')).toBeVisible()

      for (const name of FEATURE_CARD_NAMES) {
        const card = page.getByRole('button', { name })
        await card.scrollIntoViewIfNeeded()
        await expect(card).toBeVisible()
      }
    })

    test('A: Continue Learning + Your Progress ribbons/panels + footer visible', async ({ page }) => {

      const continueArticle = page.getByTestId('home-dashboard-continue')
      const progressArticle = page.getByTestId('home-dashboard-progress')

      await continueArticle.scrollIntoViewIfNeeded()
      await expect(continueArticle.locator('.wood-ribbon')).toBeVisible()
      await expect(continueArticle.locator('.home-page__dashboard-body')).toBeVisible()

      await progressArticle.scrollIntoViewIfNeeded()
      await expect(progressArticle.locator('.wood-ribbon')).toBeVisible()
      await expect(progressArticle.locator('.home-page__dashboard-body')).toBeVisible()

      const footer = page.locator('footer.pixel-footer')
      await footer.scrollIntoViewIfNeeded()
      await expect(footer).toBeVisible()

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await expectNoHorizontalOverflow(page)
    })

    test('B: ribbon ↔ panel + section spacing rhythm', async ({ page }) => {

      const continueArticle = page.getByTestId('home-dashboard-continue')
      const progressArticle = page.getByTestId('home-dashboard-progress')

      await continueArticle.scrollIntoViewIfNeeded()

      const cr = continueArticle.locator('.wood-ribbon').first()
      const cb = continueArticle.locator('.home-page__dashboard-body').first()
      const pr = progressArticle.locator('.wood-ribbon').first()
      const pb = progressArticle.locator('.home-page__dashboard-body').first()

      /* Floated ribbon overlaps panel top; overlap depth varies by viewport */
      const gapContinue = await verticalGapBetween(cr, cb)
      expect(gapContinue).toBeGreaterThanOrEqual(-42)
      expect(gapContinue).toBeLessThanOrEqual(72)

      await progressArticle.scrollIntoViewIfNeeded()
      const gapProgress = await verticalGapBetween(pr, pb)
      expect(gapProgress).toBeGreaterThanOrEqual(-42)
      expect(gapProgress).toBeLessThanOrEqual(72)

      expectRoughlyConsistentGaps(gapContinue, gapProgress, 36)

      if (viewport.width <= 1023) {
        /* Stacked: space between first panel body and second ribbon */
        const continueBottom = continueArticle.locator('.home-page__dashboard-body')
        await expectReasonableGap(continueBottom, pr, 2, 120)
      } else {
        /* Two columns: horizontal gutter between dashboard panels */
        const continueBox = await continueArticle.boundingBox()
        const progressBox = await progressArticle.boundingBox()
        expect(continueBox && progressBox).toBeTruthy()
        if (continueBox && progressBox) {
          const colGap = progressBox.x - (continueBox.x + continueBox.width)
          expect(colGap).toBeGreaterThanOrEqual(8)
          expect(colGap).toBeLessThanOrEqual(96)
        }
      }

      /* Between ribbon and body should not be wildly different across sections */
      expect(Math.abs(gapContinue - gapProgress)).toBeLessThanOrEqual(40)
    })

    test('C: decorations do not obstruct dashboard content', async ({ page }) => {
      await page.getByTestId('home-dashboard-continue').scrollIntoViewIfNeeded()
      await page.getByTestId('home-dashboard-progress').scrollIntoViewIfNeeded()
      await assertDecorationsBelowDashboards(page)
    })

    test('D: progress panel content integrity', async ({ page }) => {
      const wrap = page.getByTestId('home-dashboard-progress')
      await wrap.scrollIntoViewIfNeeded()
      const panel = page.locator('.hpp')
      await panel.scrollIntoViewIfNeeded()
      await expect(panel.getByText(/total leaf points/i)).toBeVisible()

      const levelProg = panel.locator('.hpp__sub-label').filter({ hasText: /^level progress$/i })
      await levelProg.scrollIntoViewIfNeeded()
      await expect(levelProg).toBeAttached()
      const lpBox = await levelProg.boundingBox()
      expect(lpBox && lpBox.height > 2).toBeTruthy()

      await expect(panel.locator('.progress-bar__track').first()).toBeVisible()

      const levelName = panel.locator('.hpp__level-name')
      await levelName.scrollIntoViewIfNeeded()
      await expect(levelName).toBeAttached()
      await expect.poll(async () => levelName.textContent()).toMatch(/level\s+\d+/i)

      const insetOk = await wrap.evaluate((el) => {
        const child = el.querySelector('.hpp') as HTMLElement | null
        if (!child) return false
        const o = el.getBoundingClientRect()
        const c = child.getBoundingClientRect()
        const t = 4
        return c.left >= o.left - t && c.right <= o.right + t && c.top >= o.top - t && c.bottom <= o.bottom + t
      })
      expect(insetOk).toBe(true)
    })

    test('E: footer spacing — visible and not swallowed by bottom nav', async ({ page }) => {
      const footer = page.locator('footer.pixel-footer')
      await footer.scrollIntoViewIfNeeded()
      await expect(footer).toBeVisible()

      const progressBox = await page.getByTestId('home-dashboard-progress').boundingBox()
      const footerBox = await footer.boundingBox()
      expect(progressBox && footerBox).toBeTruthy()
      if (progressBox && footerBox) {
        const gap = footerBox.y - (progressBox.y + progressBox.height)
        expect(gap).toBeGreaterThanOrEqual(-8)
        expect(gap).toBeLessThanOrEqual(220)
      }

      if (viewport.width < 768) {
        const nav = page.locator('.app-shell__bottom-nav')
        await expect(nav).toBeVisible()
        const navBox = await nav.boundingBox()
        const fBox = await footer.boundingBox()
        if (
          navBox &&
          fBox &&
          typeof fBox.bottom === 'number' &&
          typeof navBox.top === 'number'
        ) {
          expect(fBox.bottom).toBeLessThanOrEqual(navBox.top + 2)
        }
      }
    })

    test('F: computed `.home-page` scenic background respects viewport tier', async ({
      page,
    }) => {
      await resetStalePwaSurface(page)
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.locator('.home-page').waitFor({ state: 'visible', timeout: 20_000 })

      const bg = await getHomeSceneComputedBackgroundImage(page)
      const tier = viewportSceneTier(viewport.width)
      assertComputedSceneMatchesTier(bg, tier)

      /** Gradient overlay from `HomePage.vue` must remain combined with scenic art */
      expect(bg.toLowerCase()).toContain('gradient')
      await expectNoHorizontalOverflow(page)
    })
  })
}

test.describe('Homepage scenic background — live viewport resize', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium',
      'explicit resize sequence (Chromium only)',
    )
    /**
     * `seedMockActiveProfile` ends on Home once session storage is seeded.
     * No extra reload here: an immediate reload after SW teardown (used in static viewport tests)
     * often returns to Welcome and needs the Continue path again — not needed for media-query churn.
     */
    await seedMockActiveProfile(page)
  })

  test('computed scenic WebP switches among desktop, tablet, and mobile when the window changes', async ({
    page,
  }) => {
    const sequence: readonly (readonly [number, number, 'mobile' | 'tablet' | 'desktop'])[] = [
      [1440, 900, 'desktop'],
      [820, 1180, 'tablet'],
      [390, 844, 'mobile'],
      [1024, 768, 'tablet'],
      [480, 854, 'mobile'],
      [481, 854, 'tablet'],
      [1280, 800, 'desktop'],
      [600, 900, 'tablet'],
      [414, 896, 'mobile'],
      [768, 1024, 'tablet'],
    ]

    let previousTier: string | undefined
    for (const [width, height, tier] of sequence) {
      await page.setViewportSize({ width, height })
      await flushMediaQueryLayout(page)

      const inner = await page.evaluate(() => window.innerWidth)

      /** Scrollbar quirks; MQ use inner width — allow 1px tolerance */
      await expect.soft(inner).toBeLessThanOrEqual(width + 1)

      await expect
        .poll(
          async () => {
            const bg = await getHomeSceneComputedBackgroundImage(page)
            try {
              assertComputedSceneMatchesTier(bg, tier)
              return true
            } catch {
              return false
            }
          },
          {
            message: `[resize] viewport ${width}×${height} → tier ${tier} after ${previousTier}`,
            intervals: [32, 100, 200],
            timeout: 8000,
          },
        )
        .toBe(true)

      previousTier = tier
    }

    const finalBg = (await getHomeSceneComputedBackgroundImage(page)).toLowerCase()
    expect(finalBg).toContain('gradient')
  })
})

test.describe('Homepage asset registry sanity', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium',
      'explicit viewport not required; skip duplicate mobile-chrome run',
    )
    await seedMockActiveProfile(page)
  })

  test('HOME_PAGE_ASSETS feature cards have test ids for all five cards', async ({ page }) => {
    const cardIds = ['discover', 'facts', 'quiz', 'missions', 'rescue']
    for (const id of cardIds) {
      await expect(page.locator(`[data-testid="home-feature-card-${id}"]`)).toBeVisible()
    }
  })
})

test.describe('Homepage desktop UI quality — 1440×900', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium',
      'align with viewport matrix (Chromium only)',
    )
    await seedMockActiveProfile(page)
  })

  test('feature card titles are vertically aligned across all five cards', async ({ page }) => {
    await page.waitForSelector('.hfc__title')

    const titleTops = await page.locator('.hfc__title').evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().top)),
    )

    expect(titleTops).toHaveLength(5)
    expect(Math.max(...titleTops) - Math.min(...titleTops)).toBeLessThanOrEqual(20)
  })

  test('feature card descriptions are vertically aligned across all five cards', async ({ page }) => {
    await page.waitForSelector('.hfc__desc')

    const descTops = await page.locator('.hfc__desc').evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().top)),
    )

    expect(descTops).toHaveLength(5)
    expect(Math.max(...descTops) - Math.min(...descTops)).toBeLessThanOrEqual(4)
  })

  test('feature card buttons fit safely inside card panels', async ({ page }) => {

    const cardButtonFits = await page.locator('.hfc').evaluateAll((cards) =>
      cards.every((card) => {
        const cardRect = card.getBoundingClientRect()
        const btn = card.querySelector('.hfc__btn')
        if (!btn) return false
        const btnRect = btn.getBoundingClientRect()
        const safeInset = 12
        return (
          btnRect.left >= cardRect.left + safeInset &&
          btnRect.right <= cardRect.right - safeInset &&
          btnRect.bottom <= cardRect.bottom - safeInset
        )
      }),
    )

    expect(cardButtonFits).toBe(true)
  })

  test('feature card title font size is readable for children (≥18px)', async ({ page }) => {
    await page.waitForSelector('.hfc__title')

    const titleSizes = await page.locator('.hfc__title').evaluateAll((els) =>
      els.map((el) => parseFloat(getComputedStyle(el).fontSize)),
    )

    expect(Math.min(...titleSizes)).toBeGreaterThanOrEqual(18)
  })

  test('rescue card navigates to /games/explorer-rescue-run', async ({ page }) => {
    await page.click('[data-testid="home-feature-card-rescue"]')
    await expect(page).toHaveURL(/\/games\/explorer-rescue-run/)
  })
})

if (PREVIEW_SUITE_ACTIVE) {
  test.describe('Homepage scenic background — production preview @preview', () => {
    test.use({ viewport: { width: 768, height: 1024 } })

    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== 'chromium',
        'preview parity runs on chromium + explicit sizing',
      )
      await seedMockActiveProfile(page)
    })

    test('vite preview serves tablet-tier computed scenic URL @preview', async ({ page }) => {
      await resetStalePwaSurface(page)
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.locator('.home-page').waitFor({ state: 'visible', timeout: 20_000 })

      const bg = await getHomeSceneComputedBackgroundImage(page)
      assertComputedSceneMatchesTier(bg, 'tablet')
      expect(bg.toLowerCase()).toContain('gradient')
    })

    test('vite preview serves mobile-tier computed scenic URL @preview', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await resetStalePwaSurface(page)
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.locator('.home-page').waitFor({ state: 'visible', timeout: 20_000 })

      const bg = await getHomeSceneComputedBackgroundImage(page)
      assertComputedSceneMatchesTier(bg, 'mobile')
      expect(bg.toLowerCase()).toContain('gradient')
    })

    test('vite preview serves desktop-tier computed scenic URL @preview', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await resetStalePwaSurface(page)
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.locator('.home-page').waitFor({ state: 'visible', timeout: 20_000 })

      const bg = await getHomeSceneComputedBackgroundImage(page)
      assertComputedSceneMatchesTier(bg, 'desktop')
      expect(bg.toLowerCase()).toContain('gradient')
    })
  })
}
