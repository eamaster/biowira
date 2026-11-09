import type { Page } from '@playwright/test'

/** `domcontentloaded` can fire before lazy route chunks mount on a cold Vite server. */
export async function gotoLoaded(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'load', timeout: 90_000 })
}
