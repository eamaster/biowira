<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/app/config'
import { useGameJournalStore } from '@/stores/gameJournalStore'
import type { GameJournalCategoryId } from '@/domain/gameJournal'
import BioWiraScenePage from '@/components/layout/BioWiraScenePage.vue'
import PixelButton from '@/components/ui/PixelButton.vue'
import JournalEmptyNotice from './components/JournalEmptyNotice.vue'
import {
  GAME_JOURNAL_ASSETS,
  getJournalCategoryCardAsset,
} from './data/gameJournalAssetRegistry'

const router = useRouter()
const journalStore = useGameJournalStore()

// ── Empty state notification ─────────────────────────────────────────────────

const emptyNoticeCategory = ref<{ id: GameJournalCategoryId; title: string } | null>(null)

function handleCategoryClick(categoryId: GameJournalCategoryId, title: string) {
  if (!journalStore.hasRecords(categoryId)) {
    emptyNoticeCategory.value = { id: categoryId, title }
    return
  }
  emptyNoticeCategory.value = null
  router.push({ name: ROUTE_NAMES.gameJournalCategory, params: { categoryId } })
}

function dismissEmptyNotice() {
  emptyNoticeCategory.value = null
}

function goToGames() {
  router.push({ name: ROUTE_NAMES.games })
}

const cards = computed(() => journalStore.categoryCardsData)
</script>

<template>
  <BioWiraScenePage
    title="Journal - Game Histories"
    subtitle="Game History Selection"
    content-width="wide"
  >
    <div class="journal-menu-page" data-testid="journal-menu-page">

      <!-- Empty notice overlay -->
      <div
        v-if="emptyNoticeCategory"
        class="journal-menu-page__empty-overlay"
        role="dialog"
        aria-modal="false"
        aria-live="polite"
        :aria-label="`No stamps for ${emptyNoticeCategory.title}`"
      >
        <JournalEmptyNotice
          :category-title="emptyNoticeCategory.title"
          @click.stop
        />
        <PixelButton
          variant="gray"
          size="sm"
          aria-label="Dismiss notification"
          class="journal-menu-page__dismiss-btn"
          @click="dismissEmptyNotice"
        >
          ✕ Dismiss
        </PixelButton>
      </div>

      <!-- Open-book frame with background sprite -->
      <div class="journal-menu-page__book-wrap" data-testid="journal-book-frame">
        <!-- Book frame sprite as decorative background -->
        <img
          :src="GAME_JOURNAL_ASSETS.shared.bookFrameWide"
          alt=""
          aria-hidden="true"
          class="journal-menu-page__book-bg"
        />

        <!-- Category cards overlaid on the book -->
        <section
          class="journal-menu-page__categories"
          aria-label="Game history categories"
          data-testid="journal-category-grid"
        >
          <button
            v-for="card in cards"
            :key="card.id"
            class="journal-menu-page__cat-card"
            :data-testid="`journal-category-card-${card.id}`"
            :aria-label="
              card.hasRecords
                ? `Open ${card.title} History — ${card.recordCount} record${card.recordCount !== 1 ? 's' : ''}`
                : `${card.title} History — no stamps yet`
            "
            type="button"
            @click="handleCategoryClick(card.id, card.title)"
          >
            <!-- WEBP card sprite -->
            <img
              :src="getJournalCategoryCardAsset(card.id)"
              :alt="card.title"
              class="journal-menu-page__cat-card-img"
              :class="{ 'journal-menu-page__cat-card-img--dimmed': !card.hasRecords }"
            />

            <!-- Record count badge -->
            <div
              v-if="card.hasRecords"
              class="journal-menu-page__cat-badge"
              aria-hidden="true"
            >
              {{ card.unlockedStampCount }}/{{ card.totalStampCount }} stamps
            </div>

            <!-- Locked overlay when no records -->
            <div
              v-else
              class="journal-menu-page__cat-locked"
              aria-hidden="true"
            >
              <span class="journal-menu-page__cat-lock-icon">🔒</span>
            </div>
          </button>
        </section>
      </div>

      <!-- Bottom action -->
      <div class="journal-menu-page__actions">
        <PixelButton
          variant="blue"
          size="md"
          aria-label="Go back to Games"
          data-testid="journal-back-to-games-btn"
          @click="goToGames"
        >
          🎮 Go Back to Games
        </PixelButton>
      </div>
    </div>
  </BioWiraScenePage>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;
@use '@/features/game-journal/styles/journalBook2Sprite' as book2;

.journal-menu-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;

  &__empty-overlay {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    position: relative;
    z-index: var(--z-overlay);
  }

  &__dismiss-btn {
    align-self: center;
  }

  // ── Book frame ─────────────────────────────────────────────
  &__book-wrap {
    position: relative;
    width: 100%;
    @include book2.aspect-box;
    max-height: 560px;
    overflow: visible;
  }

  &__book-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    pointer-events: none;
    user-select: none;
  }

  // ── Category cards ─────────────────────────────────────────
  &__categories {
    @include book2.inner-inset;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(var(--space-2), 1.5%, var(--space-4));
    align-items: stretch;
  }

  &__cat-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: transform var(--transition-fast), filter var(--transition-fast);
    overflow: hidden;

    &:hover {
      transform: translateY(-4px);
      filter: brightness(1.06);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &__cat-card-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;

    &--dimmed {
      filter: brightness(0.75) saturate(0.6);
    }
  }

  &__cat-badge {
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    font-family: var(--font-readable);
    font-size: 10px;
    font-weight: 900;
    color: #fff;
    background: rgba(61, 43, 31, 0.75);
    border-radius: 99px;
    padding: 2px 8px;
    white-space: nowrap;
  }

  &__cat-locked {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(61, 43, 31, 0.5);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__cat-lock-icon {
    font-size: 18px;
    line-height: 1;
  }

  // ── Bottom actions ─────────────────────────────────────────
  &__actions {
    display: flex;
    justify-content: center;
    padding-bottom: var(--space-4);
  }

  // ── Mobile: stack cards linearly ───────────────────────────
  @media (max-width: $bp-md) {
    &__book-wrap {
      aspect-ratio: unset;
      max-height: unset;
      height: auto;
    }

    &__book-bg {
      display: none; // hide book BG on mobile, just show cards
    }

    &__categories {
      position: static;
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-4);
      padding: var(--space-2);
    }

    &__cat-card {
      height: auto;
      min-height: 120px;
      background: rgba(255, 248, 220, 0.9);
      border: 3px solid rgba(180, 130, 40, 0.4);
      border-radius: var(--radius-xl);
      box-shadow: var(--pixel-shadow);
      padding: var(--space-3);
    }

    &__cat-card-img {
      width: auto;
      max-width: 180px;
      height: 120px;
      margin: 0 auto;
    }
  }
}
</style>
