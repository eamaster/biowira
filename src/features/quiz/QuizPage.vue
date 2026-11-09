<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuizStore } from '@/stores/quizStore'
import { QuizAnswerResult } from '@/domain/enums'
import { getQuizHubAnimalIconProps, type Quiz, type QuizAnswer } from '@/domain/quiz'
import type { OptionState } from './components/QuizOptionButton.vue'
import PixelLoadingState from '@/components/ui/PixelLoadingState.vue'
import PixelErrorState from '@/components/ui/PixelErrorState.vue'
import QuizProgressNav from './components/QuizProgressNav.vue'
import QuizOptionButton from './components/QuizOptionButton.vue'
import QuizFeedbackPanel from './components/QuizFeedbackPanel.vue'
import AnimalIcon from '@/components/ui/AnimalIcon.vue'
import { orderQuizzesByRelevance, type QuizListAnimalContext } from '@/domain/quizRelevance'
import { LEAF_POINTS_LABEL } from '@/domain/pointsCurrency'
import BioWiraScenePage from '@/components/layout/BioWiraScenePage.vue'
import { resolveDemoFunFactUnlockAnimal } from '@/domain/demoFunFactUnlocks'
import { useAppAudio } from '@/composables/useAppAudio'

const store = useQuizStore()
const router = useRouter()
const route = useRoute()
const { sfx } = useAppAudio()

// ── SFX on answer feedback ─────────────────────────────────────────────────
// Fingerprint includes retriesUsed so first try vs retry are distinct; same object is mutated
// in the store so comparing `prev` attempt === current breaks dedupe for retries.
watch(
  () => {
    const a = store.currentAttempt
    if (!a || a.isRetrying || a.selectedAnswerId == null) return null
    return `${a.questionId}\u0000${a.selectedAnswerId}\u0000${a.retriesUsed}\u0000${a.result}` as const
  },
  (fp, prevFp) => {
    if (fp == null || fp === prevFp) return
    const a = store.currentAttempt
    if (!a) return
    if (a.result === QuizAnswerResult.Correct) sfx('answer-correct')
    else sfx('answer-wrong')
  },
)

onMounted(() => {
  store.prepareForQuizEntry()
  void store.fetchQuizzes(!store.activeQuiz)
})

const quizHubContext = computed<QuizListAnimalContext>(() => ({
  domainAnimalId: typeof route.query.animal === 'string' ? route.query.animal : undefined,
  commonName: typeof route.query.animalName === 'string' ? route.query.animalName : undefined,
  scientificName: typeof route.query.animalSci === 'string' ? route.query.animalSci : undefined,
  recentQuizTitle: typeof route.query.quizTitle === 'string' ? route.query.quizTitle : undefined,
}))

/** Resolved demo-unlock animal for this quiz session, if applicable. */
const demoUnlockAnimal = computed(() => {
  if (route.query.unlockFacts !== '1') return null
  return resolveDemoFunFactUnlockAnimal({
    animalVisualKey: typeof route.query.animalVisualKey === 'string' ? route.query.animalVisualKey : null,
    animalId: typeof route.query.animal === 'string' ? route.query.animal : null,
    animalName: typeof route.query.animalName === 'string' ? route.query.animalName : null,
    scientificName: typeof route.query.animalSci === 'string' ? route.query.animalSci : null,
  })
})

const orderedQuizzes = computed(() => orderQuizzesByRelevance(store.quizzes, quizHubContext.value))

function isRecentQuizHighlight(quiz: Quiz) {
  const t = quizHubContext.value.recentQuizTitle?.trim()
  if (!t) return false
  const a = quiz.title.trim().toLowerCase()
  const b = t.toLowerCase()
  return a === b || a.includes(b) || b.includes(a)
}

// ── Computed helpers ──────────────────────────────────────────────────────────

/** True when the user is in retry-selection mode (first was wrong, retry clicked) */
const isRetrying = computed(() => store.currentAttempt?.isRetrying ?? false)

/** True when an answer has been locked in (not in retry mode) */
const isAnswered = computed(
  () => store.currentAttempt !== null && !store.currentAttempt.isRetrying,
)

const isCorrect = computed(
  () => store.currentAttempt?.result === QuizAnswerResult.Correct,
)

/** True: retry button is available (wrong, 0 retries used, not in retry mode) */
const canRetry = computed(
  () =>
    isAnswered.value &&
    store.currentAttempt?.result === QuizAnswerResult.Wrong &&
    store.currentAttempt.retriesUsed === 0 &&
    !isRetrying.value,
)

/** True: all retries used and still wrong — show explanation */
const showExplanation = computed(
  () =>
    store.canProceed() &&
    store.currentAttempt?.result === QuizAnswerResult.Wrong,
)

const isLastQuestion = computed(
  () => store.currentQuestionIndex === store.totalQuestions - 1,
)

/** Determine the visual state of each answer option */
function getOptionState(answer: QuizAnswer): OptionState {
  const attempt = store.currentAttempt
  // No attempt yet, or in retry mode → show active defaults
  if (!attempt || attempt.isRetrying) return 'default'

  if (attempt.selectedAnswerId === answer.id) {
    return attempt.result === QuizAnswerResult.Correct ? 'correct' : 'wrong'
  }

  // After all retries exhausted and still wrong → reveal the correct answer
  if (store.canProceed() && attempt.result === QuizAnswerResult.Wrong && answer.isCorrect) {
    return 'revealed-correct'
  }

  return 'idle'
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function startSelectedQuiz(quizId: string) {
  await store.startQuiz(quizId, {
    demoUnlockAnimalId: demoUnlockAnimal.value?.canonicalId ?? null,
  })
}

function handleNext() {
  store.nextQuestion()
  if (store.isFinished) {
    router.push('/quiz/result')
  }
}

function quizTopicLine(quiz: { topic?: string; title: string }) {
  return quiz.topic?.trim() || quiz.title
}
</script>

<template>
  <BioWiraScenePage
    title="Animal Quiz"
    subtitle="Answer fun questions and grow your wildlife knowledge."
    density="compact"
    show-animal-chat
    animal-chat-placement="sky-right"
  >
    <div class="quiz-page">
      <div id="quiz-main" class="page-content">
        <!-- Loading -->
        <PixelLoadingState v-if="store.loading" message="Loading quiz..." />

        <!-- Error -->
        <PixelErrorState
          v-else-if="store.error"
          :message="store.error"
          @retry="store.fetchQuizzes(true)"
        />

        <!-- ── Quiz picker (no active run) ─────────────────────────────────── -->
        <section
          v-else-if="!store.activeQuiz"
          class="quiz-hub"
          aria-label="Choose a quiz"
        >
          <div class="quiz-hub__mascot" aria-hidden="true">🦁</div>
          <h2 class="quiz-hub__title">Pick a Quiz!</h2>
          <p class="quiz-hub__intro">
            Each quiz is a short adventure. Tap a card to start. You get one friendly retry if a
            question is tricky.
          </p>
          <p v-if="demoUnlockAnimal" class="quiz-hub__unlock-context">
            🔓 Complete a quiz to unlock all fun facts for
            <strong>{{ demoUnlockAnimal.displayName }}</strong>!
          </p>
          <p v-else-if="quizHubContext.domainAnimalId" class="quiz-hub__context">
            Showing quizzes that match
            <strong>{{ quizHubContext.commonName || 'this animal' }}</strong>
            first — you can still open any quiz you like.
          </p>

          <p v-if="!store.loading && orderedQuizzes.length === 0" class="quiz-hub__empty">
            No quizzes are available right now. Please try again later.
          </p>

          <ul v-else class="quiz-hub__list" role="list">
            <li
              v-for="quiz in orderedQuizzes"
              :key="quiz.id"
              class="quiz-hub__item"
              role="listitem"
            >
              <button
                type="button"
                class="quiz-hub__card"
                :class="{ 'quiz-hub__card--recent': isRecentQuizHighlight(quiz) }"
                :data-testid="`quiz-pick-${quiz.id}`"
                @click="startSelectedQuiz(quiz.id)"
              >
                <span class="quiz-hub__card-badge" aria-hidden="true">
                  <AnimalIcon v-bind="getQuizHubAnimalIconProps(quiz)" size="32px" />
                </span>
                <span class="quiz-hub__card-body">
                  <span class="quiz-hub__card-title">{{ quiz.title }}</span>
                  <span class="quiz-hub__card-topic">{{ quizTopicLine(quiz) }}</span>
                  <span class="quiz-hub__card-desc">{{ quiz.description }}</span>
                  <span class="quiz-hub__card-meta">
                    {{ quiz.questions.length }} questions · earn {{ LEAF_POINTS_LABEL }}!
                  </span>
                </span>
                <span class="quiz-hub__card-go" aria-hidden="true">▶</span>
              </button>
            </li>
          </ul>
        </section>

        <!-- ── Active Quiz ──────────────────────────────────────────────────── -->
        <section v-else class="quiz-active" aria-label="Quiz question">
          <!-- Progress dots -->
          <QuizProgressNav
            :current-index="store.currentQuestionIndex"
            :total-questions="store.totalQuestions"
            :attempts="store.attempts"
          />

          <!-- Question card -->
          <div
            v-if="store.currentQuestion"
            class="quiz-card"
            data-testid="quiz-card"
          >
            <!-- Question header -->
            <div class="quiz-card__question-area">
              <div class="quiz-card__emoji" aria-hidden="true">
                <AnimalIcon
                  :icon-key="store.currentQuestion.animalVisualKey ?? undefined"
                  :fallback-emoji="store.currentQuestion.animalEmoji"
                  size="52px"
                />
              </div>
              <h2 id="current-question" class="quiz-card__question">
                {{ store.currentQuestion.questionText }}
              </h2>
            </div>

            <!-- Retry mode banner -->
            <div v-if="isRetrying" class="quiz-card__retry-banner" role="status">
              <span aria-hidden="true">🔄</span> Choose your answer again!
            </div>

            <!-- Answer options -->
            <div
              class="quiz-card__answers"
              role="group"
              :aria-labelledby="'current-question'"
            >
              <QuizOptionButton
                v-for="answer in store.currentQuestion.answers"
                :key="answer.id"
                :answer="answer"
                :state="getOptionState(answer)"
                @select="store.selectAnswer($event)"
              />
            </div>

            <!-- Feedback + retry/next buttons (only when locked in, not retrying) -->
            <QuizFeedbackPanel
              v-if="isAnswered"
              :is-correct="isCorrect"
              :can-retry="canRetry"
              :show-explanation="showExplanation"
              :explanation="store.currentQuestion.explanation"
              :can-proceed="store.canProceed()"
              :is-last-question="isLastQuestion"
              @retry="store.retryQuestion()"
              @next="handleNext"
            />
          </div>
        </section>
      </div>
    </div>
  </BioWiraScenePage>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.quiz-page {
  min-height: 0;
  width: 100%;
}

// ── Quiz hub ─────────────────────────────────────────────────────────────────
.quiz-hub {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-4);
  padding: clamp(var(--space-4), 3dvh, var(--space-6)) var(--space-4);
  max-width: min(920px, 100%);
  margin: 0 auto;
  width: 100%;
  border-radius: var(--radius-2xl);
  background: var(--scene-warm-panel-bg);
  border: var(--pixel-border) solid var(--scene-warm-panel-border);
  box-shadow: var(--scene-warm-panel-shadow);
  backdrop-filter: blur(2px);

  &__mascot {
    font-size: clamp(2.25rem, 5vmin, 3.5rem);
    line-height: 1;
    text-align: center;
    animation: bounce-in 0.5s var(--transition-bounce);
  }

  &__title {
    font-family: var(--font-readable);
    font-size: var(--text-lg);
    font-weight: 800;
    color: var(--color-text);
    line-height: 1.4;
    text-align: center;
  }

  &__intro,
  &__context,
  &__empty {
    font-family: var(--font-body);
    font-size: var(--text-md);
    color: var(--color-text-light);
    text-align: center;
    font-weight: 600;
    line-height: 1.5;
  }

  &__context {
    background: rgba(91, 138, 60, 0.08);
    border: 2px dashed var(--color-primary);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }

  &__unlock-context {
    background: rgba(232, 160, 32, 0.12);
    border: 2px dashed var(--color-secondary);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    font-family: var(--font-body);
    font-size: var(--text-md);
    color: var(--color-text-light);
    text-align: center;
    font-weight: 700;
    line-height: 1.5;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  &__item {
    margin: 0;
  }

  &__card {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-4);
    background: var(--color-bg-card);
    border: var(--pixel-border-thick) solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.12);
    cursor: pointer;
    text-align: left;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);

    &:hover {
      border-color: var(--color-primary);
    }

    &:active {
      transform: translateY(3px);
      box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.12);
    }

    &:focus-visible {
      outline: 3px solid var(--color-secondary);
      outline-offset: 3px;
    }

    &--recent {
      border-color: var(--color-secondary);
      background: rgba(232, 160, 32, 0.09);
      box-shadow: 4px 4px 0 rgba(184, 120, 0, 0.25);
    }
  }

  &__card-badge {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(91, 138, 60, 0.12);
    border-radius: var(--radius-md);
    border: 2px solid var(--color-primary);
  }

  &__card-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__card-title {
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-weight: 800;
    color: var(--color-text);
  }

  &__card-topic {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-weight: 800;
    color: var(--color-primary-dark);
  }

  &__card-desc {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--color-text-light);
    font-weight: 600;
    line-height: 1.4;
  }

  &__card-meta {
    font-family: var(--font-readable);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-text-muted);
    margin-top: var(--space-1);
  }

  &__card-go {
    flex-shrink: 0;
    font-size: clamp(1.125rem, 2.2vmin, 1.375rem);
    color: var(--color-secondary);
    padding: 0 var(--space-1);
  }

  @media (min-width: $bp-lg) {
    max-width: min(var(--max-content-width), 100%);
    gap: var(--space-3);

    &__list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-3);
    }

    &__card {
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      text-align: center;
      gap: var(--space-3);
      padding-block: var(--space-3);
      padding-inline: var(--space-3);
    }

    &__card-badge {
      align-self: center;
    }

    &__card-body {
      align-items: center;
    }

    &__card-go {
      display: none;
    }
  }

  @media (min-width: $bp-xl) {
    &__list {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    &__card {
      gap: var(--space-2);
    }
  }
}

// ── Active quiz ───────────────────────────────────────────────────────────────
.quiz-active {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.quiz-card {
  background: rgba(255, 248, 231, 0.92);
  border: var(--pixel-border-thick) solid rgba(145, 111, 64, 0.4);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: 5px 5px 0 rgba(61, 43, 31, 0.12);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;

  &__question-area {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
  }

  &__emoji {
    flex-shrink: 0;
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__question {
    font-family: var(--font-body);
    font-size: clamp(16px, 2.5vw, 21px);
    font-weight: 800;
    color: var(--color-text);
    line-height: 1.5;
    flex: 1;
  }

  &__retry-banner {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: rgba(232, 160, 32, 0.15);
    border: 2px solid var(--color-secondary);
    border-radius: var(--radius-sm);
    font-family: var(--font-readable);
    font-weight: 800;
    font-size: var(--text-sm);
    color: var(--color-text);
  }

  &__answers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);

    @media (max-width: $bp-sm) {
      grid-template-columns: 1fr;
    }
  }

  @media (min-width: $bp-lg) {
    padding: clamp(var(--space-4), 2dvh, var(--space-5)) clamp(var(--space-4), 2vw, var(--space-6));
    gap: var(--space-3);

    &__question-area {
      gap: var(--space-3);
      align-items: center;
    }

    &__emoji {
      width: 56px;
      height: 56px;
    }

    &__answers {
      gap: var(--space-2);
    }
  }
}

@media (min-width: $bp-lg) {
  .quiz-active {
    gap: var(--space-3);
    max-width: min(920px, 100%);
  }
}

@keyframes bounce-in {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  70% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .quiz-hub__mascot {
    animation: none;
  }
}
</style>
