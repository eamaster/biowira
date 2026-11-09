<script setup lang="ts">
import type { GameJournalCategoryId } from '@/domain/gameJournal'

defineProps<{
  categoryId: GameJournalCategoryId
  title: string
  description: string
  icon: string
  hasRecords: boolean
  recordCount: number
  unlockedStampCount: number
  totalStampCount: number
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    class="journal-category-card"
    :class="hasRecords ? 'journal-category-card--active' : 'journal-category-card--empty'"
    :data-testid="`journal-category-card-${categoryId}`"
    :aria-label="`${title} — ${hasRecords ? `${recordCount} completed` : 'no records yet'}`"
    type="button"
    @click="emit('click')"
  >
    <!-- Icon -->
    <div class="journal-category-card__icon" aria-hidden="true">{{ icon }}</div>

    <!-- Title + description -->
    <div class="journal-category-card__body">
      <span class="journal-category-card__title">{{ title }}</span>
      <span class="journal-category-card__desc">{{ description }}</span>
    </div>

    <!-- Stats -->
    <div class="journal-category-card__stats">
      <span v-if="hasRecords" class="journal-category-card__stat journal-category-card__stat--active">
        {{ unlockedStampCount }}/{{ totalStampCount }} stamps
      </span>
      <span v-else class="journal-category-card__stat journal-category-card__stat--empty">
        No stamps yet
      </span>
    </div>

    <!-- Locked overlay -->
    <div v-if="!hasRecords" class="journal-category-card__locked-hint" aria-hidden="true">
      🔒
    </div>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.journal-category-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-4);
  border-radius: var(--radius-xl);
  border: 3px solid var(--color-border);
  background: var(--color-bg-card);
  box-shadow: var(--pixel-shadow);
  cursor: pointer;
  text-align: center;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  min-height: 180px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--pixel-shadow-lg);
  }

  &:active {
    transform: translateY(0);
  }

  &--active {
    border-color: var(--color-primary);
    background: rgba(90, 170, 60, 0.06);
  }

  &--empty {
    opacity: 0.75;
    border-style: dashed;
  }

  &__icon {
    font-size: 40px;
    line-height: 1;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    flex: 1;
  }

  &__title {
    font-family: var(--font-readable);
    font-size: clamp(14px, 2vw, 18px);
    font-weight: 900;
    color: var(--color-text);
  }

  &__desc {
    font-family: var(--font-body);
    font-size: clamp(12px, 1.4vw, 14px);
    font-weight: 700;
    color: var(--color-text-muted);
    line-height: 1.4;
  }

  &__stats {
    margin-top: auto;
  }

  &__stat {
    font-family: var(--font-readable);
    font-size: var(--text-xs);
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 99px;

    &--active {
      background: rgba(90, 170, 60, 0.15);
      color: var(--color-primary);
      border: 1px solid var(--color-primary);
    }

    &--empty {
      background: rgba(160, 160, 160, 0.1);
      color: var(--color-text-muted);
      border: 1px solid rgba(160, 160, 160, 0.3);
    }
  }

  &__locked-hint {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    font-size: 18px;
    opacity: 0.6;
  }
}
</style>
