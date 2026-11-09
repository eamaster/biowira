/**
 * Runs only Playwright tests tagged `@preview` against `vite preview` (see playwright.config.ts E2E_PREVIEW).
 * Invoke via `npm run test:e2e:preview` (which runs `npm run build` first).
 */
import { spawnSync } from 'node:child_process'

process.env.E2E_PREVIEW = '1'

const result = spawnSync('npx', ['playwright', 'test', '--grep', '@preview'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

process.exit(result.status ?? 1)
