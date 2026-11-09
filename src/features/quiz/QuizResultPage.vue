<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/stores/quizStore'
import { useProgressStore } from '@/stores/progressStore'
import RewardIcon from '@/components/ui/RewardIcon.vue'
import PixelButton from '@/components/ui/PixelButton.vue'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'
import BioWiraScenePage from '@/components/layout/BioWiraScenePage.vue'
import QuizRewardSummary from './components/QuizRewardSummary.vue'
import { QuizAnswerResult } from '@/domain/enums'
import { ROUTE_NAMES } from '@/app/config'
import { useAppAudio } from '@/composables/useAppAudio'
import {
  LEAF_POINTS_GAMEPLAY_ICON_KEY,
} from '@/domain/pointsCurrency'

const router = useRouter()
const quizStore = useQuizStore()
const progressStore = useProgressStore()
const { sfx } = useAppAudio()

onMounted(() => {
  if (!quizStore.lastResult) {
    router.replace('/quiz')
    return
  }
  setTimeout(() => {
    sfx('achievement')
    const earned = quizStore.lastCompletionSnapshot?.pointsEarned ?? 0
    if (earned > 0) sfx('leaf-collect')
  }, 600)
})

const result = computed(() => quizStore.lastResult)
const snap = computed(() => quizStore.lastCompletionSnapshot)

const scorePct = computed(() => {
  if (!result.value) return 0
  return Math.round((result.value.score / result.value.totalQuestions) * 100)
})

const resultSummary = computed(() => {
  if (!result.value) return ''
  const pct = scorePct.value
  const score = result.value.score
  const total = result.value.totalQuestions

  if (pct === 100) return `Perfect score! You got all ${total} right!`
  if (pct >= 80) return `Excellent! You got ${score} out of ${total} — almost perfect!`
  if (pct >= 60) return `Good job! You got ${score} out of ${total} correct.`
  return `You got ${score} out of ${total}. Keep practising!`
})

const correctCount = computed(
  () => result.value?.attempts.filter((a) => a.result === QuizAnswerResult.Correct).length ?? 0,
)
const wrongCount = computed(() => (result.value?.totalQuestions ?? 0) - correctCount.value)

const showLevelUp = computed(() => snap.value?.leveledUp ?? false)

function playAgain() {
  quizStore.resetQuiz()
  router.push('/quiz')
}

function goDiscover() {
  router.push({ name: ROUTE_NAMES.discover })
}

function goHome() {
  router.push({ name: ROUTE_NAMES.home })
}

function goSeeFunFacts() {
  const animalId = snap.value?.demoUnlockedAnimalId
  if (animalId) {
    router.push({ name: ROUTE_NAMES.discover, query: { focusAnimal: animalId } })
  } else {
    router.push({ name: ROUTE_NAMES.discover })
  }
}
</script>

<template>
  <BioWiraScenePage
    title="Quiz Complete!"
    subtitle="Here's your score and rewards — great work exploring!"
    content-width="wide"
    density="compact"
    :show-decor="false"
  >
    <div v-if="result" class="quiz-result" data-testid="quiz-result">
      <div class="result-page__stack">
        <section
          class="quiz-result__summary-panel"
          aria-label="Result summary"
        >
          <div class="quiz-result__hero">
            <div class="quiz-result__trophy" aria-hidden="true">
              <RewardIcon type="trophy" size="80px" />
            </div>
            <h2 class="quiz-result__greeting">
              Great job, {{ progressStore.displayName }}!
            </h2>
            <p class="quiz-result__summary">{{ resultSummary }}</p>
          </div>

          <div class="quiz-result__score-row" role="list" aria-label="Score breakdown">
            <div class="quiz-result__score-chip" role="listitem">
              <RewardIcon type="correct" size="32px" />
              <span class="quiz-result__score-num">{{ correctCount }}</span>
              <span class="quiz-result__score-label">Correct</span>
            </div>
            <div class="quiz-result__score-chip" role="listitem">
              <RewardIcon type="wrong" size="32px" />
              <span class="quiz-result__score-num">{{ wrongCount }}</span>
              <span class="quiz-result__score-label">Wrong</span>
            </div>
            <div class="quiz-result__score-chip" role="listitem">
              <RewardIcon type="score" size="32px" />
              <span class="quiz-result__score-num">{{ scorePct }}%</span>
              <span class="quiz-result__score-label">Score</span>
            </div>
          </div>
        </section>

        <div
          v-if="quizStore.completionPending"
          class="quiz-result__progress-loading"
          role="status"
          aria-live="polite"
        >
          <GameplayIcon
            :type="LEAF_POINTS_GAMEPLAY_ICON_KEY"
            size="40px"
            class="quiz-result__progress-loading-icon"
            alt=""
          />
          <span>Calculating your reward…</span>
        </div>

        <QuizRewardSummary
          v-else-if="snap"
          :snapshot="snap"
          :total-leaf-points="snap.postQuizTotalPoints"
          :show-level-up="showLevelUp"
        />

        <section
          v-if="snap?.demoFunFactsUnlocked"
          class="quiz-result__facts-unlock"
          role="status"
          aria-live="polite"
        >
          <GameplayIcon
            type="discover"
            size="40px"
            class="quiz-result__facts-unlock-icon"
            alt=""
          />
          <p class="quiz-result__facts-unlock-text">
            You unlocked all fun facts for
            <strong>{{ snap.demoUnlockedAnimalName }}!</strong>
          </p>
          <PixelButton variant="yellow" size="md" full-width @click="goSeeFunFacts">
            <span class="quiz-result__action-inner">
              <GameplayIcon type="discover" size="18px" alt="" />
              See Fun Facts
            </span>
          </PixelButton>
        </section>

        <div class="result-page__actions">
          <PixelButton
            variant="green"
            size="md"
            full-width
            aria-label="Play again"
            @click="playAgain"
          >
            <span class="quiz-result__action-inner">
              <GameplayIcon type="quiz" size="18px" alt="" />
              Play Again
            </span>
          </PixelButton>
          <PixelButton
            variant="blue"
            size="md"
            full-width
            aria-label="Discover animals"
            @click="goDiscover"
          >
            <span class="quiz-result__action-inner">
              <GameplayIcon type="discover" size="18px" alt="" />
              Discover Animals
            </span>
          </PixelButton>
          <PixelButton
            variant="gray"
            size="md"
            full-width
            aria-label="Continue to home"
            @click="goHome"
          >
            Continue
          </PixelButton>
        </div>
      </div>
    </div>
  </BioWiraScenePage>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;
@use '@/styles/mixins/result_page_actions_grid' as *;

.quiz-result {
  width: 100%;
  min-height: 0;
}

.result-page__stack {
  width: min(100%, clamp(760px, 78vw, 1180px));
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: clamp(var(--space-4), 2vh, var(--space-6));
  padding: clamp(var(--space-3), 2vh, var(--space-5)) var(--space-2) var(--space-4);
  box-sizing: border-box;
}

.quiz-result__summary-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-6) var(--space-4);
  border-radius: var(--radius-2xl);
  background: var(--scene-warm-panel-bg);
  border: var(--pixel-border) solid var(--scene-warm-panel-border);
  box-shadow: var(--scene-warm-panel-shadow);
  backdrop-filter: blur(2px);
}

.quiz-result__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
}

.quiz-result__trophy {
  animation: pop-in 0.5s var(--transition-bounce);
  line-height: 0;
  display: flex;
}

.quiz-result__greeting {
  font-family: var(--font-readable);
  font-size: var(--text-lg);
  font-weight: 800;
  color: var(--color-primary-dark);
  margin: 0;
}

.quiz-result__summary {
  font-family: var(--font-body);
  font-size: clamp(18px, 3vw, 24px);
  font-weight: 800;
  color: var(--color-text);
  max-width: 480px;
  line-height: 1.5;
  margin: 0;
}

.quiz-result__score-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.quiz-result__score-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 132px;
  padding: var(--space-4);
  background: var(--color-bg-card);
  border: var(--pixel-border) solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--pixel-shadow);
}

.quiz-result__score-num {
  font-family: var(--font-readable);
  font-weight: 900;
  font-size: 36px;
  color: var(--color-text);
}

.quiz-result__score-label {
  font-family: var(--font-readable);
  font-size: var(--text-sm);
  font-weight: 800;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.quiz-result__progress-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-8);
  background: var(--scene-warm-panel-bg);
  border: var(--pixel-border) solid var(--scene-warm-panel-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--scene-warm-panel-shadow);
  font-family: var(--font-readable);
  font-weight: 800;
  font-size: var(--text-base);
  color: var(--color-text-muted);
  min-height: 120px;
}

.quiz-result__progress-loading-icon {
  animation: spin-leaf 1.2s linear infinite;
}

.quiz-result__facts-unlock {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5);
  background: rgba(232, 160, 32, 0.12);
  border: 2px dashed var(--color-secondary);
  border-radius: var(--radius-xl);
  text-align: center;
  animation: pop-in 0.5s var(--transition-bounce);
}

.quiz-result__facts-unlock-icon {
  line-height: 0;
}

.quiz-result__facts-unlock-text {
  font-family: var(--font-readable);
  font-size: var(--text-base);
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.4;
  margin: 0;
}

.result-page__actions {
  @include result-page-actions-grid(3);
}

.quiz-result__action-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

@keyframes pop-in {
  0% {
    transform: scale(0.3) rotate(-15deg);
    opacity: 0;
  }
  70% {
    transform: scale(1.15) rotate(5deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

@keyframes spin-leaf {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .quiz-result__trophy {
    animation: none;
  }

  .quiz-result__progress-loading-icon {
    animation: none;
  }
}
</style>
