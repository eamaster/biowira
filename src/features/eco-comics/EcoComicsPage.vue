<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/app/config'
import BioWiraScenePage from '@/components/layout/BioWiraScenePage.vue'
import PixelButton from '@/components/ui/PixelButton.vue'
import EcoComicsRibbonSubtitle from './components/EcoComicsRibbonSubtitle.vue'
import { ECO_COMICS_LIBRARY_MENU } from './data/ecoComicAssetRegistry'
import {
  ECO_COMIC_COMING_SOON_COUNT,
  ECO_COMIC_STORY_CATALOG,
  type EcoComicStory,
} from './data/ecoComicStoryCatalog'

const router = useRouter()

const placeholderCoverSrc = ECO_COMICS_LIBRARY_MENU.greyPlaceholder

/** When the cover `<img>` errors, hide it — never stack emoji placeholder on top of a loaded cover. */
const coverLoadFailedByStoryId = reactive<Record<string, boolean>>({})

function onCoverError(storyId: string) {
  coverLoadFailedByStoryId[storyId] = true
}

function coverImageShows(story: EcoComicStory): boolean {
  return Boolean(story.coverImageSrc) && !coverLoadFailedByStoryId[story.id]
}

function coverFallbackShows(story: EcoComicStory): boolean {
  return !coverImageShows(story)
}

type ShelfSlot = { kind: 'available'; story: EcoComicStory } | { kind: 'comingSoon'; slot: number }

const libraryShelf = computed<ShelfSlot[]>(() => {
  const available = ECO_COMIC_STORY_CATALOG.filter((s) => s.available).map(
    (story): ShelfSlot => ({ kind: 'available', story }),
  )
  const comingSoon: ShelfSlot[] = []
  for (let slot = 1; slot <= ECO_COMIC_COMING_SOON_COUNT; slot += 1) {
    comingSoon.push({ kind: 'comingSoon', slot })
  }
  return [...available, ...comingSoon]
})

function openStory(storyId: string) {
  router.push({ name: ROUTE_NAMES.ecoComicReader, params: { storyId } })
}

function goToGames() {
  router.push({ name: ROUTE_NAMES.games })
}
</script>

<template>
  <BioWiraScenePage
    title="Eco-Comics"
    content-width="wide"
    density="game"
    :show-decor="false"
  >
    <template #subtitle>
      <EcoComicsRibbonSubtitle variant="library" />
    </template>

    <div class="eco-lib" data-testid="eco-comics-library-page">
      <div class="eco-lib__panel">
        <div class="eco-lib__shelf" role="list">
          <template v-for="entry in libraryShelf" :key="entry.kind === 'available' ? entry.story.id : `soon-${entry.slot}`">
            <button
              v-if="entry.kind === 'available'"
              type="button"
              class="eco-lib__book eco-lib__book--available"
              role="listitem"
              :data-testid="`eco-comics-book-${entry.story.id}`"
              :aria-label="`Open story: ${entry.story.title}`"
              @click="openStory(entry.story.id)"
            >
              <div class="eco-lib__cover-frame">
                <img
                  v-if="coverImageShows(entry.story)"
                  :src="entry.story.coverImageSrc"
                  :alt="entry.story.title"
                  class="eco-lib__cover-img"
                  draggable="false"
                  @error="onCoverError(entry.story.id)"
                >
                <div
                  v-if="coverFallbackShows(entry.story)"
                  class="eco-lib__cover-fallback"
                >
                  <span class="eco-lib__cover-fallback-label">{{ entry.story.title }}</span>
                </div>
              </div>
              <div class="eco-lib__book-footer eco-lib__book-footer--available">
                <span class="eco-lib__badge-available">AVAILABLE NOW</span>
              </div>
            </button>

            <div
              v-else
              class="eco-lib__book eco-lib__book--soon"
              role="listitem"
              :data-testid="`eco-comics-coming-soon-${entry.slot}`"
              aria-label="Coming soon"
            >
              <div class="eco-lib__cover-frame eco-lib__cover-frame--placeholder">
                <img
                  :src="placeholderCoverSrc"
                  alt=""
                  class="eco-lib__cover-img eco-lib__cover-img--muted"
                  draggable="false"
                >
              </div>
              <div class="eco-lib__book-footer eco-lib__book-footer--soon">
                <span class="eco-lib__badge-soon">COMING SOON</span>
              </div>
            </div>
          </template>
        </div>

        <div class="eco-lib__pager" aria-hidden="true">
          <span
            v-for="i in libraryShelf.length"
            :key="`dot-${i}`"
            class="eco-lib__dot"
            :class="{ 'eco-lib__dot--active': i === 1 }"
          ></span>
        </div>

        <footer class="eco-lib__footer">
          <p class="eco-lib__helper">
            Explore the 'Eco-Comics' library. Check back soon for more stories.
          </p>
          <PixelButton
            variant="gray"
            size="md"
            aria-label="Back to Games"
            data-testid="eco-comics-back-btn"
            @click="goToGames"
          >
            ← Back to Games
          </PixelButton>
        </footer>
      </div>
    </div>
  </BioWiraScenePage>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

$panel-bg: rgba(255, 248, 220, 0.96);
$panel-border: rgba(180, 130, 40, 0.5);
$panel-shadow: 6px 6px 0 rgba(61, 43, 31, 0.14);

.eco-lib {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;

  &__panel {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    max-height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: clamp(var(--space-2), 1.2vh, var(--space-4));
    padding: clamp(var(--space-3), 1.8vh, var(--space-6));
    background: $panel-bg;
    border: 3px solid $panel-border;
    border-radius: var(--radius-xl);
    box-shadow: $panel-shadow;

    /* Keeps the library card within the viewport on desktop (nav + wood ribbon + padding). */
    @media (min-width: $bp-md) {
      max-height: min(100%, calc(100dvh - var(--nav-height-top) - clamp(9.5rem, 22vh, 14rem)));
    }

    @media (max-width: calc($bp-md - 1px)) {
      overflow-y: auto;
      max-height: none;
    }
  }

  &__shelf {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(var(--space-3), 2vw, var(--space-5));
    min-height: 0;
    flex: 0 1 auto;
    align-items: stretch;
    list-style: none;
    margin: 0;
    padding: 0;

    @media (max-width: calc($bp-md - 1px)) {
      grid-template-columns: 1fr;
      max-width: 320px;
      margin-inline: auto;
    }
  }

  &__book {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 3px solid rgba(120, 80, 20, 0.35);
    box-shadow: 4px 4px 0 rgba(61, 43, 31, 0.18);
    background: #2a1a0e;

    &--available {
      cursor: pointer;
      padding: 0;
      text-align: left;
      transition: transform 0.15s ease, box-shadow 0.15s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 6px 8px 0 rgba(61, 43, 31, 0.24);
      }

      &:active {
        transform: translateY(0);
        box-shadow: 2px 2px 0 rgba(61, 43, 31, 0.18);
      }

      &:focus-visible {
        outline: 3px solid var(--color-primary);
        outline-offset: 3px;
      }
    }

    &--soon {
      cursor: default;
      opacity: 0.92;
    }
  }

  &__cover-frame {
    position: relative;
    width: 100%;
    max-width: min(100%, 240px);
    margin-inline: auto;
    aspect-ratio: 3 / 4;
    max-height: min(34vh, 300px);
    overflow: hidden;
    background: #1a2a18;
    display: flex;
    align-items: center;
    justify-content: center;

    &--placeholder {
      background: #2a2a2a;
    }

    @media (max-width: calc($bp-md - 1px)) {
      max-height: min(42vh, 340px);
    }
  }

  &__cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    image-rendering: auto;

    &--muted {
      object-fit: contain;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
  }

  &__cover-fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-3);
    text-align: center;
    background: linear-gradient(135deg, rgba(140, 100, 30, 0.6), rgba(60, 40, 10, 0.7));
  }

  &__cover-fallback-label {
    font-family: var(--font-body);
    font-size: clamp(11px, 1.1vw + 8px, 14px);
    font-weight: 800;
    line-height: 1.35;
    color: rgba(255, 248, 200, 0.95);
  }

  &__book-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-2) var(--space-3);
    min-height: 2.75rem;

    &--available {
      background: var(--color-secondary);
    }

    &--soon {
      background: rgba(55, 55, 55, 0.92);
    }
  }

  &__badge-available {
    flex-shrink: 0;
    background: var(--color-primary);
    color: #fff;
    font-family: var(--font-readable);
    font-size: clamp(9px, 0.9vw + 7px, 11px);
    font-weight: 900;
    padding: 4px 12px;
    border-radius: 99px;
    letter-spacing: 0.06em;
    white-space: nowrap;
    box-shadow: 0 2px 0 var(--color-primary-dark);
  }

  &__badge-soon {
    font-family: var(--font-readable);
    font-size: clamp(11px, 1.2vw + 8px, 13px);
    font-weight: 800;
    color: rgba(255, 255, 255, 0.78);
    letter-spacing: 0.08em;
    text-align: center;
  }

  &__pager {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--space-2);
    padding-block: var(--space-1);
    flex-shrink: 0;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(61, 43, 31, 0.22);
    flex-shrink: 0;

    &--active {
      width: 11px;
      height: 11px;
      background: var(--color-secondary);
    }
  }

  &__footer {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    flex-wrap: wrap;
    padding-top: clamp(var(--space-1), 0.8vh, var(--space-2));
    margin-top: auto;
    border-top: 1px solid rgba(180, 130, 40, 0.25);
    flex-shrink: 0;

    @media (max-width: $bp-sm) {
      flex-direction: column;
      align-items: stretch;
    }
  }

  &__helper {
    font-family: var(--font-body);
    font-size: clamp(12px, 1.25vw + 10px, 15px);
    font-weight: 700;
    color: var(--color-text-light);
    line-height: 1.45;
    margin: 0;
    flex: 1 1 auto;
    min-width: min(100%, 280px);
  }
}
</style>
