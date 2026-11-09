<script setup lang="ts">
import { computed } from 'vue'
import type { AnimalListItem } from '@/domain/animal'
import AnimalListCard from './AnimalListCard.vue'

const props = defineProps<{
  animals: AnimalListItem[]
  currentPage: number
  totalPages: number
}>()
const emit = defineEmits<{
  'select-animal': [animal: AnimalListItem]
  'page-change': [page: number]
}>()

/** Show at most 3 page buttons centered around the current page. */
const visiblePages = computed(() => {
  const total = props.totalPages
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1)
  let start = Math.max(1, props.currentPage - 1)
  let end = start + 2
  if (end > total) {
    end = total
    start = end - 2
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})
</script>

<template>
  <div class="animal-card-list-wrapper">
    <div class="animal-card-list">
      <div v-if="animals.length === 0" class="animal-card-list__empty">
        No animals found in this category.
      </div>
      <AnimalListCard
        v-for="animal in animals"
        :key="animal.listKey"
        :animal="animal"
        @select="emit('select-animal', animal)"
      />
    </div>

    <!-- Pagination -->
    <nav v-if="totalPages > 1" class="pagination" aria-label="Animal list pagination">
      <button
        class="pagination__btn"
        :disabled="currentPage <= 1"
        aria-label="Previous page"
        @click="emit('page-change', currentPage - 1)"
      >
        <i class="fa-solid fa-chevron-left"></i>
      </button>

      <button
        v-for="page in visiblePages"
        :key="page"
        class="pagination__btn"
        :class="{ 'pagination__btn--active': page === currentPage }"
        :aria-current="page === currentPage ? 'page' : undefined"
        @click="emit('page-change', page)"
      >
        {{ page }}
      </button>

      <button
        class="pagination__btn"
        :disabled="currentPage >= totalPages"
        aria-label="Next page"
        @click="emit('page-change', currentPage + 1)"
      >
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.animal-card-list-wrapper {
  width: 100%;
}

.animal-card-list {
  display: grid;
  grid-template-columns: 1fr; /* Mobile: 1 column */
  gap: var(--space-4);
  padding: var(--space-2) 0;
  margin: 0 auto;
  max-width: 1400px; /* roomy full container width */

  @media (min-width: 768px) {
    /* Tablet: roomy 1 column or 2 columns if container allows */
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  }

  @media (min-width: 1024px) {
    /* Desktop: 2 columns, or possibly 3 if wide enough */
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  }

  &__empty {
    grid-column: 1 / -1;
    text-align: center;
    font-family: var(--font-body);
    font-size: var(--text-lg);
    color: var(--color-text-muted);
    padding: var(--space-8);
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-6);
  padding: var(--space-3) 0;

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 40px;
    padding: 0 var(--space-2);
    border: 2px solid var(--color-primary);
    border-radius: 8px;
    background: var(--color-bg-card);
    color: var(--color-primary);
    font-family: var(--font-body);
    font-size: var(--text-base);
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, transform 0.1s;

    &:hover:not(:disabled) {
      background: var(--color-primary-light);
      color: #fff;
      transform: translateY(-1px);
    }

    &--active {
      background: var(--color-primary);
      color: #fff;
      cursor: default;
      transform: none;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}
</style>
