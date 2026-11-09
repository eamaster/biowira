import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent, h } from 'vue'

// Domain
import { AnimalCategory, ConservationStatus, HabitatZone, QuizAnswerResult } from '@/domain/enums'
import { getLevelForPoints, getLevelProgress, LEVEL_DEFINITIONS } from '@/domain/user'

// Config
import { STATUS_COLORS, STATUS_LABELS, NAV_ITEMS } from '@/app/config'

// ── Domain: enums ─────────────────────────────────────────────────────────────

describe('Domain: enums', () => {
  it('AnimalCategory has expected values', () => {
    expect(AnimalCategory.Mammals).toBe('mammals')
    expect(AnimalCategory.Birds).toBe('birds')
    expect(AnimalCategory.MarineFreshwater).toBe('marine_freshwater')
    expect(AnimalCategory.All).toBe('all')
  })

  it('ConservationStatus has all 9 statuses', () => {
    const statuses = Object.values(ConservationStatus)
    expect(statuses).toHaveLength(9)
    expect(statuses).toContain(ConservationStatus.LeastConcern)
    expect(statuses).toContain(ConservationStatus.Endangered)
    expect(statuses).toContain(ConservationStatus.Extinct)
  })

  it('HabitatZone has 6 zones', () => {
    expect(Object.values(HabitatZone)).toHaveLength(6)
  })

  it('QuizAnswerResult has 3 states', () => {
    expect(Object.values(QuizAnswerResult)).toHaveLength(3)
    expect(QuizAnswerResult.Correct).toBe('correct')
    expect(QuizAnswerResult.Wrong).toBe('wrong')
    expect(QuizAnswerResult.Pending).toBe('pending')
  })
})

// ── Domain: user progress ─────────────────────────────────────────────────────

describe('Domain: user progress', () => {
  it('getLevelForPoints returns level 1 for 0 pts', () => {
    expect(getLevelForPoints(0).level).toBe(1)
  })

  it('getLevelForPoints returns level 2 for 200 pts', () => {
    expect(getLevelForPoints(200).level).toBe(2)
  })

  it('getLevelForPoints returns level 5 for 2000+ pts', () => {
    expect(getLevelForPoints(2000).level).toBe(5)
  })

  it('getLevelProgress is within 0-100', () => {
    const pct = getLevelProgress(100)
    expect(pct).toBeGreaterThanOrEqual(0)
    expect(pct).toBeLessThanOrEqual(100)
  })

  it('getLevelProgress returns 100 at max level', () => {
    expect(getLevelProgress(10000)).toBe(100)
  })

  it('LEVEL_DEFINITIONS has 5 levels', () => {
    expect(LEVEL_DEFINITIONS).toHaveLength(5)
  })
})

// ── App config ────────────────────────────────────────────────────────────────

describe('App config', () => {
  it('STATUS_COLORS has entries for all conservation statuses', () => {
    for (const status of Object.values(ConservationStatus)) {
      expect(STATUS_COLORS[status]).toBeDefined()
      expect(STATUS_COLORS[status]).toMatch(/^var\(--/)
    }
  })

  it('STATUS_LABELS has entries for all conservation statuses', () => {
    for (const status of Object.values(ConservationStatus)) {
      expect(STATUS_LABELS[status]).toBeTruthy()
    }
  })

  it('NAV_ITEMS has 4 items in correct order', () => {
    expect(NAV_ITEMS).toHaveLength(4)
    expect(NAV_ITEMS[0].label).toBe('Home')
    expect(NAV_ITEMS[1].label).toBe('Discover')
    expect(NAV_ITEMS[2].label).toBe('Quiz')
    expect(NAV_ITEMS[3].label).toBe('Games')
    expect(NAV_ITEMS[2].path).toBe('/quiz')
    expect(NAV_ITEMS[3].path).toBe('/games')
    expect(NAV_ITEMS[3].iconKey).toBe('games')
  })

  it('NAV_ITEMS has no Fun Facts item', () => {
    const labels = NAV_ITEMS.map((item) => item.label)
    expect(labels).not.toContain('Fun Facts')
  })

  it('NAV_ITEMS Quiz item path is /quiz', () => {
    const quiz = NAV_ITEMS.find((item) => item.label === 'Quiz')
    expect(quiz).toBeDefined()
    expect(quiz!.path).toBe('/quiz')
  })

  it('NAV_ITEMS items have iconKey and fallbackIcon fields', () => {
    for (const item of NAV_ITEMS) {
      expect(item.iconKey).toBeTruthy()
      expect(item.fallbackIcon).toBeTruthy()
    }
  })

  it('All NAV_ITEMS iconKeys resolve to a URL in the icon registry', async () => {
    const { getNavIconUrl } = await import('@/app/iconRegistry')
    for (const item of NAV_ITEMS) {
      const url = getNavIconUrl(item.iconKey)
      expect(url).toBeDefined()
      expect(url).toMatch(/^\/icons\/nav\/.+\.(svg|webp)$/)
    }
  })

  it('ROUTE_NAMES includes games hub route', async () => {
    const { ROUTE_NAMES } = await import('@/app/config')
    expect(ROUTE_NAMES.games).toBe('games')
  })
})

// ── Icon Registry ──────────────────────────────────────────────────────────────

describe('Icon Registry', () => {
  it('getNavIconUrl resolves all registered nav keys to /icons/nav/ URLs', async () => {
    const { getNavIconUrl } = await import('@/app/iconRegistry')
    const keys = ['home', 'discover', 'quiz', 'games', 'missions']
    for (const key of keys) {
      const url = getNavIconUrl(key)
      expect(url).toBeDefined()
      expect(url).toMatch(/^\/icons\/nav\/.+\.(svg|webp)$/)
    }
  })

  it('getNavIconUrl does not resolve fun-facts key (removed from nav)', async () => {
    const { getNavIconUrl } = await import('@/app/iconRegistry')
    expect(getNavIconUrl('fun-facts')).toBeUndefined()
  })

  it('getNavIconUrl returns undefined for an unregistered key', async () => {
    const { getNavIconUrl } = await import('@/app/iconRegistry')
    expect(getNavIconUrl('unknown-nav-key')).toBeUndefined()
    expect(getNavIconUrl('')).toBeUndefined()
  })

  it('getAnimalIconUrl resolves registered animal IDs to /icons/animals/ URLs', async () => {
    const { getAnimalIconUrl } = await import('@/app/iconRegistry')
    const registeredIds = [
      'malayan-tiger',
      'hornbill',
      'orangutan',
      'tapir',
      'proboscis-monkey',
      'sun-bear',
      'sea-turtle',
      'pangolin',
      'mousedeer',
      'crocodile',
      'dugong',              // registered after initial SVG delivery
      'sea-turtle-hawksbill', // registered after initial SVG delivery
    ]
    for (const id of registeredIds) {
      const url = getAnimalIconUrl(id)
      expect(url).toBeDefined()
      expect(url).toMatch(/^\/icons\/animals\/.+\.(svg|gif|png|webp)$/)
    }
  })

  it('getAnimalIconUrl returns undefined for animals without a registered SVG (fallback to emoji)', async () => {
    const { getAnimalIconUrl } = await import('@/app/iconRegistry')
    // Only truly unregistered IDs should return undefined — all known animals
    // now have SVG assets. This guards against accidental registry gaps.
    expect(getAnimalIconUrl('nonexistent-animal')).toBeUndefined()
    expect(getAnimalIconUrl('')).toBeUndefined()
  })

  it('getAnimalIconUrl is stable: same ID always returns the same URL', async () => {
    const { getAnimalIconUrl } = await import('@/app/iconRegistry')
    const url1 = getAnimalIconUrl('malayan-tiger')
    const url2 = getAnimalIconUrl('malayan-tiger')
    expect(url1).toBe(url2)
  })
})


// ── Router: route paths ───────────────────────────────────────────────────────

describe('Router: routes render', () => {
  it('all canonical routes exist', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: defineComponent({ render: () => h('div', 'Home') }) },
        { path: '/discover', component: defineComponent({ render: () => h('div', 'Discover') }) },
        { path: '/games', component: defineComponent({ render: () => h('div', 'Games') }) },
        { path: '/games/eco-comics', component: defineComponent({ render: () => h('div', 'Eco-Comics') }) },
        { path: '/quiz', component: defineComponent({ render: () => h('div', 'Quiz') }) },
        { path: '/quiz/result', component: defineComponent({ render: () => h('div', 'Result') }) },
      ],
    })
    const paths = router.getRoutes().map((r) => r.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/discover')
    expect(paths).toContain('/games')
    expect(paths).toContain('/games/eco-comics')
    expect(paths).toContain('/quiz')
    expect(paths).toContain('/quiz/result')
    // /facts may exist as a redirect but not as a canonical named feature page
  })
})

// ── Mock data integrity ───────────────────────────────────────────────────────

describe('Mock data', () => {
  it('MOCK_ANIMALS has ≥10 animals with required fields', async () => {
    const { MOCK_ANIMALS } = await import('@/mocks/animals')
    expect(MOCK_ANIMALS.length).toBeGreaterThanOrEqual(10)
    for (const animal of MOCK_ANIMALS) {
      expect(animal.id).toBeTruthy()
      expect(animal.commonName).toBeTruthy()
      expect(animal.iconEmoji).toBeTruthy()
      expect(animal.mapPosition).toBeDefined()
      // Desktop position is required
      expect(animal.mapPosition.desktop.x).toBeGreaterThanOrEqual(0)
      expect(animal.mapPosition.desktop.y).toBeGreaterThanOrEqual(0)
      // Mobile position is optional; if present, must be valid
      if (animal.mapPosition.mobile) {
        expect(animal.mapPosition.mobile.x).toBeGreaterThanOrEqual(0)
        expect(animal.mapPosition.mobile.y).toBeGreaterThanOrEqual(0)
      }
      expect(Object.values(ConservationStatus)).toContain(animal.conservationStatus)
    }
  })

  it('MOCK_ANIMALS covers at least 3 different categories', async () => {
    const { MOCK_ANIMALS } = await import('@/mocks/animals')
    const categories = new Set(MOCK_ANIMALS.map((a) => a.category))
    expect(categories.size).toBeGreaterThanOrEqual(3)
  })

  it('MOCK_FUN_FACTS has ≥10 facts sorted correctly', async () => {
    const { MOCK_FUN_FACTS } = await import('@/mocks/funFacts')
    expect(MOCK_FUN_FACTS.length).toBeGreaterThanOrEqual(10)

    // Verify all facts have required fields
    for (const fact of MOCK_FUN_FACTS) {
      expect(fact.id).toBeTruthy()
      expect(fact.factText).toBeTruthy()
      expect(fact.animalId).toBeTruthy()
      expect(fact.unlockLevel).toBeGreaterThanOrEqual(1)
      expect(fact.animalName).toBeTruthy()
    }

    // Verify descending unlockLevel order (sorted)
    const sorted = [...MOCK_FUN_FACTS].sort((a, b) => b.unlockLevel - a.unlockLevel)
    expect(MOCK_FUN_FACTS.map((f) => f.id)).toEqual(sorted.map((f) => f.id))
  })

  it('MOCK_QUIZZES has ≥1 quiz with ≥5 questions, each with exactly 1 correct answer', async () => {
    const { MOCK_QUIZZES } = await import('@/mocks/quizzes')
    expect(MOCK_QUIZZES.length).toBeGreaterThanOrEqual(1)
    const quiz = MOCK_QUIZZES[0]!
    expect(quiz.questions.length).toBeGreaterThanOrEqual(5)
    for (const q of quiz.questions) {
      expect(q.answers.length).toBeGreaterThanOrEqual(2)
      const correctAnswers = q.answers.filter((a) => a.isCorrect)
      expect(correctAnswers).toHaveLength(1)
      expect(q.correctAnswerId).toBe(correctAnswers[0]!.id)
      expect(q.explanation).toBeTruthy()
    }
  })
})

// ── Pinia stores ──────────────────────────────────────────────────────────────

describe('Stores', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('progressStore initialises with 0 points at level 1', async () => {
    const { useProgressStore } = await import('@/stores/progressStore')
    const store = useProgressStore()
    expect(store.leafPoints).toBe(0)
    expect(store.level).toBe(1)
    expect(store.levelProgressPercent).toBeGreaterThanOrEqual(0)
  })

  it('progressStore.addPoints increases leafPoints', async () => {
    const { useProgressStore } = await import('@/stores/progressStore')
    const store = useProgressStore()
    await store.fetchProgress() // initialise from mock repo first
    const before = store.leafPoints
    await store.addPoints(50)
    expect(store.leafPoints).toBe(before + 50)
  })

  it('discoverStore initialises clean', async () => {
    const { useDiscoverStore } = await import('@/stores/discoverStore')
    const store = useDiscoverStore()
    expect(store.animals).toHaveLength(0)
    expect(store.selectedAnimal).toBeNull()
  })

  it('quizStore: selectAnswer marks correct answer as Correct', async () => {
    const { useQuizStore } = await import('@/stores/quizStore')
    const { MOCK_QUIZZES } = await import('@/mocks/quizzes')
    const store = useQuizStore()
    // Manually set active quiz for unit testing
    store.quizzes.push(...MOCK_QUIZZES)
    await store.startQuiz(MOCK_QUIZZES[0]!.id)

    const question = store.currentQuestion!
    const correctId = question.correctAnswerId
    store.selectAnswer(correctId)

    expect(store.currentAttempt?.result).toBe(QuizAnswerResult.Correct)
    expect(store.canProceed()).toBe(true)
  })

  it('quizStore: retry flow — wrong → retryQuestion → selectAnswer (correct)', async () => {
    const { useQuizStore } = await import('@/stores/quizStore')
    const { MOCK_QUIZZES } = await import('@/mocks/quizzes')
    const store = useQuizStore()
    store.quizzes.push(...MOCK_QUIZZES)
    await store.startQuiz(MOCK_QUIZZES[0]!.id)

    const question = store.currentQuestion!
    const wrongAnswer = question.answers.find((a) => !a.isCorrect)!
    const correctAnswer = question.answers.find((a) => a.isCorrect)!

    // First: wrong answer
    store.selectAnswer(wrongAnswer.id)
    expect(store.currentAttempt?.result).toBe(QuizAnswerResult.Wrong)
    expect(store.currentAttempt?.retriesUsed).toBe(0)
    expect(store.canProceed()).toBe(false) // retry available, not locked

    // Activate retry
    store.retryQuestion()
    expect(store.currentAttempt?.isRetrying).toBe(true)
    expect(store.canProceed()).toBe(false)

    // Second attempt: correct
    store.selectAnswer(correctAnswer.id)
    expect(store.currentAttempt?.result).toBe(QuizAnswerResult.Correct)
    expect(store.currentAttempt?.retriesUsed).toBe(1)
    expect(store.currentAttempt?.isRetrying).toBe(false)
    expect(store.canProceed()).toBe(true)
  })

  it('quizStore: retry flow — wrong → retry → wrong → canProceed + showExplanation', async () => {
    const { useQuizStore } = await import('@/stores/quizStore')
    const { MOCK_QUIZZES } = await import('@/mocks/quizzes')
    const store = useQuizStore()
    store.quizzes.push(...MOCK_QUIZZES)
    await store.startQuiz(MOCK_QUIZZES[0]!.id)

    const question = store.currentQuestion!
    const wrongAnswer = question.answers.find((a) => !a.isCorrect)!

    store.selectAnswer(wrongAnswer.id)
    store.retryQuestion()
    store.selectAnswer(wrongAnswer.id) // wrong again

    expect(store.currentAttempt?.result).toBe(QuizAnswerResult.Wrong)
    expect(store.currentAttempt?.retriesUsed).toBe(1)
    // canProceed should be true because retries are exhausted
    expect(store.canProceed()).toBe(true)
  })

  it('quizStore: calculatePoints gives bonus for perfect score', async () => {
    const { calculatePoints } = await import('@/stores/quizStore')
    const pts = calculatePoints(5, 5, 20, 20)
    expect(pts).toBe(120) // 5*20 + 20 bonus

    const partialPts = calculatePoints(3, 5, 20, 20)
    expect(partialPts).toBe(60) // 3*20 + 0 bonus
  })

  it('funFactStore: does not expose like/toggle APIs', async () => {
    const { useFunFactStore } = await import('@/stores/funFactStore')
    const store = useFunFactStore()
    expect(store).not.toHaveProperty('toggleLike')
  })

  it('funFactStore: sortedAnimals sorts animals alphabetically', async () => {
    const { useFunFactStore } = await import('@/stores/funFactStore')
    const store = useFunFactStore()
    // Inject mock animal data directly
    store.animalList.push(
      { listKey: 'z', backendId: '1', commonName: 'Zebra', scientificName: 'Equus quagga', category: 'mammals' as any, conservationStatus: 'least_concern' as any, iconEmoji: '🦓' },
      { listKey: 'a', backendId: '2', commonName: 'Aardvark', scientificName: 'Orycteropus afer', category: 'mammals' as any, conservationStatus: 'least_concern' as any, iconEmoji: '🐾' },
    )
    const sorted = store.sortedAnimals
    expect(sorted[0]!.commonName).toBe('Aardvark')
    expect(sorted[1]!.commonName).toBe('Zebra')
  })
})

// ── quizStore: stale completed-run regression ─────────────────────────────────
//
// Regression tests for the bug where returning to /quiz after completing a quiz
// would show the stale active-quiz UI instead of the fresh start screen.
// Root cause: finishQuiz() left `activeQuiz` set; QuizPage checks `!activeQuiz`
// to decide which view to render.
//
// Fix: prepareForQuizEntry() — call on QuizPage onMounted.
// – Completed run (isFinished true)  → resetQuiz() so start screen appears.
// – In-progress run (isFinished false) → state preserved (no accidental reset).

describe('quizStore: stale completed-run state (regression)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('prepareForQuizEntry resets completed-run so /quiz shows fresh start screen', async () => {
    const { useQuizStore } = await import('@/stores/quizStore')
    const { MOCK_QUIZZES } = await import('@/mocks/quizzes')
    const store = useQuizStore()

    store.quizzes.push(...MOCK_QUIZZES)
    await store.startQuiz(MOCK_QUIZZES[0]!.id)

    // Manually simulate a completed run (mirrors what finishQuiz() produces)
    store.isFinished = true
    store.lastResult = {
      quizId: MOCK_QUIZZES[0]!.id,
      score: 3,
      totalQuestions: MOCK_QUIZZES[0]!.questions.length,
      pointsEarned: 60,
      attempts: [],
      completedAt: new Date(),
    }

    // Pre-condition: activeQuiz is still set (the stale state that caused the bug)
    expect(store.activeQuiz).not.toBeNull()
    expect(store.isFinished).toBe(true)
    expect(store.lastResult).not.toBeNull()

    // Re-enter /quiz (e.g. from Discover → Take Quiz, or Nav → Quiz)
    store.prepareForQuizEntry()

    // Post-condition: start screen should appear (activeQuiz null)
    expect(store.activeQuiz).toBeNull()
    expect(store.isFinished).toBe(false)
    expect(store.lastResult).toBeNull()
    expect(store.attempts).toHaveLength(0)
    expect(store.currentQuestionIndex).toBe(0)
  })

  it('prepareForQuizEntry preserves in-progress quiz state when not finished', async () => {
    const { useQuizStore } = await import('@/stores/quizStore')
    const { MOCK_QUIZZES } = await import('@/mocks/quizzes')
    const store = useQuizStore()

    store.quizzes.push(...MOCK_QUIZZES)
    await store.startQuiz(MOCK_QUIZZES[0]!.id)

    // Answer the first question only — quiz is mid-run, not finished
    const q = store.currentQuestion!
    store.selectAnswer(q.correctAnswerId)

    expect(store.isFinished).toBe(false)
    expect(store.activeQuiz).not.toBeNull()
    expect(store.attempts).toHaveLength(1)

    // Re-enter /quiz — in-progress state must NOT be destroyed
    store.prepareForQuizEntry()

    expect(store.activeQuiz).not.toBeNull()
    expect(store.isFinished).toBe(false)
    expect(store.attempts).toHaveLength(1)
  })

  it('hasCompletedRun reflects quiz lifecycle correctly', async () => {
    const { useQuizStore } = await import('@/stores/quizStore')
    const { MOCK_QUIZZES } = await import('@/mocks/quizzes')
    const store = useQuizStore()

    store.quizzes.push(...MOCK_QUIZZES)
    await store.startQuiz(MOCK_QUIZZES[0]!.id)

    // Fresh start — no completed run
    expect(store.hasCompletedRun).toBe(false)

    // Simulate a completed run
    store.isFinished = true
    store.lastResult = {
      quizId: MOCK_QUIZZES[0]!.id,
      score: 5,
      totalQuestions: 5,
      pointsEarned: 120,
      attempts: [],
      completedAt: new Date(),
    }

    expect(store.hasCompletedRun).toBe(true)

    // After quiz-entry normalisation, completed run is gone
    store.prepareForQuizEntry()
    expect(store.hasCompletedRun).toBe(false)
  })

  it('playAgain path (resetQuiz) still clears state correctly', async () => {
    const { useQuizStore } = await import('@/stores/quizStore')
    const { MOCK_QUIZZES } = await import('@/mocks/quizzes')
    const store = useQuizStore()

    store.quizzes.push(...MOCK_QUIZZES)
    await store.startQuiz(MOCK_QUIZZES[0]!.id)

    store.isFinished = true
    store.lastResult = {
      quizId: MOCK_QUIZZES[0]!.id,
      score: 4,
      totalQuestions: 5,
      pointsEarned: 80,
      attempts: [],
      completedAt: new Date(),
    }

    // The result page's "Play Again" button calls resetQuiz() then navigates to /quiz
    store.resetQuiz()

    // prepareForQuizEntry then runs on mount — should be idempotent (already clean)
    store.prepareForQuizEntry()

    expect(store.activeQuiz).toBeNull()
    expect(store.isFinished).toBe(false)
    expect(store.lastResult).toBeNull()
  })
})

// ── discoverStore: filtering + grid/map dataset consistency ───────────────────

describe('discoverStore: filtering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loads all animals and filteredAnimals returns all when category is All', async () => {
    const { useDiscoverStore } = await import('@/stores/discoverStore')
    const { AnimalCategory } = await import('@/domain/enums')
    const store = useDiscoverStore()
    await store.fetchAnimals()
    await store.setCategory(AnimalCategory.All)

    expect(store.animals.length).toBeGreaterThan(0)
    expect(store.filteredAnimals).toHaveLength(store.animals.length)
  })

  it('filteredAnimals returns subset when category is specific', async () => {
    const { useDiscoverStore } = await import('@/stores/discoverStore')
    const { AnimalCategory } = await import('@/domain/enums')
    const store = useDiscoverStore()
    await store.fetchAnimals()

    await store.setCategory(AnimalCategory.Mammals)
    expect(store.filteredAnimals.length).toBeGreaterThan(0)
    expect(store.animals.length).toBe(store.filteredAnimals.length)
    // All returned animals must be mammals (server-paginated slice for the active category)
    for (const a of store.filteredAnimals) {
      expect(a.category).toBe(AnimalCategory.Mammals)
    }
  })

  it('openOccurrencesMap and close transitions activeView correctly', async () => {
    const { useDiscoverStore } = await import('@/stores/discoverStore')
    const store = useDiscoverStore()

    expect(store.activeView).toBe('list')

    await store.fetchAnimals()
    const first = store.animals[0]!
    await store.openAnimalProfile(first)
    expect(store.activeView).toBe('detail')

    await store.openOccurrencesMap()
    expect(store.activeView).toBe('map')

    store.closeOccurrencesMap()
    expect(store.activeView).toBe('detail')
  })

  it('openAnimalProfile sets selectedAnimal and activeView', async () => {
    const { useDiscoverStore } = await import('@/stores/discoverStore')
    const store = useDiscoverStore()
    await store.fetchAnimals()

    const first = store.animals[0]!
    await store.openAnimalProfile(first)
    expect(store.selectedAnimal?.id).toBe(first.backendId)
    expect(store.activeView).toBe('detail')

    store.closeAnimalProfile()
    expect(store.selectedAnimal).toBeNull()
    expect(store.activeView).toBe('list')
  })

  it('filteredAnimals updates reactively when category changes', async () => {
    const { useDiscoverStore } = await import('@/stores/discoverStore')
    const { AnimalCategory } = await import('@/domain/enums')
    const store = useDiscoverStore()
    await store.fetchAnimals()

    await store.setCategory(AnimalCategory.All)
    const allCount = store.filteredAnimals.length

    await store.setCategory(AnimalCategory.Mammals)
    const mammalCount = store.filteredAnimals.length

    // Mammals should be ≤ all (assuming there are some non-mammal animals)
    expect(mammalCount).toBeLessThanOrEqual(allCount)

    // Switching back returns the full list
    await store.setCategory(AnimalCategory.All)
    expect(store.filteredAnimals.length).toBe(allCount)
  })
})

// ── Domain: session models ─────────────────────────────────────────────────────

describe('Domain: session models', () => {
  it('generateSafeNickname returns a non-empty two-word string', async () => {
    const { generateSafeNickname } = await import('@/app/config')
    const nickname = generateSafeNickname()
    expect(nickname).toBeTruthy()
    expect(nickname.trim().split(' ')).toHaveLength(2)
  })

  it('STORAGE_KEYS has PROFILES and ACTIVE_SESSION', async () => {
    const { STORAGE_KEYS } = await import('@/app/config')
    expect(STORAGE_KEYS.PROFILES).toBeTruthy()
    expect(STORAGE_KEYS.ACTIVE_SESSION).toBeTruthy()
  })

  it('ROUTE_NAMES includes welcome route', async () => {
    const { ROUTE_NAMES } = await import('@/app/config')
    expect(ROUTE_NAMES.welcome).toBe('welcome')
  })
})

// ── MockProfileRepository ─────────────────────────────────────────────────────

describe('MockProfileRepository', () => {
  beforeEach(() => {
    // Clear localStorage between tests
    localStorage.clear()
  })

  it('listProfiles returns empty array when no profiles exist', async () => {
    const { MockProfileRepository } = await import(
      '@/repositories/mock/mockProfileRepository'
    )
    const repo = new MockProfileRepository()
    const profiles = await repo.listProfiles()
    expect(profiles).toHaveLength(0)
  })

  it('createProfile returns a profile with a UUID id and correct defaults', async () => {
    const { MockProfileRepository } = await import(
      '@/repositories/mock/mockProfileRepository'
    )
    const repo = new MockProfileRepository()
    const response = await repo.createProfile({
      displayNickname: 'Brave Panda',
      animalId: 'sun-bear',
      animalVisualKey: 'sun-bear',
    })
    const profile = response.profile
    expect(profile.profileId).toBeTruthy()
    expect(profile.displayNickname).toBe('Brave Panda')
    expect(profile.animalId).toBe('sun-bear')
    expect(profile.animalVisualKey).toBe('sun-bear')
    expect(profile.leafPoints).toBe(0)
    expect(profile.level).toBe(1)
    expect(profile.guardianBackupLinked).toBe(false)
  })

  it('createProfile persists across repository instances (via localStorage)', async () => {
    const { MockProfileRepository } = await import(
      '@/repositories/mock/mockProfileRepository'
    )
    const repoA = new MockProfileRepository()
    const response = await repoA.createProfile({
      displayNickname: 'Happy Tiger',
      animalId: 'malayan-tiger',
      animalVisualKey: 'malayan-tiger',
    })
    const created = response.profile

    const repoB = new MockProfileRepository()
    const profiles = await repoB.listProfiles()
    expect(profiles.some((p) => p.profileId === created.profileId)).toBe(true)
  })

  it('getProfile returns null for unknown id', async () => {
    const { MockProfileRepository } = await import(
      '@/repositories/mock/mockProfileRepository'
    )
    const repo = new MockProfileRepository()
    expect(await repo.getProfile('nonexistent')).toBeNull()
  })

  it('updateProfileProgress updates and returns the updated profile', async () => {
    const { MockProfileRepository } = await import(
      '@/repositories/mock/mockProfileRepository'
    )
    const repo = new MockProfileRepository()
    const response = await repo.createProfile({
      displayNickname: 'Jolly Fox',
      animalId: 'proboscis-monkey',
      animalVisualKey: 'proboscis-monkey',
    })
    const created = response.profile
    const updated = await repo.updateProfileProgress(created.profileId, { leafPoints: 200 })
    expect(updated.leafPoints).toBe(200)
  })

  it('deleteProfile removes the profile', async () => {
    const { MockProfileRepository } = await import(
      '@/repositories/mock/mockProfileRepository'
    )
    const repo = new MockProfileRepository()
    const response = await repo.createProfile({
      displayNickname: 'Wild Hawk',
      animalId: 'hornbill',
      animalVisualKey: 'hornbill',
    })
    const created = response.profile
    await repo.deleteProfile(created.profileId)
    const profiles = await repo.listProfiles()
    expect(profiles.some((p) => p.profileId === created.profileId)).toBe(false)
  })

  it('migrates legacy avatarKey-only profiles on load and re-saves without avatarKey', async () => {
    const { storageService } = await import('@/services/storageService')
    const { STORAGE_KEYS } = await import('@/app/config')
    const now = new Date().toISOString()
    storageService.set(STORAGE_KEYS.PROFILES, [
      {
        profileId: 'legacy-1',
        displayNickname: 'Old Tiger',
        avatarKey: 'tiger',
        leafPoints: 5,
        level: 1,
        levelTitle: 'Nature Newbie',
        createdAt: now,
        lastActiveAt: now,
        guardianBackupLinked: false,
      },
    ])
    const { MockProfileRepository } = await import('@/repositories/mock/mockProfileRepository')
    const repo = new MockProfileRepository()
    const list = await repo.listProfiles()
    expect(list[0]!.animalId).toBe('malayan-tiger')
    expect(list[0]!.animalVisualKey).toBe('malayan-tiger')
    const raw = storageService.get<Array<Record<string, unknown>>>(STORAGE_KEYS.PROFILES)
    expect(raw?.[0]?.avatarKey).toBeUndefined()
  })
})

// ── MockSessionRepository ─────────────────────────────────────────────────────

describe('MockSessionRepository', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('bootstrapSession returns choosing state when no session stored', async () => {
    const { MockSessionRepository } = await import(
      '@/repositories/mock/mockSessionRepository'
    )
    const repo = new MockSessionRepository()
    const result = await repo.bootstrapSession()
    expect(result.state).toBe('choosing')
    expect(result.profile).toBeNull()
  })

  it('bootstrapSession returns active state when session + profile exist', async () => {
    const { MockProfileRepository } = await import(
      '@/repositories/mock/mockProfileRepository'
    )
    const { MockSessionRepository } = await import(
      '@/repositories/mock/mockSessionRepository'
    )
    const profileRepo = new MockProfileRepository()
    const sessionRepo = new MockSessionRepository()

    const response = await profileRepo.createProfile({
      displayNickname: 'Sunny Cloud',
      animalId: 'proboscis-monkey',
      animalVisualKey: 'proboscis-monkey',
    })
    const profile = response.profile
    await sessionRepo.setActiveSession(profile.profileId)

    const result = await sessionRepo.bootstrapSession()
    expect(result.state).toBe('active')
    expect(result.profile?.profileId).toBe(profile.profileId)
  })

  it('bootstrapSession returns choosing when session references deleted profile', async () => {
    const { MockSessionRepository } = await import(
      '@/repositories/mock/mockSessionRepository'
    )
    const { storageService } = await import('@/services/storageService')
    const { STORAGE_KEYS } = await import('@/app/config')
    const repo = new MockSessionRepository()

    // Manually plant a session that references a non-existent profile
    storageService.set(STORAGE_KEYS.ACTIVE_SESSION, {
      profileId: 'ghost-profile-id',
      restoredAt: new Date().toISOString(),
    })

    const result = await repo.bootstrapSession()
    expect(result.state).toBe('choosing')
    expect(result.profile).toBeNull()
  })

  it('clearSession removes stored session', async () => {
    const { MockSessionRepository } = await import(
      '@/repositories/mock/mockSessionRepository'
    )
    const repo = new MockSessionRepository()
    await repo.setActiveSession('some-profile-id')
    await repo.clearSession()
    const session = await repo.getActiveSession()
    expect(session).toBeNull()
  })
})

// ── Session store ──────────────────────────────────────────────────────────────

describe('sessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('bootstrapSession → choosing when no stored session', async () => {
    const { useSessionStore } = await import('@/stores/sessionStore')
    const store = useSessionStore()
    await store.bootstrapSession()
    expect(store.isReady).toBe(true)
    expect(store.sessionState).toBe('choosing')
    expect(store.hasActiveSession).toBe(false)
  })

  it('bootstrapSession → active when stored session exists', async () => {
    // Set up profile + session in localStorage first
    const { MockProfileRepository } = await import(
      '@/repositories/mock/mockProfileRepository'
    )
    const { MockSessionRepository } = await import(
      '@/repositories/mock/mockSessionRepository'
    )
    const profileRepo = new MockProfileRepository()
    const sessionRepo = new MockSessionRepository()
    const response = await profileRepo.createProfile({
      displayNickname: 'Brave Storm',
      animalId: 'malayan-tiger',
      animalVisualKey: 'malayan-tiger',
    })
    const profile = response.profile
    await sessionRepo.setActiveSession(profile.profileId)

    const { useSessionStore } = await import('@/stores/sessionStore')
    const store = useSessionStore()
    await store.bootstrapSession()

    expect(store.sessionState).toBe('active')
    expect(store.hasActiveSession).toBe(true)
    expect(store.activeProfile?.displayNickname).toBe('Brave Storm')
  })
})

// ── Profile store ──────────────────────────────────────────────────────────────

describe('profileStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('createProfile adds to list and activates session', async () => {
    const { useProfileStore } = await import('@/stores/profileStore')
    const { useSessionStore } = await import('@/stores/sessionStore')
    const profileStore = useProfileStore()
    const sessionStore = useSessionStore()

    const response = await profileStore.createProfile({
      displayNickname: 'Cosmic Maple',
      animalId: 'hornbill',
      animalVisualKey: 'hornbill',
    })
    const profile = response.profile

    expect(profileStore.profiles).toHaveLength(1)
    expect(profileStore.profiles[0]!.profileId).toBe(profile.profileId)
    expect(sessionStore.hasActiveSession).toBe(true)
    expect(sessionStore.activeProfile?.displayNickname).toBe('Cosmic Maple')
  })

  it('deleteProfile removes from list', async () => {
    const { useProfileStore } = await import('@/stores/profileStore')
    const profileStore = useProfileStore()
    const response = await profileStore.createProfile({
      displayNickname: 'Swift River',
      animalId: 'leatherback-sea-turtle',
      animalVisualKey: 'leatherback-sea-turtle',
    })
    const profile = response.profile
    await profileStore.deleteProfile(profile.profileId)
    expect(profileStore.profiles.some((p) => p.profileId === profile.profileId)).toBe(false)
  })
})

// ── Progress isolation ─────────────────────────────────────────────────────────

describe('Progress isolation per profile', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('two profiles have independent leaf points', async () => {
    const { useProfileStore } = await import('@/stores/profileStore')
    const { useSessionStore } = await import('@/stores/sessionStore')
    const profileStore = useProfileStore()
    const sessionStore = useSessionStore()

    // Create profile A
    const responseA = await profileStore.createProfile({
      displayNickname: 'Daring Finch',
      animalId: 'pangolin',
      animalVisualKey: 'pangolin',
    })
    const profileA = responseA.profile

    // Give profile A 100 points
    await profileStore.updateProgress(profileA.profileId, { leafPoints: 100 })

    // Create profile B (auto-activates)
    await profileStore.createProfile({
      displayNickname: 'Noble Cedar',
      animalId: 'sun-bear',
      animalVisualKey: 'sun-bear',
    })

    // Profile B should have 0 points
    expect(sessionStore.activeProfile?.leafPoints).toBe(0)

    // Switch back to A
    await profileStore.switchToProfile(profileA.profileId)
    expect(sessionStore.activeProfile?.leafPoints).toBe(100)
  })
})

// ── Router: /welcome route exists ─────────────────────────────────────────────

describe('Router: welcome route', () => {
  it('/welcome route is registered', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: defineComponent({ render: () => h('div', 'Home') }) },
        { path: '/welcome', name: 'welcome', component: defineComponent({ render: () => h('div', 'Welcome') }) },
        { path: '/discover', component: defineComponent({ render: () => h('div', 'Discover') }) },
        { path: '/games', component: defineComponent({ render: () => h('div', 'Games') }) },
        { path: '/games/eco-comics', component: defineComponent({ render: () => h('div', 'Eco-Comics') }) },
        { path: '/quiz', component: defineComponent({ render: () => h('div', 'Quiz') }) },
        { path: '/quiz/result', component: defineComponent({ render: () => h('div', 'Result') }) },
      ],
    })
    const paths = router.getRoutes().map((r) => r.path)
    expect(paths).toContain('/welcome')
    expect(paths).toContain('/')
    expect(paths).toContain('/discover')
    expect(paths).toContain('/games')
    expect(paths).toContain('/games/eco-comics')
    expect(paths).toContain('/quiz')
    expect(paths).toContain('/quiz/result')
  })
})

// ── progressStore: session-aware isolation (real store flows) ─────────────────
// These tests prove that addPoints / recordAnimalVisit / recordQuizVisit
// stay isolated between profiles when routed through the actual store,
// not just via direct repository patching.

describe('progressStore: session-aware isolation via real store flows', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('addPoints does NOT bleed into a second profile', async () => {
    const { useProfileStore } = await import('@/stores/profileStore')
    const { useProgressStore } = await import('@/stores/progressStore')
    const { useSessionStore } = await import('@/stores/sessionStore')

    const profileStore = useProfileStore()
    const progressStore = useProgressStore()
    const sessionStore = useSessionStore()

    // Create profile A — gets activated automatically
    await profileStore.createProfile({
      displayNickname: 'Brave Tiger',
      animalId: 'malayan-tiger',
      animalVisualKey: 'malayan-tiger',
    })
    expect(sessionStore.activeProfile?.leafPoints).toBe(0)

    // Add points via progressStore (session-active path)
    await progressStore.addPoints(100)
    expect(progressStore.leafPoints).toBe(100)
    expect(sessionStore.activeProfile?.leafPoints).toBe(100)

    // Create profile B — now active, B starts at 0
    await profileStore.createProfile({
      displayNickname: 'Calm Panda',
      animalId: 'sun-bear',
      animalVisualKey: 'sun-bear',
    })
    expect(sessionStore.activeProfile?.displayNickname).toBe('Calm Panda')
    expect(progressStore.leafPoints).toBe(0)
    expect(sessionStore.activeProfile?.leafPoints).toBe(0)

    // Add points to B via progressStore — should not touch A
    await progressStore.addPoints(50)
    expect(progressStore.leafPoints).toBe(50)
  })

  it('addPoints accumulates correctly on same profile without singleton pollution', async () => {
    const { useProfileStore } = await import('@/stores/profileStore')
    const { useProgressStore } = await import('@/stores/progressStore')

    const profileStore = useProfileStore()
    const progressStore = useProgressStore()

    await profileStore.createProfile({
      displayNickname: 'Swift Hawk',
      animalId: 'hornbill',
      animalVisualKey: 'hornbill',
    })

    await progressStore.addPoints(20)
    expect(progressStore.leafPoints).toBe(20)

    await progressStore.addPoints(20)
    expect(progressStore.leafPoints).toBe(40)

    // Points are persisted — verify via profile
    const { useSessionStore } = await import('@/stores/sessionStore')
    const sessionStore = useSessionStore()
    expect(sessionStore.activeProfile?.leafPoints).toBe(40)
  })

  it('recordAnimalVisit stays isolated between profiles', async () => {
    const { useProfileStore } = await import('@/stores/profileStore')
    const { useProgressStore } = await import('@/stores/progressStore')
    const { useSessionStore } = await import('@/stores/sessionStore')

    const profileStore = useProfileStore()
    const progressStore = useProgressStore()
    const sessionStore = useSessionStore()

    // Profile A visits the Tapir
    const responseA = await profileStore.createProfile({
      displayNickname: 'Fuzzy Bear',
      animalId: 'sun-bear',
      animalVisualKey: 'sun-bear',
    })
    const profileA = responseA.profile
    await progressStore.recordAnimalVisit('animal-001', 'Malayan Tapir')
    expect(progressStore.progress?.lastAnimalName).toBe('Malayan Tapir')
    // Persisted to profile A
    expect(sessionStore.activeProfile?.lastAnimalName).toBe('Malayan Tapir')

    // Switch to profile B (no animal visits)
    const responseB = await profileStore.createProfile({
      displayNickname: 'Jolly Otter',
      animalId: 'leatherback-sea-turtle',
      animalVisualKey: 'leatherback-sea-turtle',
    })
    const profileB = responseB.profile
    expect(progressStore.progress?.lastAnimalName).toBeUndefined()
    expect(sessionStore.activeProfile?.lastAnimalName).toBeUndefined()

    // Profile B visits the Hornbill
    await progressStore.recordAnimalVisit('animal-002', 'Rhinoceros Hornbill')
    expect(progressStore.progress?.lastAnimalName).toBe('Rhinoceros Hornbill')

    // Switch back to A — should still have Tapir
    await profileStore.switchToProfile(profileA.profileId)
    expect(progressStore.progress?.lastAnimalName).toBe('Malayan Tapir')
    expect(sessionStore.activeProfile?.lastAnimalName).toBe('Malayan Tapir')

    // Switch to B — should have Hornbill
    await profileStore.switchToProfile(profileB.profileId)
    expect(progressStore.progress?.lastAnimalName).toBe('Rhinoceros Hornbill')
  })

  it('recordQuizVisit stays isolated between profiles', async () => {
    const { useProfileStore } = await import('@/stores/profileStore')
    const { useProgressStore } = await import('@/stores/progressStore')
    const { useSessionStore } = await import('@/stores/sessionStore')

    const profileStore = useProfileStore()
    const progressStore = useProgressStore()
    const sessionStore = useSessionStore()

    // Profile A takes a quiz
    const responseA = await profileStore.createProfile({
      displayNickname: 'Speedy Fox',
      animalId: 'proboscis-monkey',
      animalVisualKey: 'proboscis-monkey',
    })
    const profileA = responseA.profile
    await progressStore.recordQuizVisit('Rainforest Birds Quiz')
    expect(progressStore.progress?.lastQuizTitle).toBe('Rainforest Birds Quiz')
    expect(sessionStore.activeProfile?.lastQuizTitle).toBe('Rainforest Birds Quiz')

    // Profile B — no quizzes yet
    const responseB = await profileStore.createProfile({
      displayNickname: 'Bold Turtle',
      animalId: 'leatherback-sea-turtle',
      animalVisualKey: 'leatherback-sea-turtle',
    })
    const profileB = responseB.profile
    expect(progressStore.progress?.lastQuizTitle).toBeUndefined()

    // B takes a different quiz
    await progressStore.recordQuizVisit('Marine Life Quiz')
    expect(progressStore.progress?.lastQuizTitle).toBe('Marine Life Quiz')

    // Switch to A — still has Rainforest Birds Quiz
    await profileStore.switchToProfile(profileA.profileId)
    expect(progressStore.progress?.lastQuizTitle).toBe('Rainforest Birds Quiz')

    // Switch to B — still has Marine Life Quiz
    await profileStore.switchToProfile(profileB.profileId)
    expect(progressStore.progress?.lastQuizTitle).toBe('Marine Life Quiz')
  })

  it('level calculation stays correct per profile after addPoints', async () => {
    const { useProfileStore } = await import('@/stores/profileStore')
    const { useProgressStore } = await import('@/stores/progressStore')

    const profileStore = useProfileStore()
    const progressStore = useProgressStore()

    await profileStore.createProfile({
      displayNickname: 'Daring Cloud',
      animalId: 'pangolin',
      animalVisualKey: 'pangolin',
    })

    // Level 1 at 0 pts
    expect(progressStore.level).toBe(1)

    // Add enough for level 2 (200 pts threshold)
    await progressStore.addPoints(200)
    expect(progressStore.leafPoints).toBe(200)
    expect(progressStore.level).toBe(2)
    expect(progressStore.levelTitle).not.toBe('Nature Newbie')
  })
})

// ── End-to-end: profile A → earn progress → switch B → verify isolated ────────

describe('E2E: shared-device profile isolation flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('full flow: profile A earns points + animal + quiz; profile B starts empty; switch back restores A', async () => {
    const { useProfileStore } = await import('@/stores/profileStore')
    const { useProgressStore } = await import('@/stores/progressStore')
    const { useSessionStore } = await import('@/stores/sessionStore')

    const profileStore = useProfileStore()
    const progressStore = useProgressStore()
    const sessionStore = useSessionStore()

    // === Profile A setup ===
    const responseA = await profileStore.createProfile({
      displayNickname: 'Cosmic Sage',
      animalId: 'hornbill',
    })
    const profileA = responseA.profile

    // Earn progress on A
    await progressStore.addPoints(120)
    await progressStore.recordAnimalVisit('animal-101', 'Proboscis Monkey')
    await progressStore.recordQuizVisit('Malaysian Mammals Quiz')

    // Assert A's state
    expect(progressStore.leafPoints).toBe(120)
    expect(progressStore.progress?.lastAnimalName).toBe('Proboscis Monkey')
    expect(progressStore.progress?.lastQuizTitle).toBe('Malaysian Mammals Quiz')
    expect(sessionStore.activeProfile?.profileId).toBe(profileA.profileId)

    // === Create Profile B (auto-switches) ===
    const responseB = await profileStore.createProfile({
      displayNickname: 'Gentle Fern',
      animalId: 'proboscis-monkey',
    })
    const profileB = responseB.profile
    expect(sessionStore.activeProfile?.profileId).toBe(profileB.profileId)

    // B starts completely empty
    expect(progressStore.leafPoints).toBe(0)
    expect(progressStore.progress?.lastAnimalName).toBeUndefined()
    expect(progressStore.progress?.lastQuizTitle).toBeUndefined()

    // B earns some progress too
    await progressStore.addPoints(30)
    await progressStore.recordAnimalVisit('animal-202', 'Clouded Leopard')

    // === Switch back to A ===
    await profileStore.switchToProfile(profileA.profileId)
    expect(sessionStore.activeProfile?.profileId).toBe(profileA.profileId)

    // A's progress is intact and isolated from B
    expect(progressStore.leafPoints).toBe(120)
    expect(progressStore.progress?.lastAnimalName).toBe('Proboscis Monkey')
    expect(progressStore.progress?.lastQuizTitle).toBe('Malaysian Mammals Quiz')

    // === Switch back to B ===
    await profileStore.switchToProfile(profileB.profileId)
    expect(progressStore.leafPoints).toBe(30)
    expect(progressStore.progress?.lastAnimalName).toBe('Clouded Leopard')
    expect(progressStore.progress?.lastQuizTitle).toBeUndefined()
  })

  it('session restoration after bootstrap on same device', async () => {
    const { useProfileStore } = await import('@/stores/profileStore')
    const { useProgressStore } = await import('@/stores/progressStore')

    const profileStore = useProfileStore()
    const progressStore = useProgressStore()

    const responseA = await profileStore.createProfile({
      displayNickname: 'Loyal Maple',
      animalId: 'proboscis-monkey',
      animalVisualKey: 'proboscis-monkey',
    })
    const profileA = responseA.profile
    await progressStore.addPoints(80)
    await progressStore.recordAnimalVisit('animal-303', 'Malayan Sun Bear')

    // Simulate app reload — create fresh Pinia but same localStorage
    setActivePinia(createPinia())

    const { useSessionStore } = await import('@/stores/sessionStore')
    const freshSession = useSessionStore()
    await freshSession.bootstrapSession()

    // Session restored
    expect(freshSession.hasActiveSession).toBe(true)
    expect(freshSession.activeProfile?.profileId).toBe(profileA.profileId)
    expect(freshSession.activeProfile?.leafPoints).toBe(80)
    expect(freshSession.activeProfile?.lastAnimalName).toBe('Malayan Sun Bear')
  })
})

// ── Discover: map config ───────────────────────────────────────────────────────

describe('Discover: DISCOVER_MAP_CONFIG', () => {
  it('exposes desktop and mobile asset paths containing correct keywords', async () => {
    const { DISCOVER_MAP_CONFIG } = await import('@/app/config')
    expect(DISCOVER_MAP_CONFIG.desktopAsset).toContain('desktop')
    expect(DISCOVER_MAP_CONFIG.mobileAsset).toContain('mobile')
  })

  it('has valid CSS aspect-ratio strings', async () => {
    const { DISCOVER_MAP_CONFIG } = await import('@/app/config')
    expect(DISCOVER_MAP_CONFIG.desktopAspectRatio).toMatch(/\d+ \/ \d+/)
    expect(DISCOVER_MAP_CONFIG.mobileAspectRatio).toMatch(/\d+ \/ \d+/)
  })

  it('mobileBreakpoint is a positive number below 2000', async () => {
    const { DISCOVER_MAP_CONFIG } = await import('@/app/config')
    expect(DISCOVER_MAP_CONFIG.mobileBreakpoint).toBeGreaterThan(0)
    expect(DISCOVER_MAP_CONFIG.mobileBreakpoint).toBeLessThan(2000)
  })

  it('getMarkerSpriteUrl returns correct path for a known key', async () => {
    const { getMarkerSpriteUrl } = await import('@/app/config')
    expect(getMarkerSpriteUrl('tiger')).toBe('/sprites/tiger.png')
  })

  it('getMarkerSpriteUrl returns undefined for empty/absent key', async () => {
    const { getMarkerSpriteUrl } = await import('@/app/config')
    expect(getMarkerSpriteUrl(undefined)).toBeUndefined()
    expect(getMarkerSpriteUrl('')).toBeUndefined()
  })
})

// ── Discover: animal mapPosition model ────────────────────────────────────────

describe('Discover: mapPosition model', () => {
  it('all MOCK_ANIMALS have required desktop position in 0-100 range', async () => {
    const { MOCK_ANIMALS } = await import('@/mocks/animals')
    for (const animal of MOCK_ANIMALS) {
      expect(animal.mapPosition.desktop.x).toBeGreaterThanOrEqual(0)
      expect(animal.mapPosition.desktop.x).toBeLessThanOrEqual(100)
      expect(animal.mapPosition.desktop.y).toBeGreaterThanOrEqual(0)
      expect(animal.mapPosition.desktop.y).toBeLessThanOrEqual(100)
    }
  })

  it('all MOCK_ANIMALS have explicit mobile position (no fallback reliance)', async () => {
    const { MOCK_ANIMALS } = await import('@/mocks/animals')
    for (const animal of MOCK_ANIMALS) {
      expect(animal.mapPosition.mobile).toBeDefined()
      expect(animal.mapPosition.mobile!.x).toBeGreaterThanOrEqual(0)
      expect(animal.mapPosition.mobile!.y).toBeGreaterThanOrEqual(0)
    }
  })

  it('desktop and mobile positions differ (map compositions are truly adapted)', async () => {
    const { MOCK_ANIMALS } = await import('@/mocks/animals')
    const adapted = MOCK_ANIMALS.filter(
      (a) =>
        a.mapPosition.mobile &&
        (a.mapPosition.mobile.x !== a.mapPosition.desktop.x ||
          a.mapPosition.mobile.y !== a.mapPosition.desktop.y),
    )
    expect(adapted.length).toBeGreaterThan(0)
  })

  it('every MOCK_ANIMAL has a markerSpriteKey', async () => {
    const { MOCK_ANIMALS } = await import('@/mocks/animals')
    for (const animal of MOCK_ANIMALS) {
      expect(animal.markerSpriteKey).toBeTruthy()
    }
  })
})

// ── Discover: store filter + selection ────────────────────────────────────────

describe('Discover: store filter and selection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('filteredAnimals reflects the active category', async () => {
    const { useDiscoverStore } = await import('@/stores/discoverStore')
    const { AnimalCategory } = await import('@/domain/enums')
    const store = useDiscoverStore()
    await store.fetchAnimals()

    await store.setCategory(AnimalCategory.All)
    expect(store.totalCount).toBeGreaterThanOrEqual(10)
    const allPageLen = store.filteredAnimals.length
    expect(allPageLen).toBeGreaterThan(0)

    await store.setCategory(AnimalCategory.Mammals)
    expect(store.filteredAnimals.length).toBeGreaterThan(0)
    expect(store.totalCount).toBeGreaterThan(0)
    for (const a of store.filteredAnimals) {
      expect(a.category).toBe(AnimalCategory.Mammals)
    }
  })

  // grid/map dataset consistency removed — Mapbox modal handles occurrences now

  it('openAnimalProfile sets selectedAnimal; closeAnimalProfile clears it', async () => {
    const { useDiscoverStore } = await import('@/stores/discoverStore')
    const store = useDiscoverStore()
    await store.fetchAnimals()

    const first = store.animals[0]!
    await store.openAnimalProfile(first)
    expect(store.selectedAnimal?.id).toBe(first.backendId)

    store.closeAnimalProfile()
    expect(store.selectedAnimal).toBeNull()
  })
})

// ── Discover: session-aware progress ─────────────────────────────────────────

describe('Discover: session-aware last-animal progress', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('recordAnimalVisit updates lastAnimalName on the active profile', async () => {
    const { useProfileStore } = await import('@/stores/profileStore')
    const { useProgressStore } = await import('@/stores/progressStore')
    const { useSessionStore } = await import('@/stores/sessionStore')

    const profileStore = useProfileStore()
    const progressStore = useProgressStore()
    const sessionStore = useSessionStore()

    await profileStore.createProfile({
      displayNickname: 'Bold Hawk',
      animalId: 'hornbill',
      animalVisualKey: 'hornbill',
    })
    expect(sessionStore.hasActiveSession).toBe(true)

    await progressStore.recordAnimalVisit('malayan-tiger', 'Malayan Tiger')

    expect(sessionStore.activeProfile?.lastAnimalName).toBe('Malayan Tiger')
    expect(progressStore.progress?.lastAnimalName).toBe('Malayan Tiger')
  })

  it('visiting a second animal overwrites lastAnimalName', async () => {
    const { useProfileStore } = await import('@/stores/profileStore')
    const { useProgressStore } = await import('@/stores/progressStore')
    const { useSessionStore } = await import('@/stores/sessionStore')

    const profileStore = useProfileStore()
    const progressStore = useProgressStore()
    const sessionStore = useSessionStore()

    await profileStore.createProfile({
      displayNickname: 'Gentle Fox',
      animalId: 'proboscis-monkey',
      animalVisualKey: 'proboscis-monkey',
    })

    await progressStore.recordAnimalVisit('hornbill', 'Hornbill')
    expect(sessionStore.activeProfile?.lastAnimalName).toBe('Hornbill')

    await progressStore.recordAnimalVisit('orangutan', 'Orangutan')
    expect(sessionStore.activeProfile?.lastAnimalName).toBe('Orangutan')
    expect(progressStore.progress?.lastAnimalName).toBe('Orangutan')
  })

  it('last animal is isolated — visiting an animal on profile A does not affect profile B', async () => {
    const { useProfileStore } = await import('@/stores/profileStore')
    const { useProgressStore } = await import('@/stores/progressStore')

    const profileStore = useProfileStore()
    const progressStore = useProgressStore()

    const responseA = await profileStore.createProfile({
      displayNickname: 'Brave Cloud',
      animalId: 'hornbill',
      animalVisualKey: 'hornbill',
    })
    const profileA = responseA.profile
    await progressStore.recordAnimalVisit('malayan-tiger', 'Malayan Tiger')

    await profileStore.createProfile({
      displayNickname: 'Calm Fern',
      animalId: 'proboscis-monkey',
      animalVisualKey: 'proboscis-monkey',
    })
    // Profile B has no animal visits
    expect(progressStore.progress?.lastAnimalName).toBeUndefined()

    // Switch back to A — Tiger is still there
    await profileStore.switchToProfile(profileA.profileId)
    expect(progressStore.progress?.lastAnimalName).toBe('Malayan Tiger')
  })
})
