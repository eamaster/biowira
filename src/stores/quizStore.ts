import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Quiz, QuizAttempt, QuizResult } from '@/domain/quiz'
import { QuizAnswerResult } from '@/domain/enums'
import { repositories } from '@/repositories'
import { useProgressStore } from './progressStore'
import { useSessionStore } from './sessionStore'
import { appConfig } from '@/app/config'
import { getLevelForPoints, getLevelProgress, LEVEL_DEFINITIONS } from '@/domain/user'
import type { NewBadgeDto } from '@/domain/missionApi.dto'
import {
  normalizeDemoFunFactAnimalId,
  DEMO_FUN_FACT_UNLOCK_ANIMALS,
} from '@/domain/demoFunFactUnlocks'

// ── Scoring utility ────────────────────────────────────────────────────────────
export function calculatePoints(
  correctCount: number,
  totalQuestions: number,
  pointsPerCorrect: number,
  bonusForPerfect: number,
): number {
  const base = correctCount * pointsPerCorrect
  const bonus = correctCount === totalQuestions ? bonusForPerfect : 0
  return base + bonus
}

// ── Completion snapshot ────────────────────────────────────────────────────────
/**
 * Frozen, consistent post-quiz values from a single completed transaction.
 * The result page reads ONLY from this — never from mismatched live store values.
 */
export interface QuizCompletionSnapshot {
  correctAnswers: number
  totalQuestions: number
  scorePercent: number
  /** Server-authoritative cumulative leaf-points total after quiz completion */
  postQuizTotalPoints: number
  /** Derived: postQuizTotalPoints − preQuizLeafPoints (clamped ≥ 0) */
  pointsEarned: number
  levelAfterQuiz: number
  levelTitleAfterQuiz: string
  /** 0-100 progress within the current level */
  levelProgressAfterQuiz: number
  leveledUp: boolean
  newFactsUnlocked: number
  newBadges: NewBadgeDto[]
  /** DEMO ONLY: canonical ID of the unlocked animal (one of the 3 configured animals). */
  demoUnlockedAnimalId?: string
  /** DEMO ONLY: display name of the unlocked animal. */
  demoUnlockedAnimalName?: string
  /** DEMO ONLY: true when quiz completion unlocked fun facts for a demo animal. */
  demoFunFactsUnlocked?: boolean
}

// ── Demo level-up helper ──────────────────────────────────────────────────────
/**
 * DEMO ONLY: Ensure the post-quiz points total reaches at least the next level
 * when `shouldForceLevelUp` is true and the candidate points would not
 * naturally trigger a level-up.
 *
 * This is ONLY applied to the 3 configured demo animals and as a
 * frontend overlay — the backend save-progress request is never modified.
 *
 * @param preQuizPoints  Points before the quiz started.
 * @param candidatePoints  Points that would be applied without force.
 * @param shouldForceLevelUp  Whether to force a level-up for demo purposes.
 */
export function ensureDemoLevelUpTotalPoints(
  preQuizPoints: number,
  candidatePoints: number,
  shouldForceLevelUp: boolean,
): number {
  if (!shouldForceLevelUp) return candidatePoints

  const preLevel = getLevelForPoints(preQuizPoints).level
  const candidateLevel = getLevelForPoints(candidatePoints).level

  if (candidateLevel > preLevel) {
    // Already levelled up naturally — no adjustment needed.
    return candidatePoints
  }

  // Find the next level definition and return its minPoints.
  const nextLevelDef = LEVEL_DEFINITIONS.find((l) => l.level === preLevel + 1)
  if (!nextLevelDef || nextLevelDef.minPoints === Infinity) {
    // Already at max level — no adjustment possible.
    return candidatePoints
  }

  return Math.max(candidatePoints, nextLevelDef.minPoints)
}

// ── Store ──────────────────────────────────────────────────────────────────────
export const useQuizStore = defineStore('quiz', () => {
  const quizzes = ref<Quiz[]>([])
  const activeQuiz = ref<Quiz | null>(null)
  const currentQuestionIndex = ref(0)
  const attempts = ref<QuizAttempt[]>([])
  const lastResult = ref<QuizResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isFinished = ref(false)

  // ── Completion tracking ────────────────────────────────────────────────────

  /** Leaf-points total captured when the current quiz run started. */
  const preQuizLeafPoints = ref(0)

  /**
   * DEMO ONLY: canonical demo-unlock animal ID for this quiz run, if any.
   * Set by startQuiz when called with a demoUnlockAnimalId option.
   */
  const activeDemoUnlockAnimalId = ref<string | null>(null)

  /**
   * Frozen, consistent post-quiz snapshot.
   * Populated after save-progress resolves (API path) or synchronously (mock path).
   * The result page reads ONLY from this — never from live store values.
   */
  const lastCompletionSnapshot = ref<QuizCompletionSnapshot | null>(null)

  /**
   * True while the API save-progress call is in-flight.
   * The result page shows a loading state while this is true.
   */
  const completionPending = ref(false)

  // ── Computed ─────────────────────────────────────────────────────────────────

  const currentQuestion = computed(
    () => activeQuiz.value?.questions[currentQuestionIndex.value] ?? null,
  )

  const currentAttempt = computed(
    () => attempts.value.find((a) => a.questionId === currentQuestion.value?.id) ?? null,
  )

  const totalQuestions = computed(() => activeQuiz.value?.questions.length ?? 0)
  const questionNumber = computed(() => currentQuestionIndex.value + 1)

  // ── Actions ───────────────────────────────────────────────────────────────────

  async function fetchQuizzes(force = false) {
    if (quizzes.value.length > 0 && !force) return
    loading.value = true
    error.value = null
    try {
      quizzes.value = await repositories.quizzes.getAll()
    } catch (e) {
      error.value = 'Could not load quizzes'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function startQuiz(quizId: string, options?: { demoUnlockAnimalId?: string | null }) {
    loading.value = true
    error.value = null
    try {
      const quiz = await repositories.quizzes.getById(quizId)
      if (!quiz) throw new Error('Quiz not found')
      activeQuiz.value = quiz
      currentQuestionIndex.value = 0
      attempts.value = []
      lastResult.value = null
      isFinished.value = false
      lastCompletionSnapshot.value = null
      completionPending.value = false

      // DEMO ONLY: capture demo unlock animal ID for this run.
      activeDemoUnlockAnimalId.value = options?.demoUnlockAnimalId
        ? normalizeDemoFunFactAnimalId(options.demoUnlockAnimalId)
        : null

      // Capture pre-quiz leaf-points baseline.
      // Use activeProfile as the primary source of truth; fall back to
      // progressStore (which returns 0 when no profile is active).
      const sessionStore = useSessionStore()
      const progressStore = useProgressStore()
      preQuizLeafPoints.value = sessionStore.activeProfile?.leafPoints ?? progressStore.leafPoints
    } catch (e) {
      error.value = 'Could not start quiz'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Record the user's answer for the current question.
   *
   * State machine:
   *  - No existing attempt      → create first attempt
   *  - Existing + isRetrying    → record retry answer (retriesUsed = 1)
   *  - Existing + not retrying  → ignore (question is locked)
   */
  function selectAnswer(answerId: string) {
    const question = currentQuestion.value
    if (!question) return

    const isCorrect = answerId === question.correctAnswerId
    const existing = attempts.value.find((a) => a.questionId === question.id)

    if (!existing) {
      // First attempt
      attempts.value.push({
        questionId: question.id,
        selectedAnswerId: answerId,
        result: isCorrect ? QuizAnswerResult.Correct : QuizAnswerResult.Wrong,
        retriesUsed: 0,
        isRetrying: false,
      })
    } else if (existing.isRetrying) {
      // Retry attempt
      existing.selectedAnswerId = answerId
      existing.result = isCorrect ? QuizAnswerResult.Correct : QuizAnswerResult.Wrong
      existing.retriesUsed = 1
      existing.isRetrying = false
    }
    // Otherwise locked — ignore
  }

  /**
   * Activate retry mode for the current question.
   * Only allowed when: answered wrong, retriesUsed === 0, and not already retrying.
   */
  function retryQuestion() {
    const question = currentQuestion.value
    if (!question) return
    const attempt = attempts.value.find((a) => a.questionId === question.id)
    if (
      attempt &&
      attempt.result === QuizAnswerResult.Wrong &&
      attempt.retriesUsed === 0 &&
      !attempt.isRetrying
    ) {
      attempt.isRetrying = true
      attempt.selectedAnswerId = null
    }
  }

  /**
   * Returns true when the user may proceed to the next question.
   * Conditions: answered correctly, OR used retry (even if still wrong).
   * Returns false when in retry mode (waiting for a new selection).
   */
  function canProceed(): boolean {
    const attempt = currentAttempt.value
    if (!attempt) return false
    if (attempt.isRetrying) return false
    return attempt.result === QuizAnswerResult.Correct || attempt.retriesUsed >= 1
  }

  function nextQuestion() {
    if (!canProceed()) return
    if (currentQuestionIndex.value < (activeQuiz.value?.questions.length ?? 0) - 1) {
      currentQuestionIndex.value++
    } else {
      finishQuiz()
    }
  }

  function finishQuiz() {
    if (!activeQuiz.value) return

    const correctCount = attempts.value.filter((a) => a.result === QuizAnswerResult.Correct).length
    const totalQ = activeQuiz.value.questions.length

    // Local earned-points figure — used as fallback when server is unavailable.
    // NOT the authoritative source when the server responds with totalPoints > 0.
    const localPointsEarned = calculatePoints(
      correctCount,
      totalQ,
      activeQuiz.value.pointsPerCorrect,
      activeQuiz.value.bonusForPerfect,
    )

    // lastResult is set synchronously — the score-breakdown card reads from it.
    lastResult.value = {
      quizId: activeQuiz.value.id,
      score: correctCount,
      totalQuestions: totalQ,
      pointsEarned: localPointsEarned,
      attempts: [...attempts.value],
      completedAt: new Date(),
    }

    // isFinished triggers navigation to /quiz/result in QuizPage.vue.
    // The result page shows a loading state until lastCompletionSnapshot is ready.
    isFinished.value = true

    const progressStore = useProgressStore()
    const sessionStore = useSessionStore()

    // Snapshot the pre-quiz baseline at the moment finishQuiz runs.
    // (preQuizLeafPoints was captured at startQuiz; this is a local const so the
    // async .then() closure always references the value from this quiz run.)
    const capturedPrePoints = preQuizLeafPoints.value
    const quizTitle = activeQuiz.value.title.trim()
    // DEMO ONLY: capture the demo unlock animal for this run before async work.
    const capturedDemoUnlockId = activeDemoUnlockAnimalId.value
    const demoAnimalDef = capturedDemoUnlockId
      ? DEMO_FUN_FACT_UNLOCK_ANIMALS.find((a) => a.canonicalId === capturedDemoUnlockId) ?? null
      : null

    // Record immediately — synchronous patch inside recordQuizVisit ensures the
    // Home-page "Recent Quiz" card updates before the async reward-sync finishes.
    // fire-and-forget: points/level sync runs independently in the blocks below.
    if (quizTitle) {
      void progressStore.recordQuizVisit(quizTitle)
    }

    if (sessionStore.activeProfile && appConfig.repoSources.quizzes === 'api') {
      // ── API path ──────────────────────────────────────────────────────────────
      completionPending.value = true

      repositories.quizzes
        .saveProgress(totalQ, correctCount)
        .then(async (result) => {
          // Use server totalPoints as authoritative cumulative total.
          // Fall back to local computation only when server returns 0 (backend issue).
          const serverTotal =
            result.totalPoints > 0 ? result.totalPoints : capturedPrePoints + localPointsEarned

          // DEMO ONLY: for the 3 configured animals, apply a frontend overlay
          // that ensures the user levels up. The backend request body is unchanged.
          const authoritative = ensureDemoLevelUpTotalPoints(
            capturedPrePoints,
            serverTotal,
            demoAnimalDef !== null,
          )

          // Derive earned from the authoritative total and the pre-quiz baseline.
          const earnedPoints = Math.max(0, authoritative - capturedPrePoints)

          const levelDef = getLevelForPoints(authoritative)
          const levelProgress = getLevelProgress(authoritative)
          const resolvedLevel = result.newLevel > 0 ? result.newLevel : levelDef.level
          const demoLeveledUp = demoAnimalDef !== null
            ? getLevelForPoints(authoritative).level > getLevelForPoints(capturedPrePoints).level
            : false

          // DEMO ONLY: trigger fun-fact unlock and cache invalidation.
          if (demoAnimalDef) {
            const { useAnimalFunFactUnlockStore } = await import('./animalFunFactUnlockStore')
            const { useFunFactStore } = await import('./funFactStore')
            useAnimalFunFactUnlockStore().unlockAnimalFacts(demoAnimalDef.canonicalId)
            useFunFactStore().invalidateFactsCache()
          }

          // 1. Freeze the completion snapshot.
          //    The result page reads ONLY from this — all five displayed values
          //    (earned, total, level, title, progress-bar) come from here.
          lastCompletionSnapshot.value = {
            correctAnswers: correctCount,
            totalQuestions: totalQ,
            scorePercent: Math.round((correctCount / totalQ) * 100),
            postQuizTotalPoints: authoritative,
            pointsEarned: earnedPoints,
            levelAfterQuiz: resolvedLevel,
            levelTitleAfterQuiz: levelDef.title,
            levelProgressAfterQuiz: levelProgress,
            leveledUp: result.leveledUp || demoLeveledUp,
            newFactsUnlocked: result.newFactsUnlocked,
            newBadges: result.newBadges,
            demoUnlockedAnimalId: demoAnimalDef?.canonicalId,
            demoUnlockedAnimalName: demoAnimalDef?.displayName,
            demoFunFactsUnlocked: demoAnimalDef !== null,
          }

          // 2. Patch live stores with the authoritative values.
          //    Include lastQuizTitle so a subsequent hydrateFromProfile cannot
          //    overwrite the title that recordQuizVisit already set above.
          sessionStore.patchActiveProfile({
            leafPoints: authoritative,
            level: resolvedLevel,
            levelTitle: levelDef.title,
            lastQuizTitle: quizTitle || sessionStore.activeProfile?.lastQuizTitle,
          })
          const patchedProfile = sessionStore.activeProfile
          if (patchedProfile) {
            progressStore.hydrateFromProfile(patchedProfile)
          }

          // completionPending = false AFTER snapshot is populated so the result
          // page transitions from loading to content atomically.
          completionPending.value = false

          // 3. Follow-up GET /profiles to refresh totalQuizzes, streakDays, etc.
          //    Stale-overwrite protection: if the refreshed profile carries an
          //    older leaf-points total than the authoritative save-progress value,
          //    protect the newer total and only merge non-points fields.
          //    Always preserve lastQuizTitle — the backend may omit this field.
          try {
            const savedTotal = authoritative
            const savedLevel = resolvedLevel
            const savedLevelTitle = levelDef.title
            const refreshed = await repositories.profile.getCurrentProfile()
            if (refreshed) {
              const safeLastQuizTitle =
                refreshed.lastQuizTitle ?? quizTitle ?? sessionStore.activeProfile?.lastQuizTitle
              if (refreshed.leafPoints >= savedTotal) {
                // Refreshed data is at least as current — safe to apply fully.
                const safeRefreshed = { ...refreshed, lastQuizTitle: safeLastQuizTitle }
                sessionStore.patchActiveProfile(safeRefreshed)
                progressStore.hydrateFromProfile(safeRefreshed)
              } else {
                // Refreshed carries stale (lower) points — protect the newer total.
                const mergedProfile = {
                  ...refreshed,
                  leafPoints: savedTotal,
                  level: savedLevel,
                  levelTitle: savedLevelTitle,
                  lastQuizTitle: safeLastQuizTitle,
                }
                sessionStore.patchActiveProfile(mergedProfile)
                progressStore.hydrateFromProfile(mergedProfile)
              }
            }
          } catch {
            // Non-critical — the save-progress authoritative patch is already applied.
          }
        })
        .catch(async (err) => {
          console.error('[quizStore] Failed to save quiz progress via /quizzes/save-progress:', err)
          // ── API-error fallback ─────────────────────────────────────────────
          // Apply points locally so the child still sees their reward.
          const rawFallback = capturedPrePoints + localPointsEarned
          // DEMO ONLY: still apply demo level-up overlay even on API error.
          const fallbackTotal = ensureDemoLevelUpTotalPoints(
            capturedPrePoints,
            rawFallback,
            demoAnimalDef !== null,
          )
          const levelDef = getLevelForPoints(fallbackTotal)

          // DEMO ONLY: trigger fun-fact unlock on error path too.
          if (demoAnimalDef) {
            const { useAnimalFunFactUnlockStore } = await import('./animalFunFactUnlockStore')
            const { useFunFactStore } = await import('./funFactStore')
            useAnimalFunFactUnlockStore().unlockAnimalFacts(demoAnimalDef.canonicalId)
            useFunFactStore().invalidateFactsCache()
          }

          lastCompletionSnapshot.value = {
            correctAnswers: correctCount,
            totalQuestions: totalQ,
            scorePercent: Math.round((correctCount / totalQ) * 100),
            postQuizTotalPoints: fallbackTotal,
            pointsEarned: Math.max(0, fallbackTotal - capturedPrePoints),
            levelAfterQuiz: levelDef.level,
            levelTitleAfterQuiz: levelDef.title,
            levelProgressAfterQuiz: getLevelProgress(fallbackTotal),
            leveledUp: false,
            newFactsUnlocked: 0,
            newBadges: [],
            demoUnlockedAnimalId: demoAnimalDef?.canonicalId,
            demoUnlockedAnimalName: demoAnimalDef?.displayName,
            demoFunFactsUnlocked: demoAnimalDef !== null,
          }
          completionPending.value = false
          progressStore.addPoints(localPointsEarned)
          // recordQuizVisit already fired at quiz finish — no duplicate needed here.
        })
    } else {
      // ── Mock / no-session path ─────────────────────────────────────────────
      // Snapshot is populated synchronously so the result page renders immediately.
      const rawFallback = capturedPrePoints + localPointsEarned
      // DEMO ONLY: apply demo level-up overlay.
      const fallbackTotal = ensureDemoLevelUpTotalPoints(
        capturedPrePoints,
        rawFallback,
        demoAnimalDef !== null,
      )
      const levelDef = getLevelForPoints(fallbackTotal)

      // DEMO ONLY: trigger fun-fact unlock on mock path.
      if (demoAnimalDef) {
        import('./animalFunFactUnlockStore').then(({ useAnimalFunFactUnlockStore }) => {
          useAnimalFunFactUnlockStore().unlockAnimalFacts(demoAnimalDef.canonicalId)
        }).catch(console.error)
        import('./funFactStore').then(({ useFunFactStore }) => {
          useFunFactStore().invalidateFactsCache()
        }).catch(console.error)
      }

      lastCompletionSnapshot.value = {
        correctAnswers: correctCount,
        totalQuestions: totalQ,
        scorePercent: Math.round((correctCount / totalQ) * 100),
        postQuizTotalPoints: fallbackTotal,
        pointsEarned: Math.max(0, fallbackTotal - capturedPrePoints),
        levelAfterQuiz: levelDef.level,
        levelTitleAfterQuiz: levelDef.title,
        levelProgressAfterQuiz: getLevelProgress(fallbackTotal),
        leveledUp: false,
        newFactsUnlocked: 0,
        newBadges: [],
        demoUnlockedAnimalId: demoAnimalDef?.canonicalId,
        demoUnlockedAnimalName: demoAnimalDef?.displayName,
        demoFunFactsUnlocked: demoAnimalDef !== null,
      }
      completionPending.value = false
      progressStore.addPoints(localPointsEarned)
      // recordQuizVisit already fired at quiz finish — no duplicate needed here.
      repositories.quizzes.submitResult(lastResult.value!).catch(console.error)
    }
  }

  function resetQuiz() {
    activeQuiz.value = null
    currentQuestionIndex.value = 0
    attempts.value = []
    lastResult.value = null
    isFinished.value = false
    error.value = null
    lastCompletionSnapshot.value = null
    completionPending.value = false
    preQuizLeafPoints.value = 0
    activeDemoUnlockAnimalId.value = null
  }

  /**
   * True when a quiz run has been fully completed (isFinished + lastResult set).
   * Distinguishes a finished run from an in-progress run (isFinished false).
   */
  const hasCompletedRun = computed(() => isFinished.value && lastResult.value !== null)

  /**
   * Call this at every /quiz entry point (e.g. QuizPage onMounted).
   *
   * Behaviour:
   *  - Completed run (isFinished true) → reset so the start screen is shown.
   *  - In-progress run (isFinished false, activeQuiz set) → preserved as-is.
   *  - No active quiz → no-op.
   *
   * This is the single, centralised place that clears stale completed state;
   * individual buttons/pages do not need their own reset calls.
   */
  function prepareForQuizEntry() {
    if (isFinished.value) {
      resetQuiz()
    }
  }

  return {
    quizzes,
    activeQuiz,
    currentQuestionIndex,
    attempts,
    lastResult,
    loading,
    error,
    isFinished,
    // Completion snapshot
    lastCompletionSnapshot,
    completionPending,
    activeDemoUnlockAnimalId,
    // Computed
    hasCompletedRun,
    currentQuestion,
    currentAttempt,
    totalQuestions,
    questionNumber,
    // Actions
    fetchQuizzes,
    startQuiz,
    selectAnswer,
    retryQuestion,
    canProceed,
    nextQuestion,
    resetQuiz,
    prepareForQuizEntry,
  }
})
