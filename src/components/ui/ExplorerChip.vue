<script setup lang="ts">
import AnimalIcon from '@/components/ui/AnimalIcon.vue'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'
import { LEAF_POINTS_GAMEPLAY_ICON_KEY } from '@/domain/pointsCurrency'

defineProps<{
  animalVisualKey: string
  fallbackEmoji: string
  nickname: string
  level: number
}>()

const emit = defineEmits<{ 'open-switcher': [] }>()
</script>

<template>
  <button
    class="explorer-chip"
    type="button"
    :aria-label="`Explorer: ${nickname}, Level ${level}. Click to switch explorer.`"
    @click="emit('open-switcher')"
  >
    <span class="explorer-chip__avatar" aria-hidden="true">
      <AnimalIcon :icon-key="animalVisualKey" :fallback-emoji="fallbackEmoji" size="32px" />
    </span>
    <span class="explorer-chip__info">
      <span class="explorer-chip__name">{{ nickname }}</span>
      <span class="explorer-chip__level">
        <GameplayIcon :type="LEAF_POINTS_GAMEPLAY_ICON_KEY" size="11px" class="explorer-chip__level-icon" />
        LV {{ level }}
      </span>
    </span>
    <span class="explorer-chip__switch" aria-hidden="true">⇄</span>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.explorer-chip {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-bg-card);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-full);
  padding: 5px 12px 5px 7px;
  box-shadow: 2px 2px 0 var(--color-primary-dark);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 44px;

  &:hover {
    background: #fff;
    border-color: var(--color-secondary);
    box-shadow: 2px 2px 0 #b87800;
  }

  &:focus-visible {
    outline: 3px solid var(--color-secondary);
    outline-offset: 2px;
  }

  &__avatar {
    line-height: 0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  &__name {
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text);
    white-space: nowrap;
    max-width: 132px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__level {
    font-family: var(--font-readable);
    font-size: 14px;
    font-weight: 700;
    color: var(--color-primary);
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 2px;
  }

  &__level-icon {
    flex-shrink: 0;
    vertical-align: middle;
  }

  &__switch {
    font-size: 16px;
    color: var(--color-text-muted);
    flex-shrink: 0;
    margin-left: 2px;
  }
}
</style>
