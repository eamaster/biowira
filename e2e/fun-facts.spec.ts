import { test, expect } from '@playwright/test'

/**
 * E2E: Fun Facts collection — unlock order, flip, modal (no likes).
 */

test.describe('Fun Facts', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      const SCHEMA_VERSION = 1
      const now = new Date().toISOString()
      const profile = {
        profileId: 'e2e-explorer',
        displayNickname: 'Test Explorer',
        animalId: 'malayan-tiger',
        animalVisualKey: 'malayan-tiger',
        leafPoints: 500,
        level: 5,
        levelTitle: 'Forest Friend',
        createdAt: now,
        lastActiveAt: now,
        guardianBackupLinked: false,
      }
      localStorage.setItem(
        'bw_profiles',
        JSON.stringify({ v: SCHEMA_VERSION, data: [profile] }),
      )
      localStorage.setItem(
        'bw_active_session',
        JSON.stringify({
          v: SCHEMA_VERSION,
          data: { profileId: 'e2e-explorer', restoredAt: now },
        }),
      )
    })
  })

  test('fun facts page renders cards sorted by unlock level (desc)', async ({ page }) => {
    await page.goto('/facts')

    const cards = page.locator('[data-testid="fun-fact-card"]')
    await expect(cards.first()).toBeVisible({ timeout: 8_000 })

    const count = await cards.count()
    expect(count).toBeGreaterThan(1)

    const readLevel = async (card: ReturnType<typeof cards.nth>) => {
      const badge = card.locator('.level-badge')
      const t = await badge.textContent()
      const m = t?.match(/Lvl\s+(\d+)/)
      return m ? parseInt(m[1]!, 10) : 0
    }

    const firstLvl = await readLevel(cards.nth(0))
    const lastLvl = await readLevel(cards.nth(count - 1))
    expect(firstLvl).toBeGreaterThanOrEqual(lastLvl)
  })

  test('flip back face then open modal; no like control; ESC closes modal', async ({ page }) => {
    await page.goto('/facts')

    const firstCard = page.locator('[data-testid="fun-fact-card"]').first()
    await expect(firstCard).toBeVisible({ timeout: 8_000 })

    await firstCard.click()
    await expect(firstCard.locator('.flip-card')).toHaveClass(/is-flipped/)

    await firstCard.getByRole('button', { name: /view details/i }).click()

    const modal = page.locator('[data-testid="fun-fact-modal"]')
    await expect(modal).toBeVisible({ timeout: 3_000 })
    await expect(modal.getByRole('button', { name: /like/i })).toHaveCount(0)

    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible({ timeout: 3_000 })
  })
})
