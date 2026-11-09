<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: boolean
  /** Accessible label for the dialog (used by screen readers) */
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close() {
  emit('update:modelValue', false)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="sheet-backdrop" aria-hidden="true" @click.self="close"></div>
    </Transition>
    <Transition name="slide-up">
      <div
        v-if="modelValue"
        class="bottom-sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="label ?? 'Panel'"
        data-testid="bottom-sheet"
      >
        <!-- Drag handle (decorative, click to close) -->
        <button
          class="bottom-sheet__handle"
          aria-label="Close panel"
          @click="close"
        >
          <div class="handle-bar" aria-hidden="true"></div>
        </button>
        <div class="bottom-sheet__content">
          <slot></slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-overlay);
}

.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: calc(var(--z-overlay) + 1);
  background: var(--color-bg-card);
  border-top: 4px solid var(--color-border);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
  // Respect iOS safe area (home indicator bar)
  padding-bottom: env(safe-area-inset-bottom, 0);

  // Desktop: constrain width like a side panel
  @media (min-width: 768px) {
    max-width: 640px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: var(--radius-xl);
    bottom: var(--space-6);
    box-shadow: 0 -2px 30px rgba(0, 0, 0, 0.25);
  }

  &__handle {
    width: 100%;
    padding: var(--space-3) 0;
    display: flex;
    justify-content: center;
    cursor: pointer;
    background: none;
    border: none;

    &:focus-visible {
      outline: 3px solid var(--color-secondary);
      outline-offset: -3px;
    }
  }

  &__content {
    padding: 0 var(--space-4) var(--space-8);
  }
}

.handle-bar {
  width: 48px;
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-full);
}
</style>
