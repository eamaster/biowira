<script setup lang="ts">
import { computed } from 'vue'
import type { Animal } from '@/domain/animal'
import { STATUS_COLORS, STATUS_LABELS } from '@/app/config'
import DiscoverAnimalIcon from '@/components/ui/DiscoverAnimalIcon.vue'

const props = defineProps<{
  animal: Animal
}>()

const emit = defineEmits<{
  select: [animal: Animal]
}>()

const borderColor = computed(() => STATUS_COLORS[props.animal.conservationStatus] ?? 'var(--color-border)')
const statusLabel = computed(() => STATUS_LABELS[props.animal.conservationStatus] ?? props.animal.conservationStatus)
</script>

<template>
  <button
    class="animal-grid-card"
    data-testid="animal-grid-card"
    :style="{ '--card-border': borderColor }"
    :aria-label="`View ${animal.commonName}, status: ${statusLabel}`"
    @click="emit('select', animal)"
  >
    <div class="animal-grid-card__icon" aria-hidden="true">
      <DiscoverAnimalIcon
        :visual-key="animal.visualKey"
        :common-name="animal.commonName"
        :fallback-emoji="animal.iconEmoji"
        :alt="animal.commonName"
        size="72px"
      />
    </div>
    <div class="animal-grid-card__name">{{ animal.commonName }}</div>
    <div class="animal-grid-card__status" :style="{ color: borderColor }">{{ statusLabel }}</div>
  </button>
</template>

<style scoped lang="scss">
.animal-grid-card {
  background: var(--color-bg-card);
  border: 3px solid var(--card-border, var(--color-border));
  border-radius: var(--radius-md);
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.15);
  padding: var(--space-4);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  text-align: center;
  width: 100%;
  min-height: 130px;
  transition: transform var(--transition-base), box-shadow var(--transition-base);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 5px 6px 0 rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.15);
  }

  &:focus-visible {
    outline: 3px solid var(--color-secondary);
    outline-offset: 2px;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
  }

  &__name {
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-weight: 800;
    color: var(--color-text);
    line-height: 1.2;
  }

  &__status {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 800;
  }
}

@media (prefers-reduced-motion: reduce) {
  .animal-grid-card {
    transition: none;
    &:hover { transform: none; }
    &:active { transform: none; }
  }
}
</style>
