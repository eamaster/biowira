<script setup lang="ts">
import { computed } from 'vue'
import type { ChildProfile } from '@/domain/session'
import ExplorerAnimalIcon from '@/features/welcome/components/ExplorerAnimalIcon.vue'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'
import PixelButton from '@/components/ui/PixelButton.vue'
import { findExplorerAnimalChoice } from '@/features/welcome/data/explorerAnimalCatalog'
import { formatLeafPointsCount, LEAF_POINTS_GAMEPLAY_ICON_KEY, LEAF_POINTS_LABEL } from '@/domain/pointsCurrency'

const props = defineProps<{ profile: ChildProfile }>()
const emit = defineEmits<{ continue: [] }>()

const catalogEntry = computed(
  () =>
    findExplorerAnimalChoice(props.profile.animalId) ??
    findExplorerAnimalChoice(props.profile.animalVisualKey),
)
const fallbackEmoji = computed(() => catalogEntry.value?.fallbackEmoji ?? '🐾')
const commonName = computed(() => catalogEntry.value?.commonName ?? props.profile.animalId)
</script>

<template>
  <div class="explorer-card" role="article" :aria-label="`Explorer: ${profile.displayNickname}`">
    <div class="explorer-card__avatar" aria-hidden="true">
      <ExplorerAnimalIcon
        :visual-key="profile.animalVisualKey"
        :common-name="commonName"
        :fallback-emoji="fallbackEmoji"
        size="56px"
      />
    </div>
    <div class="explorer-card__name">{{ profile.displayNickname }}</div>
    <div class="explorer-card__level">
      <GameplayIcon :type="LEAF_POINTS_GAMEPLAY_ICON_KEY" size="13px" class="explorer-card__leaf-icon" />
      LV {{ profile.level }}
    </div>
    <div class="explorer-card__points">{{ formatLeafPointsCount(profile.leafPoints) }} {{ LEAF_POINTS_LABEL }}</div>
    <PixelButton variant="green" size="sm" full-width @click="emit('continue')">
      Continue →
    </PixelButton>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.explorer-card {
  background: var(--color-bg-card);
  border: var(--pixel-border-thick) solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 4px 4px 0 rgba(0,0,0,0.25);
  padding: var(--space-5) var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  min-height: 180px;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 4px 7px 0 rgba(0,0,0,0.25);
  }

  &:focus-within {
    outline: 3px solid var(--color-secondary);
    outline-offset: 3px;
  }

  &__avatar {
    line-height: 0;
    filter: drop-shadow(2px 2px 0 rgba(0,0,0,0.2));
  }

  &__name {
    font-family: var(--font-readable);
    font-weight: 800;
    font-size: var(--text-md);
    color: var(--color-text);
    text-align: center;
    word-break: break-word;
    line-height: 1.2;
  }

  &__level {
    display: flex;
    align-items: center;
    gap: 3px;
    font-family: var(--font-readable);
    font-weight: 800;
    font-size: var(--text-xs);
    color: var(--color-primary);
  }

  &__leaf-icon {
    flex-shrink: 0;
  }

  &__points {
    font-family: var(--font-body);
    font-weight: 700;
    font-size: var(--text-sm);
    color: var(--color-secondary);
    margin-bottom: var(--space-2);
  }
}
</style>
