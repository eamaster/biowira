<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/app/config'
import { HOME_PAGE_ASSETS } from '@/app/branding'
import { useProgressStore } from '@/stores/progressStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useProfileStore } from '@/stores/profileStore'
import HomeHeroBanner from './components/HomeHeroBanner.vue'
import { getExplorerAnimalById } from '@/features/welcome/data/explorerAnimalCatalog'
import HomeFeatureCard from './components/HomeFeatureCard.vue'
import HomeWoodRibbon from './components/HomeWoodRibbon.vue'
import ContinueLearningCard from './components/ContinueLearningCard.vue'
import HomeProgressPanel from './components/HomeProgressPanel.vue'
import SwitchExplorerModal from '@/components/ui/SwitchExplorerModal.vue'
import { HOME_FEATURE_CARDS } from './homeFeatureCards'

const router = useRouter()
const progressStore = useProgressStore()
const sessionStore = useSessionStore()
const profileStore = useProfileStore()

const switcherOpen = ref(false)

function openSwitcher() {
  profileStore.loadProfiles()
  switcherOpen.value = true
}

const arrowBoardUrl = HOME_PAGE_ASSETS.homeScene.arrowBoard
const flowerPlantUrl = HOME_PAGE_ASSETS.homeScene.flowerPlant

/**
 * Scenic URLs are intentionally not inlined as `--home-*` custom properties:
 * Chromium-family browsers often prefetch `url()` references on the element even when a
 * given custom property never participates in computed `background-image`, which defeats
 * mobile/tablet “do not load desktop art” expectations. Breakpoint images are wired in SCSS
 * only (`_home_scene_paths.scss` mirrors `HOME_PAGE_ASSETS.homeScene`).
 */
const homePageStyle = computed(
  () =>
    ({
      '--dashboard-panel-bg': `url(${HOME_PAGE_ASSETS.dashboard.progressPanel})`,
    }) as Record<string, string>,
)

/**
 * Returns the first value that is both non-null/undefined AND non-empty after
 * trimming. Prevents empty strings from showing instead of the fallback label.
 */
function firstNonBlank(...values: Array<string | undefined | null>): string | undefined {
  return values.map((v) => v?.trim()).find((v): v is string => Boolean(v))
}

const lastAnimalId = computed(() =>
  firstNonBlank(
    progressStore.progress?.lastAnimalId,
    sessionStore.activeProfile?.lastAnimalId,
  ),
)

const lastAnimalName = computed(() =>
  firstNonBlank(
    progressStore.progress?.lastAnimalName,
    sessionStore.activeProfile?.lastAnimalName,
  ),
)

const lastQuizTitle = computed(() =>
  firstNonBlank(
    progressStore.progress?.lastQuizTitle,
    sessionStore.activeProfile?.lastQuizTitle,
  ),
)

function goContinueDiscover() {
  if (lastAnimalId.value) {
    router.push({ name: ROUTE_NAMES.discover, query: { focusAnimal: lastAnimalId.value } })
  } else {
    router.push({ name: ROUTE_NAMES.discover })
  }
}

function goContinueQuiz() {
  if (lastQuizTitle.value) {
    router.push({ name: ROUTE_NAMES.quiz, query: { quizTitle: lastQuizTitle.value } })
  } else {
    router.push({ name: ROUTE_NAMES.quiz })
  }
}
</script>

<template>
  <div class="home-page" :style="homePageStyle">
    <div class="home-page__layer" aria-hidden="true">
      <img
        class="home-page__decor home-page__decor--arrow"
        data-testid="home-decor-arrow"
        :src="arrowBoardUrl"
        alt=""
        draggable="false"
      >
      <img
        class="home-page__decor home-page__decor--flower"
        data-testid="home-decor-flower"
        :src="flowerPlantUrl"
        alt=""
        draggable="false"
      >
    </div>

    <div class="home-page__main">
      <HomeHeroBanner
        :display-name="sessionStore.activeProfile?.displayNickname ?? progressStore.displayName"
        :profile-id="sessionStore.activeProfile?.profileId"
        :animal-id="sessionStore.activeProfile?.animalId"
        :animal-visual-key="sessionStore.activeProfile?.animalVisualKey"
        :explorer-fallback-emoji="
          sessionStore.activeProfile
            ? getExplorerAnimalById(sessionStore.activeProfile.animalId)?.fallbackEmoji
            : undefined
        "
        @switch-explorer="openSwitcher"
      />

      <div class="page-content">
        <section class="home-page__cards-section" aria-label="Main features">
          <div class="home-page__cards">
            <HomeFeatureCard
              v-for="card in HOME_FEATURE_CARDS"
              :id="card.id"
              :key="card.id"
              :title="card.title"
              :description="card.description"
              :button-label="card.buttonLabel"
              :panel-src="card.panelSrc"
              :icon-src="card.iconSrc"
              :button-src="card.buttonSrc"
              @click="router.push({ name: card.routeName })"
            />
          </div>
        </section>

        <section class="home-page__learning-progress" aria-label="Learning and progress">
          <article
            class="home-page__dashboard-panel home-page__dashboard-panel--continue"
            data-testid="home-dashboard-continue"
          >
            <HomeWoodRibbon overlap title="Continue Learning" />
            <h2 class="sr-only">Continue Learning</h2>

            <div class="home-page__dashboard-body">
              <div class="home-page__continue-cards">
                <ContinueLearningCard
                  compact
                  label="Last Animal Visited"
                  :name="lastAnimalName"
                  name-fallback="Start exploring"
                  action="Go explore! →"
                  :animal-icon-key="lastAnimalId ?? undefined"
                  fallback-emoji="🐾"
                  @click="goContinueDiscover"
                />

                <ContinueLearningCard
                  compact
                  label="Recent Quiz"
                  :name="lastQuizTitle"
                  name-fallback="Try your first quiz"
                  action="Take a quiz! →"
                  :pixel-icon-src="HOME_PAGE_ASSETS.featureCards.quiz.icon"
                  @click="goContinueQuiz"
                />
              </div>
            </div>
          </article>

          <article
            class="home-page__dashboard-panel home-page__dashboard-panel--progress"
            data-testid="home-dashboard-progress"
          >
            <HomeWoodRibbon overlap title="Your Progress" />
            <h2 class="sr-only">Your Progress</h2>

            <div class="home-page__dashboard-body">
              <HomeProgressPanel
                :points="progressStore.leafPoints"
                :level="progressStore.level"
                :level-title="progressStore.levelTitle"
                :level-progress-percent="progressStore.levelProgressPercent"
              />
            </div>
          </article>
        </section>
      </div>
    </div>

    <SwitchExplorerModal v-model="switcherOpen" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;
@use '@/styles/home_scene_paths' as *;

.home-page {
  /**
   * Homepage reading scale (kids / low-vision friendly). Inherited by hero, cards, ribbons, dashboards.
   * Global :root tokens stay unchanged so games & other routes stay visually consistent.
   */
  --home-font-hero-lead: clamp(18px, 2vw + 12px, 26px);
  --home-font-hero-phrase: clamp(15px, 1.4vw + 11px, 20px);
  --home-font-chip: clamp(13px, 1.12vw + 10px, 16px);
  --home-font-feature-title: clamp(18px, 1vw + 12px, 24px);
  --home-font-feature-body: clamp(14px, 0.72vw + 11px, 18px);
  --home-font-feature-cta: clamp(15px, 0.75vw + 11px, 18px);
  --home-font-ribbon-title: clamp(13px, 1.12vw + 10px, 17px);
  --home-font-ribbon-icon: clamp(14px, 1.38vw + 10px, 19px);
  --home-font-dash-caps: clamp(12px, 1vw + 9px, 14px);
  --home-font-dash-value: clamp(16px, 1.5vw + 10px, 19px);
  --home-font-dash-action: clamp(13px, 1.05vw + 10px, 15px);
  --home-font-progress-label: clamp(13px, 1.1vw + 10px, 16px);

  /** Homepage-scoped content width — wider than global max to give 5-card row more breathing room. */
  --home-content-width: min(1400px, calc(100% - 48px));
  /** Ribbon float strength; aligns with tokens.scss default. */
  --home-ribbon-offset: -42%;
  /** Extra top padding inside wood panels below the floated ribbon. */
  --home-ribbon-top-slot: clamp(38px, 8.5vw, 56px);

  position: relative;
  min-height: calc(100dvh - var(--nav-height-top, 60px));
  padding-bottom: calc(var(--nav-height-bottom, 0px) + var(--space-6));
  /** Prevent `100vw`-based maths (decor / gradients) from causing 1–2px horizontal scroll. */
  overflow-x: clip;
  /**
   * Desktop+: push hero + cards + dashboards down together so the sun stays visible and
   * the large beige band below the progress panels fills with content instead of empty scene.
   */
  @media (min-width: #{$bp-xl}) {
    padding-block-start: clamp(48px, 10vh, 120px);
  }

  /**
   * Scene art (mobile-first): only the breakpoint-matching `url()` exists in stylesheet output,
   * so inactive scenic assets are not referenced on narrow viewports at parse time (avoids stray precache/decodes).
   * Breakpoints: mobile ≤480px (`$bp-sm`), tablet 481–1279, desktop `$bp-xl` (1280+).
   */
  background-image:
    linear-gradient(
      to bottom,
      rgba(22, 61, 35, 0.08) 0%,
      rgba(245, 230, 200, 0.82) 72%,
      var(--color-bg) 100%
    ),
    url(#{$HOME_SCENE_MOBILE_WEBP});

  @media (min-width: #{$bp-sm + 1px}) and (max-width: #{$bp-xl - 1px}) {
    background-image:
      linear-gradient(
        to bottom,
        rgba(22, 61, 35, 0.08) 0%,
        rgba(245, 230, 200, 0.82) 72%,
        var(--color-bg) 100%
      ),
      url(#{$HOME_SCENE_TABLET_WEBP});
  }

  @media (min-width: $bp-xl) {
    background-image:
      linear-gradient(
        to bottom,
        rgba(22, 61, 35, 0.08) 0%,
        rgba(245, 230, 200, 0.82) 72%,
        var(--color-bg) 100%
      ),
      url(#{$HOME_SCENE_DESKTOP_WEBP});
  }
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

// ── Side decorations (arrow / flower): paths from HOME_PAGE_ASSETS in script ──

.home-page__layer {
  pointer-events: none;
  position: absolute;
  inset: 0;
  /**
   * Below `.home-page__main` so readable panels/cards always win; decorations stay in the margins
   * or are covered by opaque pixel panels where geometry is tight (tablet / narrow desktop).
   */
  z-index: 0;
  overflow: hidden;

  @media (max-width: $bp-sm) {
    display: none;
  }
}

.home-page__decor {
  position: absolute;
  bottom: clamp(100px, 16vh, 220px);
  height: auto;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  transform-origin: bottom center;
  pointer-events: none;

  @media (prefers-reduced-motion: no-preference) {
    animation: home-deco-pendulum var(--home-deco-dur, 4s) ease-in-out infinite;
  }

  /**
   * Pin to the outside of the centered readable column: left/right edge of asset sits just past
   * `--home-content-width`, with width capped by available side margin so decor shrinks on tight widths.
   */
  &--arrow {
    --deco-w: clamp(52px, 10vw, 120px);
    --deco-max: max(36px, calc((100% - var(--home-content-width)) * 0.5 - var(--home-deco-side-clearance)));
    --deco-visible: min(var(--deco-w), var(--deco-max));
    --home-deco-dur: 4.2s;
    width: var(--deco-visible);
    left: max(
      var(--space-2),
      calc((100% - var(--home-content-width)) * 0.5 - var(--home-deco-side-clearance) - var(--deco-visible))
    );
  }

  &--flower {
    --deco-w: clamp(56px, 11vw, 130px);
    --deco-max: max(36px, calc((100% - var(--home-content-width)) * 0.5 - var(--home-deco-side-clearance)));
    --deco-visible: min(var(--deco-w), var(--deco-max));
    --home-deco-dur: 3.8s;
    animation-delay: -1.9s;
    width: var(--deco-visible);
    right: max(
      var(--space-2),
      calc((100% - var(--home-content-width)) * 0.5 - var(--home-deco-side-clearance) - var(--deco-visible))
    );
  }
}

@keyframes home-deco-pendulum {
  0%,
  100% {
    transform: rotate(-4deg);
  }

  50% {
    transform: rotate(4deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-page__decor {
    animation: none;
  }
}

.home-page__main {
  position: relative;
  z-index: 1;
}

.page-content {
  max-width: var(--home-content-width, var(--max-content-width, 1200px));
  margin-inline: auto;
  padding-inline: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--home-section-gap);
  /**
   * Uses lower-page whitespace: feature cards + dashboards sit a bit lower so the hero
   * band can stay top-centred without crowding the sky/sun.
   */
  @media (min-width: #{$bp-xl}) {
    /** Smaller overlap with `.hero` padding-end so hero group sits nearer the card row. */
    padding-block-start: clamp(12px, 3.2vh, 44px);
  }
}

.home-page__cards-section {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.home-page__cards {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: stretch;
  gap: clamp(14px, 1.4vw, 22px);
  width: 100%;

  /** Cards fill equally wide columns; min-width avoids grid blowout quirks */
  & > .hfc {
    min-width: 0;
  }

  @media (max-width: 1023px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-3);
  }

  @media (max-width: $bp-md) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: $bp-sm) {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }
}

.home-page__learning-progress {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--home-dashboard-stack-gap);
  align-items: stretch;
  margin-top: 0;
  margin-bottom: clamp(var(--space-6), 3vh, var(--space-10));

  @media (max-width: 1023px) {
    grid-template-columns: 1fr;
  }
}

// ── Dashboard: progess-card.webp + overlaid wood ribbon (reference composite) ─

.home-page__dashboard-panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  align-self: stretch;
  overflow: visible;
  min-height: 0;

  background-image: var(--dashboard-panel-bg);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  image-rendering: crisp-edges;

  border-radius: var(--radius-lg);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.12);
}

.home-page__dashboard-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;
  padding: calc(var(--home-ribbon-top-slot) + var(--home-panel-gap)) var(--space-4) var(--space-4);
  width: 100%;
  min-width: 0;
  min-height: 0;
}

.home-page__continue-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  width: 100%;
  flex: 1;
  align-items: stretch;
  align-content: center;
  min-height: 0;

  @media (max-width: $bp-sm) {
    grid-template-columns: 1fr;
  }
}
</style>
