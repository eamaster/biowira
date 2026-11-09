<script setup lang="ts">
/**
 * QuizFeedbackPanel — shown below the answer options after the user selects an answer.
 *
 * - Correct → short cheer + Next
 * - First wrong (retry left) → retry-only path (no explanation yet)
 * - Second wrong after retry → teaching note + Next (correct answer reveal handled by options)
 */
defineProps<{
  isCorrect: boolean
  /** True when retry is available (retriesUsed === 0 and not yet retrying) */
  canRetry: boolean
  /** True when all retries exhausted and answer still wrong — show teaching note */
  showExplanation: boolean
  explanation: string
  /** Whether the Next/Finish button should be shown */
  canProceed: boolean
  isLastQuestion: boolean
}>()

const emit = defineEmits<{
  retry: []
  next: []
}>()
</script>

<template>
  <div class="quiz-feedback" role="status" aria-live="assertive">
    <!-- Correct -->
    <div v-if="isCorrect" class="quiz-feedback__banner quiz-feedback__banner--correct">
      <span class="quiz-feedback__icon" aria-hidden="true">🎉</span>
      <span class="quiz-feedback__text">Correct! Well done!</span>
    </div>

    <!-- First wrong — retry only (no explanation block) -->
    <div v-else-if="canRetry" class="quiz-feedback__banner quiz-feedback__banner--retry">
      <span class="quiz-feedback__icon" aria-hidden="true">😊</span>
      <span class="quiz-feedback__text">Not quite — want to try one more time?</span>
    </div>

    <!-- Second wrong — teaching note + continue -->
    <div v-else-if="showExplanation" class="quiz-feedback__learn">
      <div class="quiz-feedback__learn-intro">
        <span class="quiz-feedback__learn-icon" aria-hidden="true">📖</span>
        <span class="quiz-feedback__learn-title">Here is how it works:</span>
      </div>
      <div class="quiz-feedback__explanation" role="note">
        {{ explanation }}
      </div>
    </div>

    <!-- Fallback (should be rare) -->
    <div v-else class="quiz-feedback__banner quiz-feedback__banner--wrong">
      <span class="quiz-feedback__icon" aria-hidden="true">😊</span>
      <span class="quiz-feedback__text">Keep going — you are learning!</span>
    </div>

    <!-- Action buttons -->
    <div class="quiz-feedback__actions">
      <button
        v-if="canRetry && !isCorrect"
        class="quiz-feedback__retry-btn"
        aria-label="Try this question again"
        @click="emit('retry')"
      >
        ↺ Try again
      </button>

      <button
        v-if="canProceed && (isCorrect || showExplanation)"
        class="quiz-feedback__next-btn"
        :aria-label="isLastQuestion ? 'Finish quiz' : 'Next question'"
        @click="emit('next')"
      >
        {{ isLastQuestion ? '🏆 Finish Quiz' : 'Next →' }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;
.quiz-feedback {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-3);

  &__banner {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    border: 2px solid;

    &--correct {
      background: rgba(76, 175, 80, 0.12);
      border-color: var(--status-living);
      color: #1b5e20;
    }

    &--retry {
      background: rgba(255, 152, 0, 0.12);
      border-color: var(--status-at-risk);
      color: var(--color-text);
    }

    &--wrong {
      background: rgba(244, 67, 54, 0.1);
      border-color: var(--status-endangered);
      color: var(--color-text);
    }
  }

  &__learn {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__learn-intro {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) 0;
  }

  &__learn-icon {
    font-size: 22px;
    flex-shrink: 0;
  }

  &__learn-title {
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-weight: 800;
    color: var(--color-text);
  }

  &__icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  &__text {
    font-family: var(--font-body);
    font-size: var(--text-md);
    font-weight: 700;
  }

  &__explanation {
    background: var(--color-bg);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    font-family: var(--font-body);
    font-size: var(--text-md);
    font-weight: 600;
    color: var(--color-text-light);
    font-style: italic;
  }

  &__actions {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
    align-items: center;
  }

  &__retry-btn {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 800;
    padding: var(--space-3) var(--space-5);
    background: var(--btn-gray-bg);
    border: 3px solid var(--btn-gray-border);
    border-radius: var(--radius-sm);
    color: #fff;
    cursor: pointer;
    box-shadow: 0 3px 0 var(--btn-gray-border);
    min-height: 44px;
    transition: transform var(--transition-fast);

    &:hover {
      background: #757575;
    }
    &:active {
      transform: translateY(3px);
      box-shadow: none;
    }
    &:focus-visible {
      outline: 3px solid var(--color-secondary);
      outline-offset: 2px;
    }
  }

  &__next-btn {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 800;
    padding: var(--space-3) var(--space-6);
    background: var(--btn-green-bg);
    border: 3px solid var(--btn-green-border);
    border-radius: var(--radius-sm);
    color: #fff;
    cursor: pointer;
    box-shadow: 0 3px 0 var(--btn-green-border);
    min-height: 44px;
    transition: transform var(--transition-fast);

    &:hover {
      background: #43a047;
    }
    &:active {
      transform: translateY(3px);
      box-shadow: none;
    }
    &:focus-visible {
      outline: 3px solid var(--color-secondary);
      outline-offset: 2px;
    }
  }
}

@media (min-width: $bp-lg) {
  .quiz-feedback {
    gap: var(--space-2);
    margin-top: var(--space-2);

    &__banner {
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
    }

    &__explanation {
      padding: var(--space-2) var(--space-3);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .quiz-feedback__retry-btn,
  .quiz-feedback__next-btn {
    transition: none;
    &:active {
      transform: none;
    }
  }
}
</style>
