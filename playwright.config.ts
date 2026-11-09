import { defineConfig, devices } from '@playwright/test'

/** When `'1'`, uses `vite preview` on port 4173 (run `npm run build` before e2e; see `test:e2e:preview`). */
const E2E_PREVIEW = process.env.E2E_PREVIEW === '1'

/**
 * Playwright e2e configuration.
 *
 * Local usage:
 *   npm run test:e2e              — run all e2e tests (starts dev server automatically)
 *   npm run test:e2e:preview        — production build + preview server + `@preview` tests only
 *   npm run test:e2e:ui           — interactive Playwright UI mode
 *
 * CI usage (GitHub Actions):
 *   npm run test:e2e:ci           — headless, 2 retries, exit on first failure
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Fail the build on CI if test.only is accidentally committed
  forbidOnly: !!process.env.CI,
  // Two retries on CI to reduce flakiness; none locally
  retries: process.env.CI ? 2 : 0,
  // Single worker on CI to avoid port conflicts; auto-scale locally
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: E2E_PREVIEW ? 'http://localhost:4173' : 'http://localhost:5173',
    // Capture screenshot/trace on first retry only (keeps CI artifacts lean)
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    // Desktop Chrome — primary target
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile viewport — verify bottom nav and responsive layout
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],

  // Automatically spin up the dev server before running e2e tests.
  // By default do NOT reuse localhost:5173: a manually started `npm run dev` ignores the
  // `env` block below (often `VITE_SESSION_ENABLED=true` + API repos), which breaks scene
  // specs that expect mock localStorage + open routes. Opt in with E2E_REUSE_SERVER=1.
  webServer: E2E_PREVIEW
    ? {
        command: 'npx vite preview --host 127.0.0.1 --strictPort --port 4173',
        url: 'http://localhost:4173',
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          ...process.env,
          VITE_SESSION_ENABLED: 'false',
          VITE_REPO_ANIMALS: 'mock',
          VITE_REPO_SESSION: 'mock',
          VITE_REPO_PROFILE: 'mock',
          VITE_REPO_QUIZZES: 'mock',
          VITE_REPO_FUN_FACTS: 'mock',
          VITE_REPO_MISSIONS: 'mock',
          VITE_REPO_BADGES: 'mock',
        },
      }
    : {
        command: 'npx vite --host 127.0.0.1 --strictPort --port 5173',
        url: 'http://localhost:5173',
        reuseExistingServer: process.env.E2E_REUSE_SERVER === '1',
        timeout: 60_000,
        // Match `vitest.setup.ts`: mock repos + relaxed session guard so `/games`, `/quiz`, etc.
        // resolve without backend.
        env: {
          ...process.env,
          VITE_SESSION_ENABLED: 'false',
          VITE_REPO_ANIMALS: 'mock',
          VITE_REPO_SESSION: 'mock',
          VITE_REPO_PROFILE: 'mock',
          VITE_REPO_QUIZZES: 'mock',
          VITE_REPO_FUN_FACTS: 'mock',
          VITE_REPO_MISSIONS: 'mock',
          VITE_REPO_BADGES: 'mock',
        },
      },
})
