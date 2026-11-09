<script setup lang="ts">
const emit = defineEmits<{ create: [] }>()
</script>

<template>
  <button
    class="create-card"
    type="button"
    aria-label="Create a new explorer profile"
    @click="emit('create')"
  >
    <span class="create-card__plus" aria-hidden="true">＋</span>
    <span class="create-card__label">New Explorer</span>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.create-card {
  background: rgba(255,255,255,0.12);
  border: 3px dashed rgba(255,255,255,0.5);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  min-height: 180px;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
  padding: var(--space-5) var(--space-4);

  &:hover, &:focus-visible {
    background: rgba(255,255,255,0.22);
    border-color: rgba(255,255,255,0.8);
    outline: none;
  }

  &:focus-visible {
    outline: 3px solid var(--color-secondary);
    outline-offset: 3px;
  }

  &__plus {
    font-size: 48px;
    color: rgba(255,255,255,0.9);
    line-height: 1;
  }

  &__label {
    font-family: var(--font-readable);
    font-weight: 800;
    font-size: var(--text-sm);
    color: rgba(255,255,255,0.9);
    text-align: center;
  }
}
</style>
