<script setup lang="ts">
import type { QuizAnswer } from '@/domain/quiz'

export type OptionState = 'default' | 'correct' | 'wrong' | 'revealed-correct' | 'idle'

const props = defineProps<{
  answer: QuizAnswer
  state: OptionState
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [answerId: string]
}>()

// `data-sfx="none"` on the button: AppAudioController skips global tap; QuizPage watcher plays `answer-correct` / `answer-wrong`.

function onClick() {
  if (!props.disabled && (props.state === 'default')) {
    emit('select', props.answer.id)
  }
}
</script>

<template>
  <button
    class="quiz-option"
    :class="`quiz-option--${state}`"
    data-sfx="none"
    data-testid="quiz-option"
    :data-state="state"
    :disabled="disabled || state !== 'default'"
    :aria-pressed="state === 'correct' || state === 'wrong'"
    :aria-label="`Answer option ${answer.label}: ${answer.text}`"
    @click="onClick"
  >
    <span class="quiz-option__label" aria-hidden="true">{{ answer.label }}</span>
    <span class="quiz-option__text">{{ answer.text }}</span>
    <span v-if="state === 'correct'" class="quiz-option__icon" aria-hidden="true">✓</span>
    <span v-else-if="state === 'revealed-correct'" class="quiz-option__icon" aria-hidden="true">✓</span>
    <span v-else-if="state === 'wrong'" class="quiz-option__icon" aria-hidden="true">✗</span>
  </button>
</template>

<style scoped lang="scss">
.quiz-option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 3px solid;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
  width: 100%;
  min-height: 56px; // large tap target
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
  position: relative;

  // Default state
  &--default {
    background: var(--answer-default-bg);
    border-color: var(--answer-default-border);
    color: #fff;
    box-shadow: 0 3px 0 var(--answer-default-border);

    &:hover:not(:disabled) {
      background: #30a8ba;
      transform: translateY(-2px);
      box-shadow: 0 5px 0 var(--answer-default-border);
    }
    &:active:not(:disabled) {
      transform: translateY(3px);
      box-shadow: none;
    }
    &:focus-visible {
      outline: 3px solid var(--color-secondary);
      outline-offset: 2px;
    }
  }

  // Correct
  &--correct {
    background: var(--answer-correct-bg);
    border-color: var(--answer-correct-border);
    color: #fff;
    box-shadow: 0 3px 0 var(--answer-correct-border);
    animation: pulse-correct 0.4s ease;
    cursor: default;
  }

  // Wrong (user selected this, it's wrong)
  &--wrong {
    background: var(--answer-wrong-bg);
    border-color: var(--answer-wrong-border);
    color: #fff;
    box-shadow: 0 3px 0 var(--answer-wrong-border);
    animation: shake 0.4s ease;
    cursor: default;
  }

  // Revealed correct (shown after all retries exhausted, not the user's selection)
  &--revealed-correct {
    background: var(--answer-correct-bg);
    border-color: var(--answer-correct-border);
    color: #fff;
    box-shadow: 0 3px 0 var(--answer-correct-border);
    cursor: default;
  }

  // Idle (unchosen option when question is answered)
  &--idle {
    background: rgba(74, 191, 207, 0.35);
    border-color: rgba(2, 136, 209, 0.4);
    color: rgba(255, 255, 255, 0.7);
    box-shadow: none;
    cursor: default;
  }

  &__label {
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-weight: 800;
    background: rgba(0, 0, 0, 0.2);
    border-radius: var(--radius-sm);
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__text {
    font-size: var(--text-md);
    font-weight: 700;
    line-height: 1.3;
    flex: 1;
  }

  &__icon {
    font-size: 20px;
    flex-shrink: 0;
    font-weight: 900;
  }
}

@keyframes pulse-correct {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

@media (prefers-reduced-motion: reduce) {
  .quiz-option--correct { animation: none; }
  .quiz-option--wrong { animation: none; }
  .quiz-option--default:hover:not(:disabled) { transform: none; }
  .quiz-option--default:active:not(:disabled) { transform: none; }
}
</style>
