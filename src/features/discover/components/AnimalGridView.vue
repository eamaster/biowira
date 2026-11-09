<script setup lang="ts">
import type { Animal } from '@/domain/animal'
import AnimalGridCard from './AnimalGridCard.vue'
import PixelEmptyState from '@/components/ui/PixelEmptyState.vue'

defineProps<{
  animals: Animal[]
}>()

const emit = defineEmits<{
  selectAnimal: [animal: Animal]
}>()
</script>

<template>
  <div>
    <PixelEmptyState
      v-if="animals.length === 0"
      emoji="🔍"
      title="No animals found"
      description="Try selecting a different category to find more animals!"
    />

    <div
      v-else
      class="animal-grid"
      role="list"
      aria-label="Animal grid"
    >
      <div
        v-for="animal in animals"
        :key="animal.id"
        role="listitem"
      >
        <AnimalGridCard
          :animal="animal"
          @select="emit('selectAnimal', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.animal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: var(--space-4);

  @media (max-width: $bp-sm) {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }

  @media (max-width: 360px) {
    grid-template-columns: 1fr;
  }
}
</style>
