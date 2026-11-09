<script setup lang="ts">
import type { AnimalListItem } from '@/domain/animal'
import DiscoverAnimalIcon from '@/components/ui/DiscoverAnimalIcon.vue'
import PixelStatusBadge from '@/components/ui/PixelStatusBadge.vue'

/** Local BioWira spirit icons only — Discover list deliberately avoids backend photos (see detail sheet). */

defineProps<{ animal: AnimalListItem }>()
const emit = defineEmits<{ select: [] }>()
</script>

<template>
  <button
    class="animal-list-card"
    type="button"
    data-testid="animal-list-card"
    :aria-label="`View ${animal.commonName}`"
    @click="emit('select')"
  >
    <div class="animal-list-card__icon">
      <DiscoverAnimalIcon
        :visual-key="animal.visualKey"
        :common-name="animal.commonName"
        :fallback-emoji="animal.iconEmoji"
        size="48px"
        :alt="animal.commonName"
      />
    </div>
    <div class="animal-list-card__info">
      <span class="animal-list-card__name">{{ animal.commonName }}</span>
      <PixelStatusBadge
        :status="animal.conservationStatus"
        :label-override="animal.statusLabelOverride"
        size="sm"
      />
    </div>
    <div class="animal-list-card__chevron" aria-hidden="true">›</div>
  </button>
</template>

<style scoped lang="scss">
.animal-list-card {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--space-4);
  background: var(--color-bg-card);
  border: var(--pixel-border) solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  width: 100%;
  text-align: left;
  cursor: pointer;
  box-shadow: var(--pixel-shadow);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--pixel-shadow-lg);
  }

  &:active {
    transform: translateY(2px);
    box-shadow: none;
  }

  &__icon {
    flex-shrink: 0;
    width: 64px;
    height: 64px;
    background: var(--color-bg);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    align-items: flex-start;
  }

  &__name {
    font-family: var(--font-readable);
    font-weight: 800;
    color: var(--color-text);
    font-size: var(--text-base);
    line-height: 1.2;
    white-space: normal;
  }

  &__chevron {
    font-family: var(--font-readable);
    font-size: var(--text-2xl);
    font-weight: 800;
    color: var(--color-text-muted);
    padding-left: var(--space-2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animal-list-card {
    transition: none;
    &:hover, &:active { transform: none; }
  }
}
</style>
