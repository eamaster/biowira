<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/app/config'
import BioWiraScenePage from '@/components/layout/BioWiraScenePage.vue'
import HomeFeatureCard from '@/features/home/components/HomeFeatureCard.vue'
import { GAME_MENU_CARDS } from './gameMenuCards'
import { GAME_JOURNAL_ASSETS } from '@/features/game-journal/data/gameJournalAssetRegistry'

const router = useRouter()

function goToCard(routeName: (typeof ROUTE_NAMES)[keyof typeof ROUTE_NAMES]) {
  router.push({ name: routeName })
}

function openJournalBook() {
  router.push({ name: ROUTE_NAMES.gameJournalMenu })
}
</script>

<template>
  <BioWiraScenePage
    title="Games Menu"
    subtitle="Choose an adventure — missions, rescue run, or eco-comics."
    content-width="wide"
    show-animal-chat
    animal-chat-placement="sky-left"
  >
    <template #skyRailEnd>
      <!-- Sky rail: positioned by `BioWiraScenePage` using `--scene-animal-chat-sky-inset-*` (no header-height guesswork). -->
      <div class="games-page__journal-wrap" data-testid="games-journal-cta">
        <button
          class="games-page__journal-book"
          type="button"
          aria-label="Open Journal Book"
          data-testid="games-open-journal-btn"
          @click="openJournalBook"
        >
          <img
            :src="GAME_JOURNAL_ASSETS.shared.journalBookSprite"
            alt="Journal Book"
            class="games-page__journal-book-img"
          />
          <span class="games-page__journal-book-label">Open Journal Book</span>
        </button>
      </div>
    </template>

    <div class="games-page__layout">
      <section class="games-page__cards" aria-label="Games you can play">
        <HomeFeatureCard
          v-for="card in GAME_MENU_CARDS"
          :id="card.id"
          :key="card.id"
          :title="card.title"
          :description="card.description"
          :button-label="card.buttonLabel"
          :panel-src="card.panelSrc"
          :icon-src="card.iconSrc"
          :button-src="card.buttonSrc"
          variant="games"
          test-id-prefix="games-menu-card"
          @click="goToCard(card.routeName)"
        />
      </section>
    </div>
  </BioWiraScenePage>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

// ── Layout wrapper ────────────────────────────────────────────
.games-page__layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-5);
  align-items: start;
  width: 100%;
}

.games-page__journal-wrap {
  display: flex;
  align-items: flex-start;
  justify-content: center;

  @media (max-width: $bp-lg) {
    width: 100%;
  }
}

// ── Game cards grid ───────────────────────────────────────────
.games-page__cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(var(--space-4), 2.2vw, var(--space-8));
  align-items: stretch;

  > :deep(.hfc) {
    min-width: 0;
  }

  @media (max-width: 1023px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: $bp-sm) {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
}

// ── Journal Book object ───────────────────────────────────────
.games-page__journal-book {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  transition: transform var(--transition-base);

  &:hover {
    transform: translateY(-4px) rotate(2deg);
  }

  &:active {
    transform: translateY(0) rotate(0deg);
  }

  @media (max-width: $bp-lg) {
    flex-direction: row;
    background: rgba(255, 248, 200, 0.9);
    border: 3px solid rgba(200, 155, 40, 0.5);
    border-radius: var(--radius-xl);
    box-shadow: 4px 4px 0 rgba(61, 43, 31, 0.1);
    padding: var(--space-3) var(--space-5);
    gap: var(--space-4);
    width: 100%;
    justify-content: center;

    &:hover {
      transform: translateY(-2px) rotate(0deg);
    }
  }
}

.games-page__journal-book-img {
  width: clamp(80px, 9vw, 120px);
  height: auto;
  object-fit: contain;
  display: block;

  @media (max-width: $bp-lg) {
    width: 56px;
  }
}

.games-page__journal-book-label {
  font-family: var(--font-readable);
  font-size: clamp(10px, 1.1vw, 13px);
  font-weight: 900;
  color: var(--color-text);
  text-align: center;
  line-height: 1.3;

  @media (max-width: $bp-lg) {
    font-size: 13px;
    white-space: nowrap;
  }
}
</style>
