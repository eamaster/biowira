<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useFunFactStore } from '@/stores/funFactStore'
import type { FunFact } from '@/domain/funFact'
import FunFactCard from './components/FunFactCard.vue'
import FunFactModal from './components/FunFactModal.vue'
import BioWiraScenePage from '@/components/layout/BioWiraScenePage.vue'
import PixelLoadingState from '@/components/ui/PixelLoadingState.vue'
import PixelErrorState from '@/components/ui/PixelErrorState.vue'
import PixelEmptyState from '@/components/ui/PixelEmptyState.vue'
import { resolveFunFactAccessState } from '@/domain/funFactAccess'

const store = useFunFactStore()

const modalOpen = computed({
  get: () => store.expandedFact !== null,
  set: (v) => { if (!v) store.closeFact() },
})

// Eager-load ALL facts (locked + unlocked) on mount so every card is visible.
onMounted(async () => {
  await store.fetchAllFacts()
})

function onOpenFact(fact: FunFact) {
  store.openFact(fact)
}

// Summary counts for the header chip
const unlockedCount = computed(() =>
  store.allFacts.filter((f) => {
    const s = resolveFunFactAccessState(f)
    return s.status !== 'unknown' ? s.isUnlocked : true
  }).length,
)
const totalCount = computed(() => store.allFacts.length)
</script>

<template>
  <BioWiraScenePage
    title="Fun Facts"
    subtitle="Read quick animal facts and discover something surprising."
    content-width="wide"
  >
    <div class="facts-page">
      <PixelLoadingState
        v-if="store.loadingAllFacts || store.loadingAnimals"
        message="Loading fun facts..."
      />
      <PixelErrorState
        v-else-if="store.error"
        :message="store.error"
        @retry="store.fetchAllFacts(true)"
      />
      <template v-else>
        <div class="facts-page__panel">
          <!-- Header -->
          <div class="facts-page__sort-header">
            <span class="facts-page__sort-label">🌿 Tap a card to flip and discover a fun fact!</span>
            <span class="facts-page__count">
              {{ unlockedCount }} / {{ totalCount }} unlocked
            </span>
          </div>

          <!-- Empty state -->
          <PixelEmptyState
            v-if="store.allFacts.length === 0"
            emoji="💡"
            title="No facts yet!"
            description="Check back soon for amazing animal facts."
          />

          <!-- Fact card grid: one card per fact (locked + unlocked) -->
          <div v-else class="facts-grid" role="list" aria-label="Animal fun facts">
            <div
              v-for="fact in store.allFacts"
              :key="fact.id"
              role="listitem"
            >
              <FunFactCard
                :fact="fact"
                @open-fact="onOpenFact"
              />
            </div>
          </div>
        </div>
      </template>
    </div>

    <FunFactModal
      v-model="modalOpen"
      :fact="store.expandedFact"
    />
  </BioWiraScenePage>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.facts-page {
  min-height: 0;

  &__panel {
    background: rgba(255, 248, 231, 0.86);
    border: var(--pixel-border) solid rgba(145, 111, 64, 0.35);
    border-radius: var(--radius-xl);
    box-shadow: 5px 5px 0 rgba(61, 43, 31, 0.12);
    padding: var(--space-4);
  }

  &__sort-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  &__sort-label {
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 700;
    color: var(--color-text-muted);
  }

  &__count {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 800;
    color: var(--color-text-muted);
  }
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: var(--space-6);
  padding-top: var(--space-4);
  padding-bottom: var(--space-10); // Space above footer/nav

  @media (max-width: $bp-sm) {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--space-4);
  }

  @media (max-width: 350px) {
    grid-template-columns: 1fr;
  }
}
</style>
