/**
 * quizCompletion.test.ts
 *
 * Covers:
 *  1. API-authoritative quiz completion snapshot
 *  2. No stale overwrite (profile refresh with lower points is ignored)
 *  3. Fallback (mock) path — local computation applied exactly once
 *  4. API-error fallback — still produces a consistent snapshot
 *  5. Snapshot consistency — all result values from one source
 *  6. resetQuiz clears the snapshot
 *  7. QuizProgressNav dot-model — current question stays distinct after answering
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuizStore, ensureDemoLevelUpTotalPoints } from '@/stores/quizStore'
import { useProgressStore } from '@/stores/progressStore'
import { useProfileStore } from '@/stores/profileStore'
import { useSessionStore } from '@/stores/sessionStore'
import { appConfig } from '@/app/config'
import { repositories } from '@/repositories'
import { MOCK_QUIZZES } from '@/mocks/quizzes'
import { QuizAnswerResult } from '@/domain/enums'
import { getDotModel } from '@/features/quiz/components/quizProgressUtils'
import type { QuizAttempt } from '@/domain/quiz'
import { useAnimalFunFactUnlockStore } from '@/stores/animalFunFactUnlockStore'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createActiveProfileWithPoints(points: number) {
  const profileStore = useProfileStore()
  const progressStore = useProgressStore()

  await profileStore.createProfile({
    displayNickname: 'Test Explorer',
    animalId: 'malayan-tiger',
    animalVisualKey: 'malayan-tiger',
  })

  if (points > 0) {
    await progressStore.addPoints(points)
  }
}

/**
 * Drives the quiz store through a full run answering all questions correctly
 * (using retry if needed to reach canProceed on every question).
 */
async function completeMockQuizCorrectly(store: ReturnType<typeof useQuizStore>) {
  const quiz = MOCK_QUIZZES[0]!
  await store.startQuiz(quiz.id)

  for (let i = 0; i < quiz.questions.length; i++) {
    const q = store.currentQuestion!
    store.selectAnswer(q.correctAnswerId)

    // If the first attempt was correct, canProceed() is true immediately.
    // nextQuestion() advances or calls finishQuiz() on the last question.
    store.nextQuestion()
  }
}

// ── API-path snapshot tests ───────────────────────────────────────────────────

describe('quizCompletion: API-authoritative snapshot', () => {
  let savedSource: typeof appConfig.repoSources.quizzes

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    savedSource = appConfig.repoSources.quizzes
  })

  afterEach(() => {
    appConfig.repoSources.quizzes = savedSource
    vi.restoreAllMocks()
  })

  it('server totalPoints is used as the cumulative total in the snapshot', async () => {
    await createActiveProfileWithPoints(360)
    appConfig.repoSources.quizzes = 'api'

    // Use setTimeout (macro-task) so the Promise resolves AFTER the synchronous
    // test continuation runs. mockResolvedValue schedules resolution as a
    // microtask, which can run before the test assertion when the event loop
    // has no pending I/O — causing a false negative on the pending check.
    vi.spyOn(repositories.quizzes, 'saveProgress').mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                totalPoints: 400,
                newLevel: 2,
                leveledUp: false,
                newFactsUnlocked: 0,
                newBadges: [],
              }),
            0,
          ),
        ),
    )
    vi.spyOn(repositories.profile, 'getCurrentProfile').mockResolvedValue(null)

    const quizStore = useQuizStore()
    await completeMockQuizCorrectly(quizStore)

    // The macro-task hasn't fired yet — completionPending must still be true
    expect(quizStore.completionPending).toBe(true)

    // Wait for snapshot (setTimeout fires, API resolves, snapshot is frozen)
    await vi.waitFor(() => expect(quizStore.lastCompletionSnapshot).not.toBeNull(), { timeout: 5_000 })

    const snap = quizStore.lastCompletionSnapshot!
    expect(snap.postQuizTotalPoints).toBe(400)
    expect(quizStore.completionPending).toBe(false)
  })

  it('pointsEarned is derived from server total minus pre-quiz baseline', async () => {
    await createActiveProfileWithPoints(360)
    appConfig.repoSources.quizzes = 'api'

    vi.spyOn(repositories.quizzes, 'saveProgress').mockResolvedValue({
      totalPoints: 400,
      newLevel: 2,
      leveledUp: false,
      newFactsUnlocked: 0,
      newBadges: [],
    })
    vi.spyOn(repositories.profile, 'getCurrentProfile').mockResolvedValue(null)

    const quizStore = useQuizStore()
    await completeMockQuizCorrectly(quizStore)
    await vi.waitFor(() => expect(quizStore.lastCompletionSnapshot).not.toBeNull())

    const snap = quizStore.lastCompletionSnapshot!
    // 400 (server total) − 360 (pre-quiz) = 40
    expect(snap.pointsEarned).toBe(40)
    expect(snap.postQuizTotalPoints - snap.pointsEarned).toBe(360) // baseline preserved
  })

  it('pointsEarned is always >= 0 (clamped)', async () => {
    await createActiveProfileWithPoints(500)
    appConfig.repoSources.quizzes = 'api'

    // Server returns a total lower than pre-quiz (edge case / backend anomaly)
    vi.spyOn(repositories.quizzes, 'saveProgress').mockResolvedValue({
      totalPoints: 400,
      newLevel: 2,
      leveledUp: false,
      newFactsUnlocked: 0,
      newBadges: [],
    })
    vi.spyOn(repositories.profile, 'getCurrentProfile').mockResolvedValue(null)

    const quizStore = useQuizStore()
    await completeMockQuizCorrectly(quizStore)
    await vi.waitFor(() => expect(quizStore.lastCompletionSnapshot).not.toBeNull())

    expect(quizStore.lastCompletionSnapshot!.pointsEarned).toBeGreaterThanOrEqual(0)
  })

  it('stale profile refresh does not overwrite newer authoritative totalPoints', async () => {
    await createActiveProfileWithPoints(360)
    appConfig.repoSources.quizzes = 'api'

    const sessionStore = useSessionStore()
    const activeId = sessionStore.activeProfile!.profileId

    vi.spyOn(repositories.quizzes, 'saveProgress').mockResolvedValue({
      totalPoints: 400,
      newLevel: 2,
      leveledUp: false,
      newFactsUnlocked: 0,
      newBadges: [],
    })

    // Simulate a profile refresh that returns STALE lower points
    vi.spyOn(repositories.profile, 'getCurrentProfile').mockResolvedValue({
      profileId: activeId,
      displayNickname: 'Test Explorer',
      animalId: 'malayan-tiger',
      animalVisualKey: 'malayan-tiger',
      leafPoints: 100, // STALE — older than 400
      level: 1,
      levelTitle: 'Nature Newbie',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      guardianBackupLinked: false,
    })

    const quizStore = useQuizStore()
    await completeMockQuizCorrectly(quizStore)
    await vi.waitFor(() => expect(quizStore.lastCompletionSnapshot).not.toBeNull())

    // Snapshot must still carry the authoritative 400
    expect(quizStore.lastCompletionSnapshot!.postQuizTotalPoints).toBe(400)

    // Live stores must NOT have been clobbered by the stale refresh
    expect(sessionStore.activeProfile?.leafPoints).toBe(400)
  })

  it('when server totalPoints is 0, falls back to local computation', async () => {
    await createActiveProfileWithPoints(200)
    appConfig.repoSources.quizzes = 'api'

    vi.spyOn(repositories.quizzes, 'saveProgress').mockResolvedValue({
      totalPoints: 0, // server returned nothing useful
      newLevel: 2,
      leveledUp: false,
      newFactsUnlocked: 0,
      newBadges: [],
    })
    vi.spyOn(repositories.profile, 'getCurrentProfile').mockResolvedValue(null)

    const quizStore = useQuizStore()
    await completeMockQuizCorrectly(quizStore)
    await vi.waitFor(() => expect(quizStore.lastCompletionSnapshot).not.toBeNull())

    const snap = quizStore.lastCompletionSnapshot!
    // Fallback: local formula used, total = 200 + local earned
    expect(snap.postQuizTotalPoints).toBe(200 + snap.pointsEarned)
    expect(snap.pointsEarned).toBeGreaterThan(0)
  })

  it('API error fallback: produces consistent snapshot via local computation', async () => {
    await createActiveProfileWithPoints(200)
    appConfig.repoSources.quizzes = 'api'

    vi.spyOn(repositories.quizzes, 'saveProgress').mockRejectedValue(new Error('Network error'))

    const quizStore = useQuizStore()
    await completeMockQuizCorrectly(quizStore)
    await vi.waitFor(() => expect(quizStore.lastCompletionSnapshot).not.toBeNull(), { timeout: 5_000 })

    const snap = quizStore.lastCompletionSnapshot!
    // Fallback: total = pre-quiz (200) + local earned
    expect(snap.postQuizTotalPoints).toBe(200 + snap.pointsEarned)
    expect(snap.pointsEarned).toBeGreaterThan(0)
    expect(quizStore.completionPending).toBe(false)
  })
})

// ── Mock/no-session path tests ────────────────────────────────────────────────

describe('quizCompletion: mock path (fallback local computation)', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('snapshot is populated synchronously (completionPending stays false)', async () => {
    // Default test env: repoSources.quizzes = 'mock', no active session
    const quizStore = useQuizStore()
    await completeMockQuizCorrectly(quizStore)

    // Mock path is synchronous — snapshot ready immediately
    expect(quizStore.lastCompletionSnapshot).not.toBeNull()
    expect(quizStore.completionPending).toBe(false)
  })

  it('postQuizTotalPoints = preQuizPoints + localPointsEarned (applied exactly once)', async () => {
    const quizStore = useQuizStore()
    const progressStore = useProgressStore()

    const initialPoints = progressStore.leafPoints // 0 in no-session mock

    await completeMockQuizCorrectly(quizStore)

    const snap = quizStore.lastCompletionSnapshot!
    expect(snap.postQuizTotalPoints).toBe(initialPoints + snap.pointsEarned)

    // Points added to the store exactly once
    await vi.waitFor(() => expect(progressStore.leafPoints).toBe(initialPoints + snap.pointsEarned))
    expect(progressStore.leafPoints).toBe(initialPoints + snap.pointsEarned)
  })

  it('resetQuiz clears lastCompletionSnapshot and completionPending', async () => {
    const quizStore = useQuizStore()
    await completeMockQuizCorrectly(quizStore)

    expect(quizStore.lastCompletionSnapshot).not.toBeNull()
    quizStore.resetQuiz()
    expect(quizStore.lastCompletionSnapshot).toBeNull()
    expect(quizStore.completionPending).toBe(false)
  })
})

// ── Result-page snapshot consistency ─────────────────────────────────────────

describe('quizCompletion: result-page snapshot consistency', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('all five progress values come from the same snapshot object', async () => {
    const quizStore = useQuizStore()
    await completeMockQuizCorrectly(quizStore)

    const snap = quizStore.lastCompletionSnapshot!
    // Verify internal consistency of the single snapshot object
    expect(snap.postQuizTotalPoints).toBe(snap.pointsEarned) // pre-quiz = 0 in mock
    expect(snap.scorePercent).toBeGreaterThanOrEqual(0)
    expect(snap.scorePercent).toBeLessThanOrEqual(100)
    expect(snap.levelAfterQuiz).toBeGreaterThanOrEqual(1)
    expect(snap.levelProgressAfterQuiz).toBeGreaterThanOrEqual(0)
    expect(snap.levelProgressAfterQuiz).toBeLessThanOrEqual(100)
  })

  it('snapshot is not null when result page would render', async () => {
    const quizStore = useQuizStore()
    await completeMockQuizCorrectly(quizStore)

    // Both lastResult (for score breakdown) and lastCompletionSnapshot (for progress panel)
    // must be set before the result page renders
    expect(quizStore.lastResult).not.toBeNull()
    expect(quizStore.lastCompletionSnapshot).not.toBeNull()
  })
})

// ── lastQuizTitle recording tests ────────────────────────────────────────────
// Tests A–D from the bug-fix acceptance criteria.

describe('quizCompletion: lastQuizTitle is recorded and survives API refresh', () => {
  let savedSource: typeof appConfig.repoSources.quizzes

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    savedSource = appConfig.repoSources.quizzes
  })

  afterEach(() => {
    appConfig.repoSources.quizzes = savedSource
    vi.restoreAllMocks()
  })

  // ── Test A ──────────────────────────────────────────────────────────────────
  it('A: recordQuizVisit updates both progressStore.progress and sessionStore.activeProfile', async () => {
    const profileStore = useProfileStore()
    const progressStore = useProgressStore()
    const sessionStore = useSessionStore()

    await profileStore.createProfile({
      displayNickname: 'Curious Leaf',
      animalId: 'malayan-tiger',
      animalVisualKey: 'malayan-tiger',
    })

    await progressStore.recordQuizVisit('Rainforest Animals Quiz')

    expect(progressStore.progress?.lastQuizTitle).toBe('Rainforest Animals Quiz')
    expect(sessionStore.activeProfile?.lastQuizTitle).toBe('Rainforest Animals Quiz')
  })

  // ── Test B ──────────────────────────────────────────────────────────────────
  it('B: recordQuizVisit works even when progress.value is null at call time', async () => {
    const profileStore = useProfileStore()
    const progressStore = useProgressStore()
    const sessionStore = useSessionStore()

    await profileStore.createProfile({
      displayNickname: 'Bold Storm',
      animalId: 'hornbill',
      animalVisualKey: 'hornbill',
    })

    // Force progress to null to simulate the case where the store was not yet hydrated.
    // @ts-expect-error — accessing internal ref for test setup
    progressStore.progress = null

    await progressStore.recordQuizVisit('Marine Life Quiz')

    // Both stores must be updated regardless of the null starting state.
    expect(progressStore.progress?.lastQuizTitle).toBe('Marine Life Quiz')
    expect(sessionStore.activeProfile?.lastQuizTitle).toBe('Marine Life Quiz')
  })

  // ── Test C ──────────────────────────────────────────────────────────────────
  it('C: finishQuiz (API path) records lastQuizTitle even when backend GET /profiles omits it', async () => {
    await createActiveProfileWithPoints(100)
    appConfig.repoSources.quizzes = 'api'

    const sessionStore = useSessionStore()
    const progressStore = useProgressStore()
    const activeId = sessionStore.activeProfile!.profileId

    vi.spyOn(repositories.quizzes, 'saveProgress').mockResolvedValue({
      totalPoints: 140,
      newLevel: 1,
      leveledUp: false,
      newFactsUnlocked: 0,
      newBadges: [],
    })

    // Simulate a backend that does NOT return lastQuizTitle.
    vi.spyOn(repositories.profile, 'getCurrentProfile').mockResolvedValue({
      profileId: activeId,
      displayNickname: 'Test Explorer',
      animalId: 'malayan-tiger',
      animalVisualKey: 'malayan-tiger',
      leafPoints: 140,
      level: 1,
      levelTitle: 'Nature Newbie',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      guardianBackupLinked: false,
      // lastQuizTitle intentionally absent — backend omits it
    })

    const quizStore = useQuizStore()
    await completeMockQuizCorrectly(quizStore)
    await vi.waitFor(() => expect(quizStore.lastCompletionSnapshot).not.toBeNull(), { timeout: 5_000 })

    const expectedTitle = MOCK_QUIZZES[0]!.title

    expect(sessionStore.activeProfile?.lastQuizTitle).toBe(expectedTitle)
    expect(progressStore.progress?.lastQuizTitle).toBe(expectedTitle)
  })

  // ── Test D ──────────────────────────────────────────────────────────────────
  it('D: Home-page computed shows the completed quiz title (store-level)', async () => {
    const profileStore = useProfileStore()
    const progressStore = useProgressStore()
    const sessionStore = useSessionStore()

    await profileStore.createProfile({
      displayNickname: 'Speedy Maple',
      animalId: 'pangolin',
      animalVisualKey: 'pangolin',
    })

    // Simulate no previous quiz.
    expect(progressStore.progress?.lastQuizTitle).toBeUndefined()
    expect(sessionStore.activeProfile?.lastQuizTitle).toBeUndefined()

    await progressStore.recordQuizVisit('Ocean Friends Quiz')

    // Both reactive sources that the Home-page computed reads from are updated.
    expect(progressStore.progress?.lastQuizTitle).toBe('Ocean Friends Quiz')
    expect(sessionStore.activeProfile?.lastQuizTitle).toBe('Ocean Friends Quiz')

    // Switching profiles resets to fallback state.
    await profileStore.createProfile({
      displayNickname: 'Gentle Cedar',
      animalId: 'sun-bear',
      animalVisualKey: 'sun-bear',
    })
    expect(progressStore.progress?.lastQuizTitle).toBeUndefined()
    expect(sessionStore.activeProfile?.lastQuizTitle).toBeUndefined()
  })
})

// ── Demo fun-fact unlock tests ────────────────────────────────────────────────

describe('quizCompletion: demo fun-fact unlock', () => {
  let savedSource: typeof appConfig.repoSources.quizzes

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    savedSource = appConfig.repoSources.quizzes
    appConfig.repoSources.quizzes = 'mock'
  })

  afterEach(() => {
    appConfig.repoSources.quizzes = savedSource
    vi.restoreAllMocks()
  })

  function runQuizToCompletion(store: ReturnType<typeof useQuizStore>) {
    const quiz = MOCK_QUIZZES[0]!
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = store.currentQuestion!
      if (!q) break
      store.selectAnswer(q.correctAnswerId)
      store.nextQuestion()
    }
  }

  it('completing quiz with demoUnlockAnimalId malayan-tiger unlocks Malayan Tiger facts', async () => {
    await createActiveProfileWithPoints(0)
    const quizStore = useQuizStore()
    const unlockStore = useAnimalFunFactUnlockStore()

    const quiz = MOCK_QUIZZES[0]!
    await quizStore.startQuiz(quiz.id, { demoUnlockAnimalId: 'malayan-tiger' })
    expect(quizStore.activeDemoUnlockAnimalId).toBe('malayan-tiger')

    runQuizToCompletion(quizStore)

    await vi.waitFor(() => expect(quizStore.lastCompletionSnapshot).not.toBeNull(), { timeout: 5_000 })
    const snap = quizStore.lastCompletionSnapshot!
    expect(snap.demoFunFactsUnlocked).toBe(true)
    expect(snap.demoUnlockedAnimalId).toBe('malayan-tiger')
    expect(snap.demoUnlockedAnimalName).toBe('Malayan Tiger')

    await vi.waitFor(() => expect(unlockStore.isAnimalFactsUnlocked('malayan-tiger')).toBe(true), { timeout: 5_000 })
  })

  it('completing quiz with demoUnlockAnimalId bornean-orangutan unlocks Bornean Orangutan facts', async () => {
    await createActiveProfileWithPoints(0)
    const quizStore = useQuizStore()
    const unlockStore = useAnimalFunFactUnlockStore()

    const quiz = MOCK_QUIZZES[0]!
    await quizStore.startQuiz(quiz.id, { demoUnlockAnimalId: 'bornean-orangutan' })
    runQuizToCompletion(quizStore)

    await vi.waitFor(() => expect(quizStore.lastCompletionSnapshot).not.toBeNull(), { timeout: 5_000 })
    expect(quizStore.lastCompletionSnapshot!.demoFunFactsUnlocked).toBe(true)
    expect(quizStore.lastCompletionSnapshot!.demoUnlockedAnimalId).toBe('bornean-orangutan')
    await vi.waitFor(() => expect(unlockStore.isAnimalFactsUnlocked('bornean-orangutan')).toBe(true), { timeout: 5_000 })
  })

  it('completing quiz with demoUnlockAnimalId sun-bear unlocks Sun Bear facts', async () => {
    await createActiveProfileWithPoints(0)
    const quizStore = useQuizStore()
    const unlockStore = useAnimalFunFactUnlockStore()

    const quiz = MOCK_QUIZZES[0]!
    await quizStore.startQuiz(quiz.id, { demoUnlockAnimalId: 'sun-bear' })
    runQuizToCompletion(quizStore)

    await vi.waitFor(() => expect(quizStore.lastCompletionSnapshot).not.toBeNull(), { timeout: 5_000 })
    expect(quizStore.lastCompletionSnapshot!.demoFunFactsUnlocked).toBe(true)
    expect(quizStore.lastCompletionSnapshot!.demoUnlockedAnimalId).toBe('sun-bear')
    await vi.waitFor(() => expect(unlockStore.isAnimalFactsUnlocked('sun-bear')).toBe(true), { timeout: 5_000 })
  })

  it('completing quiz without demoUnlockAnimalId does not unlock facts', async () => {
    await createActiveProfileWithPoints(0)
    const quizStore = useQuizStore()
    const unlockStore = useAnimalFunFactUnlockStore()

    const quiz = MOCK_QUIZZES[0]!
    await quizStore.startQuiz(quiz.id)
    runQuizToCompletion(quizStore)

    await vi.waitFor(() => expect(quizStore.lastCompletionSnapshot).not.toBeNull(), { timeout: 5_000 })
    const snap = quizStore.lastCompletionSnapshot!
    expect(snap.demoFunFactsUnlocked).toBeFalsy()
    expect(snap.demoUnlockedAnimalId).toBeUndefined()
    expect(unlockStore.unlockedAnimalIds.size).toBe(0)
  })

  it('completing quiz with unsupported animal does not unlock facts', async () => {
    await createActiveProfileWithPoints(0)
    const quizStore = useQuizStore()
    const unlockStore = useAnimalFunFactUnlockStore()

    const quiz = MOCK_QUIZZES[0]!
    await quizStore.startQuiz(quiz.id, { demoUnlockAnimalId: 'saltwater-crocodile' })
    expect(quizStore.activeDemoUnlockAnimalId).toBeNull()
    runQuizToCompletion(quizStore)

    await vi.waitFor(() => expect(quizStore.lastCompletionSnapshot).not.toBeNull(), { timeout: 5_000 })
    const snap = quizStore.lastCompletionSnapshot!
    expect(snap.demoFunFactsUnlocked).toBeFalsy()
    expect(unlockStore.unlockedAnimalIds.size).toBe(0)
  })

  it('resetQuiz clears activeDemoUnlockAnimalId', async () => {
    await createActiveProfileWithPoints(0)
    const quizStore = useQuizStore()

    const quiz = MOCK_QUIZZES[0]!
    await quizStore.startQuiz(quiz.id, { demoUnlockAnimalId: 'malayan-tiger' })
    expect(quizStore.activeDemoUnlockAnimalId).toBe('malayan-tiger')

    quizStore.resetQuiz()
    expect(quizStore.activeDemoUnlockAnimalId).toBeNull()
  })
})

describe('ensureDemoLevelUpTotalPoints', () => {
  it('returns candidatePoints when shouldForceLevelUp is false', () => {
    expect(ensureDemoLevelUpTotalPoints(100, 120, false)).toBe(120)
  })

  it('returns candidatePoints when force=true and already leveled up', () => {
    // Level 1 is 0-199, level 2 is 200-499. Going from 150 to 220 is a level up.
    expect(ensureDemoLevelUpTotalPoints(150, 220, true)).toBe(220)
  })

  it('raises to next level minPoints when force=true and no natural level-up', () => {
    // Pre: 100 (level 1), candidate: 140 (still level 1). Force to level 2 = 200
    expect(ensureDemoLevelUpTotalPoints(100, 140, true)).toBe(200)
  })

  it('handles max level (returns candidatePoints, no force possible)', () => {
    // At level 5 (2000+), no next level
    expect(ensureDemoLevelUpTotalPoints(2500, 2540, true)).toBe(2540)
  })
})

// ── QuizProgressNav dot-model tests ──────────────────────────────────────────

describe('QuizProgressNav: getDotModel utility', () => {
  function makeAttempt(overrides: Partial<QuizAttempt> = {}): QuizAttempt {
    return {
      questionId: 'q1',
      selectedAnswerId: 'a1',
      result: QuizAnswerResult.Correct,
      retriesUsed: 0,
      isRetrying: false,
      ...overrides,
    }
  }

  it('unanswered current question: status=pending, isCurrent=true', () => {
    const model = getDotModel(0, [], 0)
    expect(model.status).toBe('pending')
    expect(model.isCurrent).toBe(true)
  })

  it('unanswered non-current question: status=pending, isCurrent=false', () => {
    const model = getDotModel(1, [], 0)
    expect(model.status).toBe('pending')
    expect(model.isCurrent).toBe(false)
  })

  it('correctly-answered current question: status=correct, isCurrent=true', () => {
    const attempts: QuizAttempt[] = [
      makeAttempt({ questionId: 'q1', result: QuizAnswerResult.Correct }),
    ]
    const model = getDotModel(0, attempts, 0)
    expect(model.status).toBe('correct')
    expect(model.isCurrent).toBe(true) // current emphasis preserved after answering
  })

  it('wrongly-answered (retry used) current question: status=wrong, isCurrent=true', () => {
    const attempts: QuizAttempt[] = [
      makeAttempt({ questionId: 'q1', result: QuizAnswerResult.Wrong, retriesUsed: 1, isRetrying: false }),
    ]
    const model = getDotModel(0, attempts, 0)
    expect(model.status).toBe('wrong')
    expect(model.isCurrent).toBe(true)
  })

  it('answered (in progress, no retry yet) current question: status=answered, isCurrent=true', () => {
    const attempts: QuizAttempt[] = [
      makeAttempt({ questionId: 'q1', result: QuizAnswerResult.Wrong, retriesUsed: 0, isRetrying: false }),
    ]
    const model = getDotModel(0, attempts, 0)
    expect(model.status).toBe('answered')
    expect(model.isCurrent).toBe(true)
  })

  it('correctly-answered non-current question: status=correct, isCurrent=false', () => {
    const attempts: QuizAttempt[] = [
      makeAttempt({ questionId: 'q1', result: QuizAnswerResult.Correct }),
    ]
    // currentIndex is 1 (next question), so question 0 is no longer current
    const model = getDotModel(0, attempts, 1)
    expect(model.status).toBe('correct')
    expect(model.isCurrent).toBe(false)
  })

  it('still-retrying question: status=answered, isCurrent=true', () => {
    // isRetrying=true means the child clicked retry but hasn't selected yet
    const attempts: QuizAttempt[] = [
      makeAttempt({ questionId: 'q1', result: QuizAnswerResult.Wrong, retriesUsed: 0, isRetrying: true }),
    ]
    const model = getDotModel(0, attempts, 0)
    // retriesUsed is 0 and isRetrying is true → not yet in 'wrong' final state
    expect(model.status).toBe('answered')
    expect(model.isCurrent).toBe(true)
  })
})
