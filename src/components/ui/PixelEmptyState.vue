<script setup lang="ts">
defineProps<{
  emoji?: string
  title: string
  description?: string
}>()
</script>

<template>
  <div class="empty-state">
    <div v-if="emoji" class="empty-state__emoji">{{ emoji }}</div>
    <div class="empty-state__title">{{ title }}</div>
    <div v-if="description" class="empty-state__desc">{{ description }}</div>
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.empty-state {
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
    line-height: 1.4;
  }

  &__desc {
    font-family: var(--font-body);
    font-size: var(--text-md);
    color: var(--color-text-light);
    max-width: 320px;
  }
}
</style>
