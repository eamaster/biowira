<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/app/config'
import type { GameplayIconKey } from '@/app/iconRegistry'
import {
  ECO_COMIC_COMPLETION_RIBBON_TITLE,
  ECO_COMIC_RESTORATION_REPLAY_HINT,
  getStoryById,
} from './data/ecoComicStoryCatalog'
import { getSecretWoodenCrateSceneUrls } from './data/ecoComicAssetRegistry'
import { buildEcoComicNarrationText } from './utils/buildEcoComicNarrationText'
import { getEcoComicPanelLayout } from './data/ecoComicPanelLayout'
import { useEcoComicProgressStore } from './stores/ecoComicProgressStore'
import { useProgressStore } from '@/stores/progressStore'
import { getLevelForPoints } from '@/domain/user'
import { warmAssetsIdle } from '@/services/assetPreloadService'
import { useAppAudio } from '@/composables/useAppAudio'
import BioWiraScenePage from '@/components/layout/BioWiraScenePage.vue'
import PixelButton from '@/components/ui/PixelButton.vue'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'
import RewardAchievementBoard from '@/components/results/RewardAchievementBoard.vue'
import EcoComicNarrationButton from './components/EcoComicNarrationButton.vue'
import EcoComicsRibbonSubtitle from './components/EcoComicsRibbonSubtitle.vue'

/** Asset-backed trophy on the completion stamp banner (see `iconRegistry` GAMEPLAY_ICON_MAP). */
const TROPHY_GAMEPLAY_ICON_KEY: GameplayIconKey = 'trophy'

const route = useRoute()
const router = useRouter()
const ecoComicProgressStore = useEcoComicProgressStore()
const progressStore = useProgressStore()
const { sfx } = useAppAudio()

// ── Story resolution ─────────────────────────────────────────────────────────

const storyId = computed(() => String(route.params['storyId'] ?? ''))
const story = computed(() => getStoryById(storyId.value))

// ── Reader state ─────────────────────────────────────────────────────────────

const currentPanelId = ref<string>('')
/** History stack for BACK navigation within the story. */
const panelHistory = ref<string[]>([])
const isShowingCompletion = ref(false)
const completionResult = ref<{
  isFirstCompletion: boolean
  leafPointsAwarded: number
  stampId: string
  endingTitle: string
  endingDescription: string
  restorationBefore: number
  restorationAfter: number
} | null>(null)

const currentPanel = computed(() => {
  if (!story.value) return null
  return story.value.panels[currentPanelId.value] ?? null
})

/** TTS text built from the current panel — changes auto-reset useNarrationAudio. */
const narrationText = computed(() => buildEcoComicNarrationText(currentPanel.value))

/** Data-driven overlay placement for the active panel. */
const panelLayout = computed(() => getEcoComicPanelLayout(currentPanelId.value))

// ── Image broken-image state ─────────────────────────────────────────────────

const imageLoadFailed = ref(false)

watch(currentPanel, () => {
  imageLoadFailed.value = false
})

function onImageError(e: Event) {
  imageLoadFailed.value = true
  if (import.meta.env.DEV) {
    const src = (e.target as HTMLImageElement)?.src ?? 'unknown'
    console.warn(`[EcoComicReader] Failed to load scene image: ${src}`)
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────

function resetReader(firstPanelId: string) {
  currentPanelId.value = firstPanelId
  panelHistory.value = []
  isShowingCompletion.value = false
  completionResult.value = null
  imageLoadFailed.value = false
}

onMounted(() => {
  if (!story.value) {
    router.replace({ name: ROUTE_NAMES.ecoComics })
    return
  }
  resetReader(story.value.firstPanelId)
  // Warm remaining scene images in the background after the reader opens.
  warmAssetsIdle(getSecretWoodenCrateSceneUrls())
})

watch(storyId, () => {
  if (!story.value) {
    router.replace({ name: ROUTE_NAMES.ecoComics })
    return
  }
  resetReader(story.value.firstPanelId)
})

// ── Navigation ───────────────────────────────────────────────────────────────

function goNext() {
  const panel = currentPanel.value
  if (!panel) return
  if (panel.isEnding) {
    handleEnding()
    return
  }
  if (panel.nextPanelId) {
    panelHistory.value.push(currentPanelId.value)
    currentPanelId.value = panel.nextPanelId
  }
}

/**
 * BACK: pop the panel history stack.
 * - If history has entries: go to previous panel.
 * - If no history (still on opening or just arrived): go back to library.
 * - Special case: if showing completion screen, hide it first.
 */
function goBack() {
  if (isShowingCompletion.value) {
    isShowingCompletion.value = false
    return
  }
  if (panelHistory.value.length > 0) {
    currentPanelId.value = panelHistory.value.pop()!
    return
  }
  // No history → go back to the library
  router.push({ name: ROUTE_NAMES.ecoComics })
}

function chooseOption(nextPanelId: string) {
  // Push current to history so BACK can return to the choice panel
  panelHistory.value.push(currentPanelId.value)
  currentPanelId.value = nextPanelId
}

// ── Completion ───────────────────────────────────────────────────────────────

async function handleEnding() {
  const panel = currentPanel.value
  if (!panel?.endingId || !storyId.value) return

  const result = await ecoComicProgressStore.completeEnding(storyId.value, panel.endingId)

  // Use fixed restoration values from the journal record (AC3 requirement).
  const restorationBefore = result.journalRecord?.restorationPercentBefore ?? 0
  const restorationAfter  = result.journalRecord?.restorationPercentAfter  ?? 0

  completionResult.value = {
    isFirstCompletion: result.isFirstCompletion,
    leafPointsAwarded: result.leafPointsAwarded,
    stampId: result.stampId,
    endingTitle: result.endingTitle,
    endingDescription: panel.endingDescription ?? '',
    restorationBefore,
    restorationAfter,
  }
  isShowingCompletion.value = true
}

function openJournalBook() {
  router.push({ name: ROUTE_NAMES.gameJournalMenu })
}

function backToLibrary() {
  router.push({ name: ROUTE_NAMES.ecoComics })
}

function readAgain() {
  if (!story.value) return
  resetReader(story.value.firstPanelId)
}

// ── Computed helpers ─────────────────────────────────────────────────────────

const isLinearPanel = computed(() => {
  const panel = currentPanel.value
  if (!panel) return false
  return !panel.choices && !panel.isEnding && !!panel.nextPanelId
})

const isChoicePanel = computed(() => !!(currentPanel.value?.choices?.length))
const isEndingPanel = computed(() => !!(currentPanel.value?.isEnding))
const isOpeningPanel = computed(() => !!(currentPanel.value?.isOpening))

/** Whether the BACK button should be shown. Hidden only on opening panel with no history. */
const canGoBack = computed(
  () => isShowingCompletion.value || panelHistory.value.length > 0,
)

/** Scene ribbon: story title while reading; shared completion title when the reward card is shown. */
const scenePageTitle = computed(() => {
  if (isShowingCompletion.value && completionResult.value && story.value) {
    return ECO_COMIC_COMPLETION_RIBBON_TITLE
  }
  return story.value?.title ?? 'Eco-Comics'
})

/** Immersive stage while reading; full scene header + subtitle stack on completion (matches library hub). */
const hideSceneHeader = computed(() => {
  if (!story.value) return true
  return !(isShowingCompletion.value && completionResult.value)
})

const totalLeafPointsDisplay = computed(() => progressStore.leafPoints)

const showLevelUpOnEcoCompletion = computed(() => {
  const r = completionResult.value
  if (!r || progressStore.progress == null) return false
  const ptsAfter = progressStore.leafPoints
  const ptsBefore = Math.max(0, ptsAfter - r.leafPointsAwarded)
  return getLevelForPoints(ptsAfter).level > getLevelForPoints(ptsBefore).level
})

watch(isShowingCompletion, (showing) => {
  if (!showing) return
  window.setTimeout(() => {
    sfx('achievement')
  }, 600)
})
</script>

<template>
  <BioWiraScenePage
    :title="scenePageTitle"
    content-width="game"
    density="game"
    :show-decor="false"
    :hide-header="hideSceneHeader"
  >
    <template v-if="isShowingCompletion && completionResult && story" #subtitle>
      <EcoComicsRibbonSubtitle variant="result" :story-titles="[story.title]" />
    </template>
    <!-- Invalid story guard -->
    <template v-if="!story">
      <div class="reader reader--immersive reader__error" role="alert">
        <p>Story not found.</p>
        <PixelButton variant="gray" size="md" @click="backToLibrary">Back to Library</PixelButton>
      </div>
    </template>

    <!-- ── Completion screen ───────────────────────────────────────────────── -->
    <template v-else-if="isShowingCompletion && completionResult && story">
      <div class="reader reader--immersive reader__completion" data-testid="eco-comic-completion-screen">
        <div class="reader__completion-card">
          <!-- Stamp area -->
          <div
            class="reader__completion-stamp"
            :data-testid="`eco-comic-stamp-${completionResult.stampId}`"
          >
            <GameplayIcon
              class="reader__completion-stamp-icon"
              :type="TROPHY_GAMEPLAY_ICON_KEY"
              size="52px"
              alt=""
            />
            <span class="reader__completion-stamp-title">{{ completionResult.endingTitle }}</span>
            <span class="reader__completion-stamp-desc">{{ completionResult.endingDescription }}</span>
            <span
              v-if="!completionResult.isFirstCompletion"
              class="reader__completion-replay-note"
            >
              (You already earned this stamp — no duplicate reward!)
            </span>
          </div>

          <RewardAchievementBoard
            :points-earned="completionResult.leafPointsAwarded"
            :total-leaf-points="totalLeafPointsDisplay"
            :level="progressStore.level"
            :level-title="progressStore.levelTitle"
            :level-progress-percent="progressStore.levelProgressPercent"
            :show-level-up="showLevelUpOnEcoCompletion"
            :restoration-before="completionResult.restorationBefore"
            :restoration-after="completionResult.restorationAfter"
            :is-first-completion="completionResult.isFirstCompletion"
            :restoration-replay-hint="ECO_COMIC_RESTORATION_REPLAY_HINT"
          />

          <!-- Impact line (story-defined; no emoji) -->
          <p v-if="story.completionImpactLine" class="reader__completion-summary">
            {{ story.completionImpactLine }}
          </p>

          <!-- Actions -->
          <div class="reader__completion-actions">
            <PixelButton
              variant="green"
              size="md"
              full-width
              aria-label="Read the story again"
              data-testid="eco-comic-read-again-btn"
              @click="readAgain"
            >
              Read Again
            </PixelButton>
            <PixelButton
              variant="orange"
              size="md"
              full-width
              aria-label="Open Journal Book"
              data-testid="eco-comic-open-journal-btn"
              @click="openJournalBook"
            >
              Open Journal Book
            </PixelButton>
            <PixelButton
              variant="gray"
              size="md"
              full-width
              aria-label="Back to Eco-Comics"
              @click="backToLibrary"
            >
              Back to Eco-Comics
            </PixelButton>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Story reader ────────────────────────────────────────────────────── -->
    <template v-else-if="currentPanel">
      <!--
        reader__story-stage is the positioned root for the overlay system.
        On desktop the stage width is constrained so that the 16:9 scene image
        fits within the visible viewport without causing vertical page scroll.
        On mobile it is full-width and the overlay flows below the image.
      -->
      <div class="reader reader--immersive reader__story-stage" data-testid="eco-comic-reader">

        <!-- Scene image frame -->
        <div
          class="reader__scene-frame"
          role="img"
          :aria-label="currentPanel.narration ?? story.title"
        >
          <img
            v-if="currentPanel.imageSrc && !imageLoadFailed"
            :key="currentPanel.imageSrc"
            :src="currentPanel.imageSrc"
            :alt="currentPanel.narration ?? story?.title ?? ''"
            class="reader__scene-img"
            draggable="false"
            @error="onImageError"
          >
          <!-- Emoji fallback shown when no imageSrc or image fails to load -->
          <div
            v-else
            class="reader__scene-placeholder"
            aria-hidden="true"
          >
            {{ currentPanel.imagePlaceholder }}
          </div>
        </div>

        <!--
          Dialogue overlay.
          Desktop: position: absolute, floating over the scene image.
          Mobile:  position: static, stacked below the scene image.
          Placement and size come from the data-driven ecoComicPanelLayout map.
        -->
        <div
          class="reader__dialogue-overlay"
          :class="[
            `reader__dialogue-overlay--${panelLayout.placement}`,
            `reader__dialogue-overlay--${panelLayout.size}`,
            panelLayout.tone ? `reader__dialogue-overlay--${panelLayout.tone}` : '',
            { 'reader__dialogue-overlay--has-choices': isChoicePanel }
          ]"
          :data-panel-id="currentPanelId"
          :data-has-choices="isChoicePanel"
          :data-placement="panelLayout.placement"
          :data-size="panelLayout.size"
        >
          <!-- Header row: narration/dialogue text + speaker button -->
          <div class="reader__dialogue-inner">
            <div class="reader__dialogue-content">
              <!-- Narrator/scene description -->
              <p v-if="currentPanel.narration" class="reader__narration">
                {{ currentPanel.narration }}
              </p>

              <!-- Dialogue lines -->
              <div v-if="currentPanel.dialogues?.length" class="reader__dialogues">
                <div
                  v-for="(d, idx) in currentPanel.dialogues"
                  :key="idx"
                  class="reader__dialogue-line"
                >
                  <span v-if="d.speaker" class="reader__speaker">{{ d.speaker }}:</span>
                  <span class="reader__line-text">{{ d.text }}</span>
                </div>
              </div>
            </div>

            <!-- Narration / speaker button — top-right of the overlay -->
            <EcoComicNarrationButton
              :text="narrationText"
              :audio-srcs="currentPanel.narrationAudioSrcs"
              class="reader__narration-btn"
            />
          </div>

          <!--
            Toolbar: choices or nav + library.
            Keeps one horizontal band on strip layouts (opening) instead of stacking nav + library rows.
          -->
          <div class="reader__overlay-toolbar">
            <!-- Choice buttons (replaces nav when panel has choices) -->
            <div
              v-if="isChoicePanel"
              class="reader__choices"
              role="group"
              aria-label="Choose an action"
            >
              <PixelButton
                v-for="choice in currentPanel.choices"
                :key="choice.nextPanelId"
                variant="green"
                size="sm"
                :data-testid="`eco-comic-choice-${choice.nextPanelId}`"
                :aria-label="choice.label"
                @click="chooseOption(choice.nextPanelId)"
              >
                {{ choice.label }}
              </PixelButton>
            </div>

            <!-- Navigation buttons (linear + ending + opening) -->
            <div v-else class="reader__nav">
              <!-- BACK: shown when there is history or from completion -->
              <PixelButton
                v-if="canGoBack"
                variant="blue"
                size="sm"
                aria-label="Go back"
                data-testid="eco-comic-back-btn"
                @click="goBack"
              >
                ◀ BACK
              </PixelButton>
              <div v-else class="reader__nav-spacer" aria-hidden="true"></div>

              <!-- START (opening) / NEXT (linear) / See Reward (ending) -->
              <PixelButton
                v-if="isOpeningPanel"
                variant="green"
                size="sm"
                class="reader__btn-primary"
                aria-label="Start story"
                data-testid="eco-comic-start-btn"
                @click="goNext"
              >
                START ▶
              </PixelButton>
              <PixelButton
                v-else-if="isLinearPanel"
                variant="green"
                size="sm"
                aria-label="Next panel"
                data-testid="eco-comic-next-btn"
                @click="goNext"
              >
                NEXT ▶
              </PixelButton>
              <PixelButton
                v-else-if="isEndingPanel"
                variant="orange"
                size="sm"
                aria-label="See your reward"
                data-testid="eco-comic-finish-btn"
                @click="goNext"
              >
                See Reward
              </PixelButton>
            </div>

            <div class="reader__library-actions">
              <PixelButton
                variant="gray"
                size="sm"
                class="reader__btn-library"
                aria-label="Back to Eco-Comics library"
                data-testid="eco-comic-library-link"
                @click="backToLibrary"
              >
                ← Back to Eco-Comics
              </PixelButton>
            </div>
          </div>
        </div>

      </div>
    </template>
  </BioWiraScenePage>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;
@use '@/styles/mixins/result_page_actions_grid' as *;

// ── Shared panel surface constants ────────────────────────────────────────────

$eco-panel-bg:     rgba(255, 248, 220, 0.97);
$eco-panel-border: rgba(180, 130, 40, 0.5);
$eco-panel-shadow: var(--pixel-shadow);

// ── Immersive shell (fills `BioWiraScenePage` flexible content when header hidden) ─

.reader--immersive {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

// ── Error guard ───────────────────────────────────────────────────────────────

.reader__error {
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

// ── Story stage ───────────────────────────────────────────────────────────────
//
// The stage is the positioned root that holds both the scene frame and the
// dialogue overlay.
//
// On desktop (≥ $bp-md), max-width uses `100dvh` minus nav + padding (tokens:
// `--nav-height-top`, `--eco-comic-reader-vh-padding`) × 16:9 aspect ratio.
// Immersive layout removes the wood-ribbon header so overhead is smaller than before.
//
// On mobile the stage is full-width; the overlay is below the image.
//
.reader__story-stage {
  position: relative;
  width: 100%;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  /** Mobile: bottom nav reserves `--nav-height-bottom` in `PixelAppShell`. */
  --eco-comic-stage-v-overhead: calc(var(--nav-height-bottom) + var(--eco-comic-reader-vh-padding));
  container-type: inline-size;
  container-name: eco-comic-stage;

  @media (min-width: $bp-md) {
    flex-direction: row; // Row legacy; overlay uses absolute positioning
    --eco-comic-stage-v-overhead: calc(var(--nav-height-top) + var(--eco-comic-reader-vh-padding));
    max-width: clamp(
      640px,
      calc((100dvh - var(--eco-comic-stage-v-overhead)) * (1672 / 941)),
      min(1160px, 96vw),
    );
  }
}

// ── Scene frame ───────────────────────────────────────────────────────────────

.reader__scene-frame {
  position: relative;
  width: 100%;
  // Exact image dimensions: 1672 × 941 ≈ 16:9
  aspect-ratio: 1672 / 941;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 3px solid var(--color-border);
  box-shadow: var(--pixel-shadow-lg);
  // Dark warm background: visible when image is smaller than container (contain)
  background: #1a2a18;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reader__scene-img {
  width: 100%;
  height: 100%;
  // CONTAIN — never crop important scene content.
  object-fit: contain;
  object-position: center;
  display: block;
  image-rendering: auto;
}

.reader__scene-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(48px, 8vw, 80px);
  letter-spacing: 0.1em;
  color: rgba(255, 248, 200, 0.7);
}

// ── Dialogue overlay ─────────────────────────────────────────────────────────
//
// Mobile (default): static block below the scene image.
// Desktop (≥ $bp-md): absolute positioned over the scene image.
//
// Glass-morphism: translucent warm parchment with backdrop-filter blur.
// A solid fallback is provided for browsers without backdrop-filter support.
//
.reader__dialogue-overlay {
  // Mobile: static flow below image
  position: relative;
  z-index: 2;
  margin-top: var(--space-2);

  // Glass-morphism — lighter / more transparent so story art stays visible (kids notice illustration first).
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: clamp(var(--space-2), 1.1vw, var(--space-3));
  border: 1px solid rgba(255, 248, 210, 0.42);
  border-radius: var(--radius-lg);
  // Tokens: readable fallback + glass path — tuned for child legibility on busy artwork.
  background: var(--eco-comic-overlay-bg-solid);
  box-shadow:
    0 4px 14px rgba(45, 28, 12, 0.14),
    2px 2px 0 rgba(61, 43, 31, 0.08);

  @supports (backdrop-filter: blur(1px)) {
    background: var(--eco-comic-overlay-bg-glass);
    backdrop-filter: blur(var(--eco-comic-overlay-blur)) saturate(var(--eco-comic-overlay-backdrop-saturate));
    -webkit-backdrop-filter: blur(var(--eco-comic-overlay-blur))
      saturate(var(--eco-comic-overlay-backdrop-saturate));
  }

  @media (min-width: $bp-md) {
    // Desktop: absolute inside the positioned stage (visually over the image)
    position: absolute;
    margin-top: 0;
    // Default position (bottom-right) — overridden by placement modifiers below
    bottom: var(--space-3);
    right: var(--space-3);
    max-width: 44%;
  }

  /** Overlay PixelButtons — shared metrics from tokens so rows stay short and consistent */
  :deep(.pixel-btn) {
    font-size: var(--eco-comic-overlay-btn-font);
    font-weight: 700;
    letter-spacing: 0.03em;
    padding: var(--eco-comic-overlay-btn-pad-block) var(--eco-comic-overlay-btn-pad-inline);
    min-height: var(--eco-comic-overlay-btn-min-height);
    line-height: 1.15;
    border-width: 2px;
  }

  :deep(.pixel-btn--green) {
    box-shadow: 0 2px 0 var(--btn-green-border);
  }

  :deep(.pixel-btn--blue) {
    box-shadow: 0 2px 0 var(--btn-blue-border);
  }

  :deep(.pixel-btn--orange) {
    box-shadow: 0 2px 0 var(--btn-orange-border);
  }

  :deep(.pixel-btn--gray) {
    box-shadow: 0 2px 0 var(--btn-gray-border);
  }

  :deep(.reader__btn-primary.pixel-btn) {
    padding-inline: calc(var(--eco-comic-overlay-btn-pad-inline) + var(--space-1));
    font-weight: 800;
  }

  :deep(.reader__btn-library.pixel-btn) {
    padding-inline: var(--eco-comic-overlay-btn-secondary-pad-inline);
    font-weight: 650;
  }
}

// ── Dark tone variant (for high-brightness image areas) ───────────────────────

.reader__dialogue-overlay--dark {
  background: rgba(38, 27, 18, 0.72);
  color: #fff7dc;
  border-color: rgba(255, 248, 210, 0.22);

  .reader__narration,
  .reader__dialogue-line {
    color: #fff7dc;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  }

  .reader__speaker {
    color: #f8d77a;
  }

  @supports (backdrop-filter: blur(1px)) {
    background: rgba(38, 27, 18, 0.48);
    backdrop-filter: blur(14px) saturate(1.12);
    -webkit-backdrop-filter: blur(14px) saturate(1.12);
  }
}

// ── Placement modifiers (desktop only) ───────────────────────────────────────

@media (min-width: $bp-md) {
  .reader__dialogue-overlay--top-left {
    top: var(--space-3);
    left: var(--space-3);
    right: auto;
    bottom: auto;
  }

  .reader__dialogue-overlay--top-center {
    top: var(--space-3);
    bottom: auto;
    left: 0;
    right: 0;
    margin-inline: auto;
    width: fit-content;
    max-width: 68%;
  }

  /**
   * Narrow horizontal strip: capped to readable width, centred — matches bottom-centre strip metrics.
   */
  .reader__dialogue-overlay--top-center.reader__dialogue-overlay--strip {
    left: 50%;
    right: auto;
    margin-inline: 0;
    transform: translateX(-50%);
    width: min(var(--eco-comic-overlay-strip-max-inline-pct), var(--content-readable-width));
    max-width: min(var(--eco-comic-overlay-strip-max-inline-pct), var(--content-readable-width));
  }

  .reader__dialogue-overlay--top-right {
    top: var(--space-3);
    right: var(--space-3);
    left: auto;
    bottom: auto;
  }

  .reader__dialogue-overlay--bottom-left {
    bottom: var(--space-3);
    left: var(--space-3);
    right: auto;
    top: auto;
  }

  .reader__dialogue-overlay--bottom-right {
    bottom: var(--space-3);
    right: var(--space-3);
    left: auto;
    top: auto;
  }

  /**
   * Corner strips — shared width token (`path_a_12` top-right; `path_b_15` top-left;
   * `path_a2_19` bottom-left).
   */
  .reader__dialogue-overlay--top-right.reader__dialogue-overlay--strip,
  .reader__dialogue-overlay--top-left.reader__dialogue-overlay--strip,
  .reader__dialogue-overlay--bottom-left.reader__dialogue-overlay--strip {
    width: min(
      var(--eco-comic-overlay-corner-strip-max-inline-pct),
      var(--content-readable-width)
    );
    max-width: min(
      var(--eco-comic-overlay-corner-strip-max-inline-pct),
      var(--content-readable-width)
    );
  }

  // Centre-anchored with horizontal auto margins
  .reader__dialogue-overlay--bottom-center {
    bottom: var(--space-3);
    left: 0;
    right: 0;
    margin-inline: auto;
    width: fit-content;
    max-width: 68%;
    top: auto;
  }

  /**
   * Bottom-centre strip (legacy / alternate stories): same width cap as top strip.
   */
  .reader__dialogue-overlay--bottom-center.reader__dialogue-overlay--strip {
    left: 50%;
    right: auto;
    margin-inline: 0;
    transform: translateX(-50%);
    width: min(var(--eco-comic-overlay-strip-max-inline-pct), var(--content-readable-width));
    max-width: min(var(--eco-comic-overlay-strip-max-inline-pct), var(--content-readable-width));
  }

  .reader__dialogue-overlay--center-left {
    top: 50%;
    left: var(--space-3);
    right: auto;
    bottom: auto;
    transform: translateY(-50%);
  }

  .reader__dialogue-overlay--center-right {
    top: 50%;
    right: var(--space-3);
    left: auto;
    bottom: auto;
    transform: translateY(-50%);
  }
}

// ── Strip layout: horizontal dialogue band (strip size modifier) ──────────

.reader__dialogue-overlay--strip {
  .reader__overlay-toolbar {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: var(--space-1);
  }

  .reader__library-actions {
    padding-top: 0;
    justify-content: flex-end;
  }

  .reader__nav {
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .reader__nav-spacer {
    display: none;
  }

  .reader__dialogue-content {
    gap: calc(var(--space-1) / 2);
  }

  .reader__narration {
    font-size: clamp(12px, 1.15vw, 14px);
    line-height: 1.35;
  }

  .reader__line-text {
    font-size: clamp(11px, 1.1vw, 13px);
    line-height: 1.4;
  }

  .reader__narration-btn {
    align-self: flex-start;
    margin-top: 0;
  }
}

// ── Size modifiers (desktop only) ─────────────────────────────────────────────
//
// Sizes control max-width (corners / legacy). Current catalog uses `strip` or `choice` at top-centre.
//

@media (min-width: $bp-md) {
  .reader__dialogue-overlay--compact {
    max-width: 38%;
  }

  .reader__dialogue-overlay--medium {
    max-width: 44%;
  }

  .reader__dialogue-overlay--wide {
    max-width: 54%;
  }

  // choice size + bottom-centre placement (legacy)
  .reader__dialogue-overlay--bottom-center.reader__dialogue-overlay--choice {
    max-width: 66%;
    left: 0;
    right: 0;
    bottom: var(--space-3);
    top: auto;
    margin-inline: auto;
    width: fit-content;
    transform: none;
  }

  // choice size + top-centre (current story branches)
  .reader__dialogue-overlay--top-center.reader__dialogue-overlay--choice {
    max-width: min(92vw, var(--content-readable-width));
    left: 50%;
    right: auto;
    top: var(--space-3);
    bottom: auto;
    margin-inline: 0;
    width: fit-content;
    transform: translateX(-50%);
  }

  /**
   * Horizontal strip: desktop grid — text band + toolbar — minimal vertical footprint (top or bottom).
   */
  .reader__dialogue-overlay--strip {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    column-gap: var(--space-2);
    padding-block: var(--space-2);
    padding-inline: var(--space-2);

    .reader__dialogue-inner {
      grid-column: 1;
      grid-row: 1;
      min-width: 0;
      align-items: flex-start;
    }

    .reader__overlay-toolbar {
      grid-column: 2;
      grid-row: 1;
      min-width: 0;
    }

    .reader__nav {
      flex-wrap: nowrap;
    }

    &.reader__dialogue-overlay--has-choices {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: var(--space-2);

      .reader__dialogue-inner {
        display: flex;
        width: 100%;
      }

      .reader__overlay-toolbar {
        width: 100%;
      }
    }
  }

  @container eco-comic-stage (max-width: 900px) {
    .reader__dialogue-overlay--strip {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
      gap: var(--space-2) !important;

      .reader__dialogue-inner {
        display: flex !important;
        width: 100% !important;
      }

      .reader__overlay-toolbar {
        width: 100% !important;
      }
    }
  }
}

// ── Overlay content ────────────────────────────────────────────────────────────

.reader__overlay-toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.reader__dialogue-overlay--choice .reader__overlay-toolbar {
  width: 100%;
}

.reader__dialogue-inner {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
}

.reader__dialogue-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.reader__narration-btn {
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 2px;
}

.reader__narration {
  font-family: var(--font-body);
  font-size: clamp(13px, 1.45vw, 15px);
  font-weight: 800;
  color: var(--eco-comic-overlay-text);
  line-height: 1.55;
  margin: 0;
  letter-spacing: 0.01em;
  text-shadow: var(--eco-comic-overlay-text-shadow);
}

.reader__dialogues {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.reader__dialogue-line {
  font-family: var(--font-body);
  font-size: clamp(13px, 1.6vw, 15px);
  font-weight: 700;
  color: var(--eco-comic-overlay-text);
  line-height: 1.5;
  text-shadow: var(--eco-comic-overlay-text-shadow);
}

.reader__speaker {
  font-family: var(--font-readable);
  font-weight: 900;
  color: var(--eco-comic-overlay-text-speaker);
  margin-right: var(--space-1);
}

// ── Choice and nav buttons ─────────────────────────────────────────────────────

.reader__choices {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
  gap: var(--space-1);

  @media (max-width: $bp-sm) {
    grid-template-columns: 1fr;
  }
}

.reader__nav {
  display: flex;
  gap: var(--space-1);
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.reader__nav-spacer {
  // Reserve space so the primary action stays centred when BACK is hidden
  min-width: 64px;

  @media (max-width: $bp-sm) {
    display: none;
  }
}

// ── Library link ───────────────────────────────────────────────────────────────
//
// Compact — visually subordinate to the main navigation buttons.
// On desktop it sits at the bottom of the overlay (not a full-width bar below
// the image). On mobile it remains accessible in normal document flow.
//
.reader__library-actions {
  display: flex;
  justify-content: center;
  padding-top: 0;

  .reader__dialogue-overlay:not(.reader__dialogue-overlay--strip) & {
    padding-top: var(--space-1);
  }
}

// ── Completion screen ─────────────────────────────────────────────────────────

.reader__completion {
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.reader__completion-card {
  background: $eco-panel-bg;
  border: 3px solid $eco-panel-border;
  border-radius: var(--radius-xl);
  box-shadow: var(--pixel-shadow-lg);
  padding: clamp(var(--space-4), 4vw, var(--space-8));
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
}

.reader__completion-stamp {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  background: rgba(232, 200, 80, 0.12);
  border: 2px solid var(--color-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  width: 100%;
}

.reader__completion-stamp-icon {
  display: block;
  line-height: 0;
}

.reader__completion-stamp-title {
  font-family: var(--font-readable);
  font-size: clamp(18px, 3vw, 26px);
  font-weight: 900;
  color: var(--color-secondary);
}

.reader__completion-stamp-desc {
  font-family: var(--font-body);
  font-size: clamp(13px, 1.6vw, 15px);
  font-weight: 700;
  color: var(--color-text-light);
  line-height: 1.5;
}

.reader__completion-replay-note {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text-muted);
  font-style: italic;
}

.reader__completion-summary {
  font-family: var(--font-readable);
  font-size: clamp(14px, 1.8vw, 17px);
  font-weight: 800;
  color: var(--color-primary);
  margin: 0;
}

.reader__completion-actions {
  @include result-page-actions-grid(3);
}

// ── Docked fallback on constrained non-mobile screens ─────────────────────────
@media (min-width: $bp-md) and ((max-height: 740px) or (max-width: 1024px)) {
  .reader__story-stage {
    flex-direction: column !important;
    align-items: center !important;
    justify-content: flex-start !important;
    height: 100% !important;
    max-width: min(var(--content-readable-width), 96vw) !important;
  }

  .reader__scene-frame {
    width: auto !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    aspect-ratio: 1672 / 941 !important;
    max-height: calc(100% - 160px) !important;
  }

  .reader__dialogue-overlay {
    position: relative !important;
    inset: auto !important;
    top: auto !important;
    right: auto !important;
    bottom: auto !important;
    left: auto !important;
    transform: none !important;
    margin-top: var(--space-2) !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    flex-shrink: 0 !important;
  }
}
</style>
