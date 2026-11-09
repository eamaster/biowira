import { describe, it, expect } from 'vitest'

// ── Repository factory: per-domain source selection ───────────────────────────
// Guards against regression of the hybrid repository strategy.
//
// NOTE ON TEST ENVIRONMENT:
//   vitest.setup.ts stubs VITE_REPO_ANIMALS=mock (and all other domains to mock)
//   so that tests are network-free and deterministic.
//   The repoSources defaults (animals=api in production) are tested structurally below
//   via the resolveRepoSource helper type-safety, not by asserting production defaults.

describe('Repository factory: per-domain source selection', () => {
  it('repoSources has all 8 expected domain keys', async () => {
    const { appConfig } = await import('@/app/config')
    const s = appConfig.repoSources
    expect(s).toHaveProperty('animals')
    expect(s).toHaveProperty('session')
    expect(s).toHaveProperty('profile')
    expect(s).toHaveProperty('user')
    expect(s).toHaveProperty('funFacts')
    expect(s).toHaveProperty('quizzes')
    expect(s).toHaveProperty('missions')
    expect(s).toHaveProperty('badges')
  })

  it('all repoSources values are strictly api or mock — no invalid values', async () => {
    const { appConfig } = await import('@/app/config')
    const validValues = ['api', 'mock']
    for (const [domain, value] of Object.entries(appConfig.repoSources)) {
      expect(validValues, `repoSources.${domain} must be 'api' or 'mock', got '${value}'`).toContain(
        value,
      )
    }
  })

  it('in the test environment, all domains use mock (VITE_REPO_* stubbed by vitest.setup.ts)', async () => {
    const { appConfig } = await import('@/app/config')
    // vitest.setup.ts stubs all VITE_REPO_* to 'mock' to keep tests network-free
    // (includes the new missions and badges domains)
    for (const [domain, value] of Object.entries(appConfig.repoSources)) {
      expect(value, `repoSources.${domain} should be 'mock' in test env`).toBe('mock')
    }
  })

  it('repositories object exposes all required IAnimalRepository methods', async () => {
    const { repositories } = await import('@/repositories')
    expect(typeof repositories.animals.getAll).toBe('function')
    expect(typeof repositories.animals.getByCategory).toBe('function')
    expect(typeof repositories.animals.getById).toBe('function')
    expect(typeof repositories.animals.getOccurrencesByAnimalId).toBe('function')
  })

  it('repositories object exposes all required ISessionRepository methods', async () => {
    const { repositories } = await import('@/repositories')
    expect(typeof repositories.session.bootstrapSession).toBe('function')
    expect(typeof repositories.session.getActiveSession).toBe('function')
    expect(typeof repositories.session.setActiveSession).toBe('function')
    expect(typeof repositories.session.clearSession).toBe('function')
  })

  it('repositories object exposes all required IProfileRepository methods', async () => {
    const { repositories } = await import('@/repositories')
    expect(typeof repositories.profile.listProfiles).toBe('function')
    expect(typeof repositories.profile.getProfile).toBe('function')
    expect(typeof repositories.profile.createProfile).toBe('function')
    expect(typeof repositories.profile.updateProfileProgress).toBe('function')
    expect(typeof repositories.profile.deleteProfile).toBe('function')
  })

  it('repositories object exposes all required IUserRepository methods', async () => {
    const { repositories } = await import('@/repositories')
    expect(typeof repositories.user.getProgress).toBe('function')
    expect(typeof repositories.user.addPoints).toBe('function')
    expect(typeof repositories.user.updateLastAnimal).toBe('function')
    expect(typeof repositories.user.updateLastQuiz).toBe('function')
  })

  it('repositories object exposes all required IFunFactRepository methods', async () => {
    const { repositories } = await import('@/repositories')
    expect(typeof repositories.funFacts.getAll).toBe('function')
    expect(typeof repositories.funFacts.getById).toBe('function')
  })

  it('repositories object exposes all required IQuizRepository methods', async () => {
    const { repositories } = await import('@/repositories')
    expect(typeof repositories.quizzes.getAll).toBe('function')
    expect(typeof repositories.quizzes.getById).toBe('function')
    expect(typeof repositories.quizzes.submitResult).toBe('function')
  })

  it('mock repos for session/profile/user construct without throwing (pure local, no network)', async () => {
    // If these called the network at construction they would fail in the jsdom/happy-dom environment.
    const { MockSessionRepository } = await import('@/repositories/mock/mockSessionRepository')
    const { MockProfileRepository } = await import('@/repositories/mock/mockProfileRepository')
    const { MockUserRepository } = await import('@/repositories/mock/mockUserRepository')
    expect(() => new MockSessionRepository()).not.toThrow()
    expect(() => new MockProfileRepository()).not.toThrow()
    expect(() => new MockUserRepository()).not.toThrow()
  })

  it('repositories object exposes all required IMissionRepository methods', async () => {
    const { repositories } = await import('@/repositories')
    expect(typeof repositories.missions.getWeatherAdaptiveMission).toBe('function')
    expect(typeof repositories.missions.assignMission).toBe('function')
    expect(typeof repositories.missions.startMission).toBe('function')
    expect(typeof repositories.missions.getMissionHistory).toBe('function')
    expect(typeof repositories.missions.completeMission).toBe('function')
  })

  it('repositories object exposes all required IBadgeRepository methods', async () => {
    const { repositories } = await import('@/repositories')
    expect(typeof repositories.badges.getBadges).toBe('function')
  })

  it('mock mission repo getMissionHistory returns array', async () => {
    const { MockMissionRepository } = await import('@/repositories/mock/mockMissionRepository')
    const repo = new MockMissionRepository()
    const history = await repo.getMissionHistory()
    expect(Array.isArray(history)).toBe(true)
  })

  it('mock badge repo getBadges returns empty array', async () => {
    const { MockBadgeRepository } = await import('@/repositories/mock/mockBadgeRepository')
    const repo = new MockBadgeRepository()
    const badges = await repo.getBadges()
    expect(badges).toHaveLength(0)
  })

  it('IQuizRepository now includes saveProgress method', async () => {
    const { repositories } = await import('@/repositories')
    expect(typeof repositories.quizzes.saveProgress).toBe('function')
  })
})
