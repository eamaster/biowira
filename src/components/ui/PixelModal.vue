<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue'

const props = defineProps<{
  modelValue: boolean
  title?: string
  maxWidth?: string
  /** data-testid forwarded to the modal panel (not inherited through Teleport automatically) */
  testid?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const titleId = `modal-title-${Math.random().toString(36).slice(2)}`
const closeButtonRef = ref<HTMLButtonElement | null>(null)

function close() {
  emit('update:modelValue', false)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))

// Focus close button when modal opens
import { watch } from 'vue'
watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await nextTick()
      closeButtonRef.value?.focus()
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="modal-backdrop"
        role="presentation"
        @click.self="close"
      >
        <Transition name="scale">
          <div
            v-if="modelValue"
            class="modal"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title ? titleId : undefined"
            :data-testid="testid"
            :style="{ maxWidth: maxWidth ?? '560px' }"
          >
            <div class="modal__header">
              <span
                v-if="title"
                :id="titleId"
                class="modal__title"
              >{{ title }}</span>
              <button
                ref="closeButtonRef"
                class="modal__close"
                aria-label="Close dialog"
                @click="close"
              >✕</button>
            </div>
            <div class="modal__body">
              <slot></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.modal {
  background: var(--color-bg-card);
  border: var(--pixel-border-thick) solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.25);
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-bottom: 2px solid var(--color-border-light);
  }

  &__title {
    font-family: var(--font-readable);
    font-size: var(--text-lg);
    font-weight: 800;
    color: var(--color-text);
  }

  &__close {
    cursor: pointer;
    font-size: 18px;
    color: var(--color-text-muted);
    background: none;
    border: 2px solid transparent;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast);
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover { background: var(--color-border-light); }
    &:focus-visible {
      outline: 3px solid var(--color-secondary);
      outline-offset: 2px;
    }
  }

  &__body {
    padding: var(--space-5);
  }
}
</style>
