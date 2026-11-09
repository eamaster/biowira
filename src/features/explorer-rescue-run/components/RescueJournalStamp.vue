<script setup lang="ts">
defineProps<{
  stampKey: string
  title: string
  unlocked: boolean
}>()
</script>

<template>
  <div :class="['journal-stamp', { 'journal-stamp--unlocked': unlocked, 'journal-stamp--locked': !unlocked }]">
    <div class="journal-stamp__inner">
      <div class="journal-stamp__icon" aria-hidden="true">
        <span v-if="unlocked">🌿🐾🦁</span>
        <span v-else>🔒</span>
      </div>
      <div class="journal-stamp__title">{{ unlocked ? title : 'More to Collect!' }}</div>
    </div>
    <div v-if="unlocked" class="journal-stamp__badge" aria-label="Unlocked">✓</div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.journal-stamp {
  position: relative;
  width: 110px;
  height: 110px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2);

  &--unlocked {
    background: var(--color-bg-card);
    border: 3px solid var(--color-secondary);
    box-shadow: var(--pixel-shadow-lg), 0 0 12px rgba(232, 160, 32, 0.3);
  }

  &--locked {
    background: rgba(0, 0, 0, 0.05);
    border: 2px dashed var(--color-border-light);
    opacity: 0.7;
  }

  &__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    text-align: center;
  }

  &__icon {
    font-size: 22px;
    line-height: 1;
    letter-spacing: -2px;
  }

  &__title {
    font-family: var(--font-readable);
    font-size: var(--text-xs);
    font-weight: 800;
    color: var(--color-text);
    line-height: 1.2;
  }

  &__badge {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 24px;
    height: 24px;
    background: #4CAF50;
    border: 2px solid #2E7D32;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: white;
    font-weight: bold;
  }
}
</style>
