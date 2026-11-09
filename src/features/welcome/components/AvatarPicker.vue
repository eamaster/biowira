<script setup lang="ts">
import { ref } from 'vue'
import type { ExplorerAnimalChoice } from '@/features/welcome/data/explorerAnimalCatalog'
import ExplorerAnimalIcon from '@/features/welcome/components/ExplorerAnimalIcon.vue'

defineProps<{
  animals: ExplorerAnimalChoice[]
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [payload: { animalId: string; animalVisualKey: string }]
}>()
const hoveredId = ref<string | null>(null)
</script>

<template>
  <div v-if="loading" class="avatar-picker avatar-picker--loading" aria-live="polite">
    Loading animals…
  </div>
  <div
    v-else
    class="avatar-picker"
    role="group"
    aria-label="Choose your explorer animal"
  >
    <button
      v-for="animal in animals"
      :key="animal.choiceKey"
      class="avatar-picker__btn"
      :class="{ 'avatar-picker__btn--hovered': hoveredId === animal.choiceKey }"
      type="button"
      :aria-label="animal.label"
      @mouseenter="hoveredId = animal.choiceKey"
      @mouseleave="hoveredId = null"
      @focus="hoveredId = animal.choiceKey"
      @blur="hoveredId = null"
      @click="
        emit('select', {
          animalId: animal.backendAnimalId,
          animalVisualKey: animal.animalVisualKey,
        })
      "
    >
      <span class="avatar-picker__icon" aria-hidden="true">
        <ExplorerAnimalIcon
          :visual-key="animal.animalVisualKey"
          :common-name="animal.commonName"
          :fallback-emoji="animal.fallbackEmoji"
          size="44px"
        />
      </span>
      <span class="avatar-picker__label">{{ animal.label }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.avatar-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  width: 100%;
  max-width: 520px;

  &--loading {
    font-family: var(--font-body);
    font-size: var(--text-base);
    color: #fff;
    text-align: center;
    padding: var(--space-6);
  }

  @media (max-width: $bp-sm) {
    grid-template-columns: repeat(3, 1fr);
  }

  &__btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    background: rgba(255, 255, 255, 0.15);
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: var(--radius-lg);
    padding: var(--space-3) var(--space-2);
    cursor: pointer;
    transition: all var(--transition-bounce);
    min-width: 72px;
    min-height: 96px;

    &--hovered,
    &:focus-visible {
      background: rgba(255, 255, 255, 0.35);
      border-color: var(--color-secondary);
      transform: scale(1.08);
      box-shadow: 0 4px 0 rgba(0, 0, 0, 0.2);
      outline: none;
    }
  }

  &__icon {
    line-height: 0;
    filter: drop-shadow(2px 2px 0 rgba(0, 0, 0, 0.2));
  }

  &__label {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 700;
    color: #fff;
    text-align: center;
    line-height: 1.25;
    max-width: 100%;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    word-break: break-word;
  }
}
</style>
