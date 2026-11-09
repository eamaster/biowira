<script setup lang="ts">
import type { QuizAttempt } from '@/domain/quiz'
import { getDotModel } from './quizProgressUtils'

defineProps<{
  currentIndex: number
  totalQuestions: number
  attempts: QuizAttempt[]
}>()
</script>

<template>
  <nav
    class="quiz-progress-nav"
    aria-label="Quiz question progress"
    role="navigation"
  >
    <span class="quiz-progress-nav__label">
      Question {{ currentIndex + 1 }} of {{ totalQuestions }}
    </span>
    <ol class="quiz-progress-nav__dots" aria-label="Question list">
      <li
        v-for="i in totalQuestions"
        :key="i"
        class="quiz-progress-nav__dot-wrap"
        :aria-label="`Question ${i}`"
        :aria-current="i - 1 === currentIndex ? 'step' : undefined"
      >
        <span
          :class="[
            'quiz-progress-nav__dot',
            `quiz-progress-nav__dot--${getDotModel(i - 1, attempts, currentIndex).status}`,
            { 'quiz-progress-nav__dot--current': getDotModel(i - 1, attempts, currentIndex).isCurrent },
          ]"
        >{{ i }}</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.quiz-progress-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  box-shadow: 2px 2px 0 var(--color-border);

  &__label {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 800;
    color: var(--color-text-light);
  }

  &__dots {
    display: flex;
    gap: var(--space-2);
    list-style: none;
    align-items: center;
    flex-wrap: wrap;
  }

  &__dot-wrap {
    list-style: none;
  }

  &__dot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-weight: 900;
    border: 2px solid;
    transition: all var(--transition-fast);
    position: relative;

    // ── Status variants ───────────────────────────────────────────────────────
    &--pending {
      background: var(--color-bg);
      border-color: var(--color-border);
      color: var(--color-text);
    }

    // Same tokens as answer buttons; missing --status-living/--status-at-risk broke fill + left #fff text.
    &--answered {
      background: var(--answer-default-bg);
      border-color: var(--answer-default-border);
      color: var(--color-text-on-dark);
    }

    &--correct {
      background: var(--answer-correct-bg);
      border-color: var(--answer-correct-border);
      color: var(--color-text-on-dark);
    }

    &--wrong {
      background: var(--answer-wrong-bg);
      border-color: var(--answer-wrong-border);
      color: var(--color-text-on-dark);
    }

    // ── Current-step overlay ──────────────────────────────────────────────────
    // Applied in addition to the status variant — keeps the current question
    // visually prominent even after it has been answered.
    &--current {
      outline: 3px solid var(--color-secondary);
      outline-offset: 3px;
      z-index: 1;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .quiz-progress-nav__dot {
    transition: none;
  }
}

@media (min-width: $bp-lg) {
  .quiz-progress-nav {
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);

    &__label {
      font-size: var(--text-xs);
    }
  }
}
</style>
