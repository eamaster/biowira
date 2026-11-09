<script setup lang="ts">
import { onMounted, computed, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/app/config'
import { useDiscoverStore } from '@/stores/discoverStore'
import { AnimalCategory } from '@/domain/enums'
import DiscoverFilterBar from './components/DiscoverFilterBar.vue'
import AnimalCardList from './components/AnimalCardList.vue'
import AnimalProfileSheet from './components/AnimalProfileSheet.vue'
import AnimalOccurrencesMap from './components/AnimalOccurrencesMap.vue'
import BioWiraScenePage from '@/components/layout/BioWiraScenePage.vue'
import PixelLoadingState from '@/components/ui/PixelLoadingState.vue'
import PixelErrorState from '@/components/ui/PixelErrorState.vue'
import PixelButton from '@/components/ui/PixelButton.vue'
import type { AnimalListItem } from '@/domain/animal'

const route = useRoute()
const router = useRouter()
const store = useDiscoverStore()
const initialFocusHandled = ref(false)

/** Fixed filter tabs so every group stays visible even when the active list is filtered. */
const availableCategories = computed(() => [
  AnimalCategory.All,
  AnimalCategory.Mammals,
  AnimalCategory.Birds,
  AnimalCategory.Reptiles,
  AnimalCategory.MarineFreshwater,
  AnimalCategory.Amphibians,
  AnimalCategory.Insects,
])

function stripFocusAnimalQuery() {
  if (route.query.focusAnimal === undefined) return
  const next = { ...route.query } as Record<string, string | string[] | undefined>
  delete next.focusAnimal
  void router.replace({ name: ROUTE_NAMES.discover, query: next })
}

/** Open profile for `focusAnimal` query (from Home Continue Learning), then remove the query. */
async function runFocusFromRoute() {
  const raw = route.query.focusAnimal
  const focusId =
    typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() ?? '' : ''
  if (!focusId) return
  await store.openAnimalFromFocusIdIfPresent(focusId)
  stripFocusAnimalQuery()
}

onMounted(async () => {
  await store.fetchAnimals()
  await runFocusFromRoute()
  initialFocusHandled.value = true
})

watch(
  () => route.query.focusAnimal,
  async (focus) => {
    if (!initialFocusHandled.value || store.loading) return
    if (focus === undefined || focus === null || focus === '') return
    await runFocusFromRoute()
  },
)

async function onSelectAnimal(animal: AnimalListItem) {
  await store.openAnimalProfile(animal)
}

const chatPlacement = computed(() => {
  if (store.activeView === 'list') return 'sky-left'
  if (store.activeView === 'detail') return 'detail-safe'
  return 'side-left' // map view
})
</script>

<template>
  <BioWiraScenePage
    title="Discover Animals"
    subtitle="Explore Malaysia's amazing wildlife and learn what makes each animal special."
    content-width="wide"
    show-animal-chat
    :animal-chat-placement="chatPlacement"
  >
    <div class="discover-page">
      <!-- LIST VIEW -->
      <div v-if="store.activeView === 'list'" class="view-list discover-page__surface">
        <DiscoverFilterBar
          :active-category="store.activeCategory"
          :categories="availableCategories"
          class="discover-page__filter-bar"
          @update:active-category="(c) => store.setCategory(c)"
        />

        <div v-if="store.detailNotice" class="discover-page__notice" role="status">
          <p class="discover-page__notice-text">{{ store.detailNotice }}</p>
          <PixelButton variant="gray" size="sm" @click="store.clearDetailNotice">OK</PixelButton>
        </div>

        <PixelLoadingState v-if="store.loading" message="Finding animals..." />
        <PixelLoadingState v-else-if="store.detailLoading" message="Loading animal..." />
        <PixelErrorState
          v-else-if="store.error"
          :message="store.error"
          @retry="store.fetchAnimals()"
        />
        <AnimalCardList
          v-else
          :animals="store.filteredAnimals"
          :current-page="store.currentPage"
          :total-pages="store.totalPages"
          @select-animal="onSelectAnimal"
          @page-change="store.goToPage"
        />
      </div>

      <!-- DETAIL VIEW -->
      <div
        v-else-if="store.activeView === 'detail' && store.selectedAnimal"
        class="view-detail discover-page__surface discover-page__surface--detail"
      >
        <PixelLoadingState v-if="store.mapLoading" message="Loading map..." />
        <AnimalProfileSheet
          v-else
          :animal="store.selectedAnimal"
          @view-on-map="store.openOccurrencesMap"
          @close="store.closeAnimalProfile"
        />
      </div>

      <!-- MAP VIEW -->
      <div
        v-else-if="store.activeView === 'map' && store.selectedAnimal"
        class="view-map discover-page__surface discover-page__surface--map"
      >
        <AnimalOccurrencesMap
          :animal="store.selectedAnimal"
          @close="store.closeOccurrencesMap"
        />
      </div>
    </div>
  </BioWiraScenePage>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.discover-page {
  width: 100%;

  &__filter-bar {
    margin-bottom: var(--space-5);
  }

  &__notice {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg-card);
    border: var(--pixel-border) solid var(--color-border);
    border-radius: var(--radius-md);
  }

  &__notice-text {
    flex: 1;
    min-width: 200px;
    margin: 0;
    font-family: var(--font-body);
    font-size: var(--text-md);
    color: var(--color-text);
    line-height: 1.5;
  }
}

.discover-page__surface {
  background: rgba(255, 248, 231, 0.82);
  border: var(--pixel-border) solid rgba(145, 111, 64, 0.35);
  border-radius: var(--radius-xl);
  box-shadow: 6px 6px 0 rgba(61, 43, 31, 0.12);
  backdrop-filter: blur(2px);
  
  /* Shared surface width strategy */
  width: min(calc(100% - clamp(24px, 6vw, 72px)), 1180px);
  margin: 0 auto;
}

.discover-page__surface--map {
  backdrop-filter: blur(4px);
}

.view-list {
  padding: var(--space-4);
}

.view-detail {
  padding: var(--space-4);
}

.view-map {
  padding: var(--space-4) 0;
  height: 100%;
}
</style>
