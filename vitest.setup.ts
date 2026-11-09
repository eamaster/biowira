import { vi } from 'vitest'

// Unit tests stay deterministic: all domains use mock repositories.
// VITE_USE_MOCK is kept for backward compat; the factory now reads VITE_REPO_* per-domain.
// Force every domain to 'mock' so no test makes real HTTP calls to the backend.
vi.stubEnv('VITE_USE_MOCK', 'true')
vi.stubEnv('VITE_REPO_ANIMALS', 'mock')
vi.stubEnv('VITE_REPO_SESSION', 'mock')
vi.stubEnv('VITE_REPO_PROFILE', 'mock')
vi.stubEnv('VITE_REPO_USER', 'mock')
vi.stubEnv('VITE_REPO_FUN_FACTS', 'mock')
vi.stubEnv('VITE_REPO_QUIZZES', 'mock')
vi.stubEnv('VITE_REPO_MISSIONS', 'mock')
vi.stubEnv('VITE_REPO_BADGES', 'mock')
// Stub the API base URL to ensure tests always resolve against /api/v1 regardless
// of any local .env override. Guards against accidental reversion.
vi.stubEnv('VITE_API_BASE_URL', '/api/v1')
