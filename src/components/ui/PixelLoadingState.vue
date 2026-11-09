<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="loading-state">
    <div class="loading-state__spinner">🌿</div>
    <div class="loading-state__message">{{ message ?? 'Loading...' }}</div>
  </div>
</template>

<style scoped lang="scss">
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-12) var(--space-6);
  text-align: center;

  &__spinner {
    font-size: 48px;
    animation: spin 1s linear infinite;
  }

  &__message {
    font-family: var(--font-readable);
    font-weight: 800;
    font-size: var(--text-base);
    color: var(--color-text-light);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
