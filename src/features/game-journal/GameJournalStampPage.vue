<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/app/config'
import { useGameJournalStore } from '@/stores/gameJournalStore'
import type { GameJournalCategoryId } from '@/domain/gameJournal'
import { GAME_JOURNAL_CATEGORIES } from './data/gameJournalCatalog'
import BioWiraScenePage from '@/components/layout/BioWiraScenePage.vue'
import PixelButton from '@/components/ui/PixelButton.vue'
import JournalSideArrow from './components/JournalSideArrow.vue'
import JournalActionBar from './components/JournalActionBar.vue'
import EcoComicJournalRecord from './components/renderers/EcoComicJournalRecord.vue'
import ExplorerRescueJournalRecord from './components/renderers/ExplorerRescueJournalRecord.vue'
import NatureMissionJournalRecord from './components/renderers/NatureMissionJournalRecord.vue'
import { useAppAudio } from '@/composables/useAppAudio'
import { resolveMissionJournalDisplay } from './data/journalMissionMapping'
import {
  buildEcoComicStampDefsForRecordAtIndex,
  sortEcoComicRecordsChronologically,
} from './utils/ecoComicJournalStampProgress'

const route = useRoute()
const router = useRouter()
const journalStore = useGameJournalStore()
const { sfx } = useAppAudio()

// ── Category resolution ──────────────────────────────────────────────────────

const VALID_CATEGORY_IDS: GameJournalCategoryId[] = [
  'nature-mission',
  'eco-comic',
  'explorer-rescue-run',
]

const categoryId = computed<GameJournalCategoryId | null>(() => {
  const id = String(route.params['categoryId'] ?? '')
  if (VALID_CATEGORY_IDS.includes(id as GameJournalCategoryId)) {
    return id as GameJournalCategoryId
  }
  return null
})

const categoryDef = computed(() => {
  if (!categoryId.value) return null
  return GAME_JOURNAL_CATEGORIES.find((c) => c.id === categoryId.value) ?? null
})

// ── Records + page index ──────────────────────────────────────────────────────

const pageIndex = ref(0)

const records = computed(() => {
  if (!categoryId.value) return []
  const list = journalStore.getRecordsForCategory(categoryId.value)
  if (categoryId.value === 'eco-comic') {
    return sortEcoComicRecordsChronologically(list)
  }
  return list
})

const currentRecord = computed(() => records.value[pageIndex.value] ?? null)

const stampDefs = computed(() => {
  if (!categoryId.value) return []
  if (categoryId.value === 'eco-comic') {
    const chronological = records.value
    const idx = currentRecord.value
      ? chronological.findIndex((r) => r.id === currentRecord.value!.id)
      : -1
    const safeIdx = idx >= 0 ? idx : 0
    return buildEcoComicStampDefsForRecordAtIndex(chronological, safeIdx)
  }
  return journalStore.categoryStampDefinitions(categoryId.value)
})

// ── Guard: redirect if invalid category or no records ─────────────────────────

onMounted(() => {
  if (!categoryId.value) {
    router.replace({ name: ROUTE_NAMES.gameJournalMenu })
    return
  }
  if (!journalStore.hasRecords(categoryId.value)) {
    router.replace({ name: ROUTE_NAMES.gameJournalMenu })
    return
  }
  pageIndex.value = 0
})

watch(categoryId, (newId) => {
  if (!newId) {
    router.replace({ name: ROUTE_NAMES.gameJournalMenu })
    return
  }
  pageIndex.value = 0
})

// ── Page navigation ────────────────────────────────────────────────────────────

const canGoPrev = computed(() => pageIndex.value > 0)
const canGoNext = computed(() => pageIndex.value < records.value.length - 1)
const hasMultiplePages = computed(() => records.value.length > 1)

function prevPage() {
  if (canGoPrev.value) {
    pageIndex.value--
    sfx('journal-flip')
  }
}

function nextPage() {
  if (canGoNext.value) {
    pageIndex.value++
    sfx('journal-flip')
  }
}

// ── Page subtitle ──────────────────────────────────────────────────────────────

const pageSubtitle = computed(() => {
  if (!categoryId.value) return 'Game Journal'
  if (categoryId.value === 'eco-comic') return 'Sunda Pangolin Eco-Comics'
  if (categoryId.value === 'explorer-rescue-run') return 'Explorer Rescue Run'
  if (categoryId.value === 'nature-mission') {
    const mTitle = currentRecord.value?.metadata?.missionTitle || currentRecord.value?.title
    return mTitle ? `${mTitle} — Nature Mission` : 'Nature Mission'
  }
  return categoryDef.value?.title ?? 'Game Journal'
})

// ── CTA resolution ────────────────────────────────────────────────────────────

const ctaLabel = computed(() => {
  const fromCatalog = categoryDef.value?.stampPageCtaLabel
  if (fromCatalog) return fromCatalog
  if (categoryId.value === 'eco-comic') return 'Go to Eco-Comic Path'
  if (categoryId.value === 'nature-mission') {
    const mTitle = currentRecord.value?.metadata?.missionTitle || currentRecord.value?.title
    return resolveMissionJournalDisplay(mTitle).ctaLabel
  }
  return 'Go to Games'
})

const ctaRouteName = computed(() => {
  if (categoryId.value === 'eco-comic') return ROUTE_NAMES.ecoComics
  /** Label from catalog is "Back to Nature Mission" — route to missions hub (not Explorer Rescue chapter). */
  if (categoryId.value === 'explorer-rescue-run') return ROUTE_NAMES.missions
  if (categoryId.value === 'nature-mission') return ROUTE_NAMES.missions
  return ROUTE_NAMES.games
})

// ── Fixed restoration from the current record (never dynamic global %) ────────

const rainforestPercent = computed(
  () => currentRecord.value?.restorationPercentAfter ?? 0,
)

// ── Stamp count for this category ─────────────────────────────────────────────

const stampCount = computed(() => {
  if (!categoryId.value) return null
  return journalStore.getStampCountForCategory(categoryId.value)
})
</script>

<template>
  <BioWiraScenePage
    title="Games Journal"
    :subtitle="pageSubtitle"
    content-width="wide"
    :show-decor="false"
  >
    <div
      class="journal-stamp-page"
      :data-testid="`journal-stamp-page-${categoryId}`"
    >
      <!-- Invalid category or no records fallback -->
      <template v-if="!categoryId || records.length === 0">
        <div class="journal-stamp-page__empty-fallback" role="status">
          <p>No records found for this category.</p>
          <PixelButton
            variant="gray"
            size="md"
            @click="router.push({ name: ROUTE_NAMES.gameJournalMenu })"
          >
            Back to Journal Menu
          </PixelButton>
        </div>
      </template>

      <template v-else-if="currentRecord">
        <!-- Stamp count chip -->
        <div
          v-if="stampCount"
          class="journal-stamp-page__stamp-count"
          data-testid="journal-stamp-count"
          aria-label="`${stampCount.label} earned`"
        >
          🏆 {{ stampCount.label }}
        </div>

        <!-- Page navigation row: [←] [Book/Renderer] [→] -->
        <div class="journal-stamp-page__nav-row">
          <!-- Left arrow (only when prev page exists) -->
          <JournalSideArrow
            v-if="hasMultiplePages && canGoPrev"
            direction="prev"
            aria-label="Previous journal page"
            @click="prevPage"
          />
          <div
            v-else-if="hasMultiplePages"
            class="journal-stamp-page__arrow-spacer"
            aria-hidden="true"
          ></div>

          <!-- Category-specific renderer (each renderer includes JournalBookFrame) -->
          <div class="journal-stamp-page__renderer">
            <EcoComicJournalRecord
              v-if="categoryId === 'eco-comic'"
              :record="currentRecord"
              :stamp-defs="stampDefs"
              :rainforest-percent="rainforestPercent"
            />
            <ExplorerRescueJournalRecord
              v-else-if="categoryId === 'explorer-rescue-run'"
              :record="currentRecord"
              :rainforest-percent="rainforestPercent"
            />
            <NatureMissionJournalRecord
              v-else-if="categoryId === 'nature-mission'"
              :record="currentRecord"
              :rainforest-percent="rainforestPercent"
            />
          </div>

          <!-- Right arrow (only when next page exists) -->
          <JournalSideArrow
            v-if="hasMultiplePages && canGoNext"
            direction="next"
            aria-label="Next journal page"
            @click="nextPage"
          />
          <div
            v-else-if="hasMultiplePages"
            class="journal-stamp-page__arrow-spacer"
            aria-hidden="true"
          ></div>
        </div>

        <!-- Page indicator -->
        <div
          v-if="hasMultiplePages"
          class="journal-stamp-page__page-indicator"
          aria-live="polite"
        >
          {{ pageIndex + 1 }} / {{ records.length }}
        </div>

        <!-- Bottom action buttons -->
        <JournalActionBar
          :cta-label="ctaLabel"
          :cta-route-name="ctaRouteName"
        />
      </template>
    </div>
  </BioWiraScenePage>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.journal-stamp-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;

  &__empty-fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-8);
    text-align: center;
    font-family: var(--font-body);
    font-weight: 700;
    color: var(--color-text-muted);
  }

  // [←] [Renderer] [→]
  &__nav-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
  }

  &__renderer {
    flex: 1;
    min-width: 0;
  }

  &__arrow-spacer {
    width: 52px;
    flex-shrink: 0;

    @media (max-width: $bp-md) {
      display: none;
    }
  }

  &__page-indicator {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 800;
    color: var(--color-text-muted);
    text-align: center;
  }

  &__stamp-count {
    display: inline-flex;
    align-self: center;
    align-items: center;
    gap: var(--space-1);
    background: rgba(232, 200, 80, 0.15);
    border: 2px solid var(--color-secondary);
    border-radius: var(--radius-full);
    padding: var(--space-1) var(--space-3);
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 900;
    color: var(--color-secondary);
  }
}
</style>
