<script setup lang="ts">
defineProps<{
  message?: string
}>()

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="error-state">
    <div class="error-state__emoji">😿</div>
    <div class="error-state__title">Oops! Something went wrong</div>
    <div class="error-state__message">{{ message ?? 'Please try again.' }}</div>
    <button class="error-state__retry" @click="emit('retry')">Try Again 🔄</button>
  </div>
</template>

<style scoped lang="scss">
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-12) var(--space-6);
  text-align: center;

  &__emoji { font-size: 64px; }

  &__title {
    font-family: var(--font-readable);
    font-weight: 800;
    font-size: var(--text-lg);
    color: var(--color-text);
  }

  &__message {
    font-family: var(--font-body);
    font-size: var(--text-md);
    color: var(--color-text-light);
  }

  &__retry {
    font-family: var(--font-readable);
    font-weight: 800;
    font-size: var(--text-base);
    padding: 10px 20px;
    background: var(--btn-green-bg);
    border: 3px solid var(--btn-green-border);
    border-radius: var(--radius-sm);
    color: #fff;
    cursor: pointer;
    box-shadow: 0 4px 0 var(--btn-green-border);
    &:active { transform: translateY(4px); box-shadow: none; }
  }
}
</style>
