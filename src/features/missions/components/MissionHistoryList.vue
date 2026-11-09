<script setup lang="ts">
import type { MissionHistoryItem } from '@/domain/missionApi.dto'
import { LEAF_POINTS_LABEL } from '@/domain/pointsCurrency'

defineProps<{
  history: MissionHistoryItem[]
}>()

function formatDate(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="mission-history">
    <h3 class="mission-history__title">Recent Missions</h3>
    <p v-if="history.length === 0" class="mission-history__empty">
      You haven&apos;t finished a mission yet — when you tap <strong>Done!</strong>, it will show up here. You&apos;ve got this!
    </p>
    <ul v-else class="mission-history__list">
      <li
        v-for="entry in history"
        :key="`${entry.missionId}-${entry.completedAt}`"
        class="mission-history__item"
      >
        <div class="mission-history__item-info">
          <span class="mission-history__item-title">{{ entry.title }}</span>
          <span class="mission-history__item-type">{{ entry.typeName }}</span>
        </div>
        <div class="mission-history__item-right">
          <span class="mission-history__item-points">+{{ entry.pointsEarned }} {{ LEAF_POINTS_LABEL }}</span>
          <span class="mission-history__item-date">{{ formatDate(entry.completedAt) }}</span>
        </div>
      </li>
    </ul>
    <p v-if="history.length > 0" class="mission-history__note">
      Showing your last {{ history.length }} mission{{ history.length > 1 ? 's' : '' }}.
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.mission-history {
  background: white;
  border-radius: var(--radius-lg);
  border: var(--pixel-border) dashed var(--color-border);
  padding: var(--space-4);

  &__title {
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-weight: 800;
    color: var(--color-text);
    margin: 0 0 var(--space-3) 0;
  }

  &__empty {
    font-family: var(--font-body);
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
    line-height: 1.45;
  }

  &__note {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--color-text-light);
    margin: var(--space-3) 0 0;
    text-align: center;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    max-height: 220px;
    overflow-y: auto;

    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 3px; }
  }

  &__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--color-bg);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    gap: var(--space-2);
  }

  &__item-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__item-title {
    font-family: var(--font-body);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item-type {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--color-text-light);
  }

  &__item-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
  }

  &__item-points {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-weight: 800;
    color: #4CAF50;
  }

  &__item-date {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-light);
  }
}
</style>
