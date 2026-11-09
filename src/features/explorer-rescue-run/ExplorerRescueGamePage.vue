<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/app/config'
import { useProgressStore } from '@/stores/progressStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useExplorerRescueProgressStore } from './stores/explorerRescueProgress'
import { loadExplorerRescueRound } from './data/explorerRescueRoundBuilder'
import {
  resolveExplorerRescueRunFromRouteQuery,
  type ExplorerRescueRunCatalogItem,
} from './data/explorerRescueRunCatalog'
import { EXPLORER_RESCUE_WRONG_FEEDBACK_MS } from './game/explorerRescueChoiceTiming'
import {
  computeExplorerRescueVisualScale,
} from './game/explorerRescueVisualScale'
import {
  createExplorerRescueGame,
  destroyExplorerRescueGame,
  getExplorerRescueScene,
  refreshExplorerRescueGameLayout,
} from './game/createExplorerRescueGame'
import type { ExplorerRescueRound, ExplorerRescueResult } from './game/types'
import {
  LEAF_POINTS_GAMEPLAY_ICON_KEY,
  LEAF_POINTS_LABEL,
  formatLeafPointsCount,
} from '@/domain/pointsCurrency'
import BioWiraScenePage from '@/components/layout/BioWiraScenePage.vue'
import PixelButton from '@/components/ui/PixelButton.vue'
import PixelLoadingState from '@/components/ui/PixelLoadingState.vue'
import PixelErrorState from '@/components/ui/PixelErrorState.vue'
import AnimalIcon from '@/components/ui/AnimalIcon.vue'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'
import MobileGameControls from './components/MobileGameControls.vue'
import RescueTraitBadge from './components/RescueTraitBadge.vue'
import RescueChoiceIcon from './components/RescueChoiceIcon.vue'
import RescueChoiceTraitList from './components/RescueChoiceTraitList.vue'
import { useAppAudio } from '@/composables/useAppAudio'

let wrongFeedbackTimer: ReturnType<typeof setTimeout> | undefined
let canvasResizeObserver: ResizeObserver | null = null

function disconnectCanvasResizeObserver(): void {
  canvasResizeObserver?.disconnect()
  canvasResizeObserver = null
}

function connectCanvasResizeObserver(el: HTMLElement): void {
  disconnectCanvasResizeObserver()
  canvasResizeObserver = new ResizeObserver(() => {
    refreshDomVisualScale()
    refreshExplorerRescueGameLayout()
  })
  canvasResizeObserver.observe(el)
}

const route = useRoute()
const router = useRouter()

const sessionStore = useSessionStore()
const progressStore = useProgressStore()
const rescueStore = useExplorerRescueProgressStore()
const { sfx } = useAppAudio()

const selectedRun = ref<ExplorerRescueRunCatalogItem>(
  resolveExplorerRescueRunFromRouteQuery(route.query.rescueAnimal),
)
const rescueAnimalVisualKey = computed(() => selectedRun.value.visualKey)
const rescueAnimalName = computed(() => selectedRun.value.animalName)
const fallbackEmojiCatalog = computed(() => selectedRun.value.fallbackEmoji ?? '🐾')

function playRouteRescueAnimalQuery(): string {
  const raw = route.query.rescueAnimal
  if (typeof raw === 'string') return raw
  return Array.isArray(raw) ? String(raw[0] ?? '') : ''
}

function playRouteKey(): string {
  return `${String(route.name ?? '')}|${route.path}|${playRouteRescueAnimalQuery()}`
}

const gameContainer = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')
const phase = ref<'running' | 'choosing' | 'result'>('running')
const collectedCount = ref(0)
const wrongFeedback = ref(false)
const choiceLocked = ref(false)
const correctResult = ref<ExplorerRescueResult | null>(null)
const isMobile = ref(window.innerWidth < 768)

const gameHost = ref<HTMLElement | null>(null)

const hudAnimalSize = ref<string>('34px')

function refreshDomVisualScale(): void {
  if (typeof window === 'undefined') return
  const vs = computeExplorerRescueVisualScale(window.innerWidth, window.innerHeight)
  hudAnimalSize.value = vs.hudAnimalIconCss

  const el = gameHost.value
  if (!el) return
  el.style.setProperty('--game-choice-animal-size', vs.choiceCardImageCss)
  el.style.setProperty('--game-choice-trait-icon', vs.choiceCardTraitIconCss)
  el.style.setProperty('--game-mission-badge-icon', vs.missionBadgeIconCss)
}

// API-backed round — null until loaded
const round = shallowRef<ExplorerRescueRound | null>(null)

const leafPoints = computed(() => progressStore.leafPoints)
const isFirstCompletion = computed(() =>
  rescueStore.checkFirstCompletion(selectedRun.value.id),
)
const restorationBefore = computed(() => rescueStore.rainforestRestored)

// Match instruction: use the round's API-backed instruction if available
const matchInstruction = computed(
  () =>
    round.value?.matchInstruction ?? 'Pick the animal with the best matching habitat, diet, and group.',
)

function syncSelectedRunFromRoute() {
  selectedRun.value = resolveExplorerRescueRunFromRouteQuery(route.query.rescueAnimal)
}

function clearWrongFeedbackTimer() {
  if (wrongFeedbackTimer !== undefined) clearTimeout(wrongFeedbackTimer)
  wrongFeedbackTimer = undefined
}

function handleResize() {
  isMobile.value = window.innerWidth < 768
  refreshDomVisualScale()
  refreshExplorerRescueGameLayout()
}

function schedulePhaserLayoutRefresh(): void {
  requestAnimationFrame(() => {
    refreshExplorerRescueGameLayout()
    requestAnimationFrame(() => refreshExplorerRescueGameLayout())
  })
}

function initGame() {
  const container = gameContainer.value
  if (!container || !round.value) return

  if (container.clientWidth === 0 || container.clientHeight === 0) return

  connectCanvasResizeObserver(container)

  try {
    createExplorerRescueGame({
      parent: container,
      round: round.value,
      rescueRunCatalogId: selectedRun.value.id,
      profileId: sessionStore.activeProfile?.profileId ?? 'guest',
      currentLeafPoints: leafPoints.value,
      restorationBefore: restorationBefore.value,
      isFirstCompletion: isFirstCompletion.value,
      callbacks: {
        onReady: () => {
          isLoading.value = false
          schedulePhaserLayoutRefresh()

          const scene = getExplorerRescueScene()
          if (!scene) return

          scene.events.on('playerJumped', () => {
            sfx('jump')
          })
          scene.events.on('clueCollected', (count: number) => {
            collectedCount.value = count
            sfx('leaf-collect')
          })
          scene.events.on('enterChoose', () => {
            phase.value = 'choosing'
            choiceLocked.value = false
          })
          scene.events.on('wrongChoice', () => {
            wrongFeedback.value = true
            choiceLocked.value = true
            correctResult.value = null
            phase.value = 'choosing'
            sfx('answer-wrong')
            clearWrongFeedbackTimer()
            wrongFeedbackTimer = setTimeout(() => {
              wrongFeedback.value = false
              choiceLocked.value = false
            }, EXPLORER_RESCUE_WRONG_FEEDBACK_MS)
          })
        },
        onComplete: (result: ExplorerRescueResult) => {
          correctResult.value = result
          choiceLocked.value = true
          wrongFeedback.value = false
          clearWrongFeedbackTimer()
          phase.value = 'result'
          sfx('answer-correct')
        },
        onError: (err: Error) => {
          isLoading.value = false
          hasError.value = true
          errorMessage.value = err.message
          console.error('[ExplorerRescueGame] Phaser error:', err)
        },
      },
    })
  } catch (err) {
    isLoading.value = false
    hasError.value = true
    errorMessage.value = err instanceof Error ? err.message : 'Could not start game'
  }
}

async function loadRoundAndInitGame(forceRefresh = false) {
  disconnectCanvasResizeObserver()
  destroyExplorerRescueGame()
  clearWrongFeedbackTimer()
  isLoading.value = true
  hasError.value = false
  errorMessage.value = ''
  phase.value = 'running'
  collectedCount.value = 0
  wrongFeedback.value = false
  choiceLocked.value = false
  correctResult.value = null

  try {
    round.value = await loadExplorerRescueRound({
      explorerAnimalId: selectedRun.value.animalId,
      explorerVisualKey: selectedRun.value.visualKey,
      forceRefresh,
    })
    await nextTick()
    refreshDomVisualScale()
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    })
    initGame()
  } catch (err) {
    isLoading.value = false
    hasError.value = true
    errorMessage.value = err instanceof Error ? err.message : 'Could not load game data'
    console.error('[ExplorerRescueGame] Round load error:', err)
  }
}

async function handleSeeReward() {
  if (!correctResult.value) return
  await rescueStore.recordCompletion(correctResult.value)
  router.push({ name: ROUTE_NAMES.explorerRescueResult })
}

function handleChoice(index: number) {
  const scene = getExplorerRescueScene()
  if (phase.value !== 'choosing' || wrongFeedback.value || choiceLocked.value || !scene || !round.value) {
    return
  }

  sfx('tap')
  choiceLocked.value = true
  scene.chooseMatch(index)
}

async function handleRetry() {
  await loadRoundAndInitGame(true)
}

function backToChapter() {
  disconnectCanvasResizeObserver()
  destroyExplorerRescueGame()
  clearWrongFeedbackTimer()
  router.push({ name: ROUTE_NAMES.explorerRescue })
}

function backToGames() {
  router.push({ name: ROUTE_NAMES.games })
}

// ── Mobile controls ───────────────────────────────────────────────────────────
function onLeftStart() { const s = getExplorerRescueScene(); if (s) s.mobileLeft = true }
function onLeftEnd() { const s = getExplorerRescueScene(); if (s) s.mobileLeft = false }
function onRightStart() { const s = getExplorerRescueScene(); if (s) s.mobileRight = true }
function onRightEnd() { const s = getExplorerRescueScene(); if (s) s.mobileRight = false }
function onJumpStart() { const s = getExplorerRescueScene(); if (s) s.mobileJump = true }
function onJumpEnd() { const s = getExplorerRescueScene(); if (s) s.mobileJump = false }

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  window.addEventListener('resize', handleResize)
  void nextTick().then(() => refreshDomVisualScale())
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  clearWrongFeedbackTimer()
  disconnectCanvasResizeObserver()
  destroyExplorerRescueGame()
})

watch(
  () => playRouteKey(),
  async () => {
    if (route.name !== ROUTE_NAMES.explorerRescuePlay) {
      disconnectCanvasResizeObserver()
      destroyExplorerRescueGame()
      return
    }
    syncSelectedRunFromRoute()
    await loadRoundAndInitGame()
  },
  { immediate: true },
)
</script>

<template>
  <BioWiraScenePage
    title="Explorer Rescue Run"
    tone="play"
    content-width="game"
    density="game"
    :show-decor="false"
    hide-header
  >
    <div
      ref="gameHost"
      class="game-page explorer-rescue-game-host explorer-rescue-game-host--fill-viewport"
      data-testid="explorer-rescue-play-page"
    >
      <div class="game-page__stage">
        <div class="game-page__stage-shell">
          <div class="game-page__topbar" aria-label="Game status">
            <div class="game-page__topbar-section game-page__topbar-section--back">
              <PixelButton
                variant="gray"
                size="sm"
                class="game-page__back-btn"
                aria-label="Back to chapter map"
                @click="backToChapter"
              >
                ← Chapter
              </PixelButton>
            </div>

            <span class="game-page__topbar-divider" aria-hidden="true"></span>

            <div class="game-page__topbar-section game-page__topbar-section--rescue-animal">
              <AnimalIcon
                :icon-key="rescueAnimalVisualKey"
                :common-name="rescueAnimalName"
                :fallback-emoji="fallbackEmojiCatalog"
                use-rescue-runner-icon
                :size="hudAnimalSize"
              />
              <span class="game-page__rescue-animal-text">
                <span class="game-page__rescue-animal-label">Rescue Animal:</span>
                <span class="game-page__rescue-animal-name">{{ rescueAnimalName }}</span>
              </span>
            </div>

            <div
              class="game-page__topbar-section game-page__clue-summary"
              role="group"
              aria-label="Collected clues"
            >
              <div class="game-page__clue-count" aria-live="polite">
                <span class="game-page__clue-count-label">Clues</span>
                <span class="game-page__clue-count-value">{{ collectedCount }}/3</span>
              </div>

              <div class="game-page__clue-badges">
                <RescueTraitBadge
                  v-for="(trait, i) in round?.clueTraits ?? []"
                  :key="trait.id"
                  :trait="trait"
                  :collected="collectedCount > i"
                  size="mission"
                />
              </div>
            </div>

            <span class="game-page__topbar-divider" aria-hidden="true"></span>

            <div
              class="game-page__topbar-section game-page__points-chip"
              :aria-label="`${LEAF_POINTS_LABEL}: ${leafPoints}`"
            >
              <GameplayIcon
                :type="LEAF_POINTS_GAMEPLAY_ICON_KEY"
                size="26px"
                class="game-page__leaf-icon"
              />
              <span class="game-page__points-value">{{ formatLeafPointsCount(leafPoints) }}</span>
            </div>
          </div>

          <div class="game-page__frame">
            <div
              ref="gameContainer"
              class="game-page__canvas"
              aria-label="Explorer Rescue Run game"
              role="application"
            ></div>

            <!-- Loading overlay -->
            <Transition name="fade">
              <div v-if="isLoading" class="game-page__overlay" aria-live="polite" aria-busy="true">
                <PixelLoadingState message="Loading the rainforest…" />
              </div>
            </Transition>

            <!-- Error overlay -->
            <div v-if="hasError" class="game-page__overlay game-page__overlay--error">
              <PixelErrorState message="Oops! The rainforest game could not load." :detail="errorMessage">
                <template #actions>
                  <PixelButton variant="green" @click="handleRetry">Try Again</PixelButton>
                  <PixelButton variant="blue" @click="backToGames">Back to Games</PixelButton>
                </template>
              </PixelErrorState>
            </div>

            <!-- Wrong answer feedback -->
            <Transition name="feedback">
              <div
                v-if="wrongFeedback"
                class="game-page__feedback game-page__feedback--wrong"
                role="alert"
              >
                <div class="game-page__feedback-panel game-page__feedback-panel--wrong">
                  <p class="game-page__feedback-title">Try again!</p>
                  <p class="game-page__feedback-sub">
                    Look for the animal with the same habitat, diet, and group.
                  </p>
                </div>
              </div>
            </Transition>

            <!-- Choosing Phase Overlay -->
            <Transition name="fade">
              <div
                v-if="phase === 'choosing' && round"
                class="game-page__overlay game-page__overlay--choosing"
                @pointerdown.stop
              >
                <div class="choosing-panel">
                  <h2 class="choosing-panel__title">Choose your Wild Match!</h2>
                  <p class="choosing-panel__sub">{{ matchInstruction }}</p>

                  <div class="choosing-panel__cards">
                    <button
                      v-for="(choice, index) in round.choices"
                      :key="`${choice.animalId}-${index}`"
                      type="button"
                      class="choice-card"
                      :data-testid="`wild-match-choice-${index}`"
                      :aria-label="`Choose ${choice.name}`"
                      :disabled="choiceLocked || wrongFeedback"
                      @click="handleChoice(index)"
                    >
                      <div class="choice-card__icon-wrap">
                        <RescueChoiceIcon
                          :visual-key="choice.visualKey"
                          :common-name="choice.name"
                          :fallback-emoji="choice.fallbackEmoji ?? '❓'"
                          :alt="choice.name"
                          use-css-vars
                          class="choice-card__icon"
                        />
                      </div>
                      <span class="choice-card__name">{{ choice.name }}</span>
                      <RescueChoiceTraitList
                        :traits="choice.choiceTraits"
                        :animal-name="choice.name"
                        size="choice"
                        class="choice-card__traits"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- Correct answer overlay -->
            <Transition name="feedback">
              <div
                v-if="phase === 'result' && correctResult"
                class="game-page__feedback game-page__feedback--correct"
              >
                <div class="game-page__feedback-panel game-page__feedback-panel--correct">
                  <p class="game-page__feedback-title">Great match!</p>
                  <p class="game-page__feedback-sub">Same trait pictures found!</p>
                  <div class="game-page__feedback-traits">
                    <RescueTraitBadge
                      v-for="trait in correctResult.sharedTraits"
                      :key="trait.id"
                      :trait="trait"
                      collected
                      size="mission"
                    />
                  </div>
                  <PixelButton
                    variant="orange"
                    size="lg"
                    class="game-page__reward-btn"
                    aria-label="See your reward"
                    @click="handleSeeReward"
                  >
                    See Reward
                  </PixelButton>
                </div>
              </div>
            </Transition>
          </div>

          <p v-if="!isMobile" class="game-page__keyboard-hint" aria-label="Keyboard controls">
            Move: A/D or ←/→ &nbsp;·&nbsp; Jump: Space
          </p>
        </div>

        <MobileGameControls
          v-if="isMobile && phase !== 'result'"
          class="game-page__mobile-controls"
          @left-start="onLeftStart"
          @left-end="onLeftEnd"
          @right-start="onRightStart"
          @right-end="onRightEnd"
          @jump-start="onJumpStart"
          @jump-end="onJumpEnd"
        />
      </div>
    </div>
  </BioWiraScenePage>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.game-page {
  --game-min-canvas-height: clamp(340px, 36vh, 420px);
  --game-choice-animal-size: 80px;
  --game-choice-trait-icon: 24px;

  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;

  @media (max-width: $bp-md) {
    flex: none;
    min-height: unset;
  }
}

.game-page__stage {
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-2);

  .explorer-rescue-game-host--fill-viewport & {
    @media (min-width: #{$bp-lg}) {
      gap: var(--space-1);
    }
  }
}

.game-page__stage-shell {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}

// ── Top bar & frame shell (aligned width via shared parent) ───────────────────
.game-page__topbar {
  display: grid;
  width: 100%;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  padding: var(--space-3);
  flex-shrink: 0;
  background: var(--color-bg-card);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: var(--pixel-shadow-lg);

  @media (min-width: #{$bp-xl}) {
    grid-template-columns:
      auto
      2px
      minmax(min-content, 1.1fr)
      minmax(280px, 2.55fr)
      2px
      auto;
    grid-template-rows: auto;
    align-items: center;
  }

  @media (min-width: #{$bp-lg}) and (max-width: #{$bp-xl - 0.02px}) {
    grid-template-columns: auto 2px minmax(0, 1fr) minmax(220px, 2.35fr) 2px auto;
  }

  @media (max-width: #{$bp-lg - 0.02px}) {
    grid-template-columns: 1fr 1fr;
    border-radius: var(--radius-lg);
    margin-bottom: 0;
    box-shadow: var(--pixel-shadow-lg);
  }
}

.game-page__topbar-section {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.game-page__topbar-section--back {
  @media (max-width: #{$bp-lg - 0.02px}) {
    grid-column: 1 / -1;
  }
}

.game-page__topbar-section--rescue-animal {
  @media (max-width: #{$bp-lg - 0.02px}) {
    grid-column: 1 / -1;
    justify-content: center;
    text-align: center;
  }

  @media (min-width: #{$bp-lg}) {
    gap: var(--space-3);
    padding-inline: var(--space-1);
  }
}

.game-page__topbar-divider {
  width: 2px;
  height: clamp(44px, 8vh, 52px);
  background: rgba(200, 168, 112, 0.65);
  border-radius: 1px;
  flex-shrink: 0;

  @media (max-width: #{$bp-lg - 0.02px}) {
    display: none;
  }
}

.game-page__back-btn {
  min-height: 44px;

  @media (max-width: #{$bp-lg - 0.02px}) {
    width: 100%;
  }
}

.game-page__rescue-animal-label {
  font-family: var(--font-readable);
  font-size: var(--text-sm);
  font-weight: 800;
  color: var(--color-text-muted);
  margin-inline-end: var(--space-1);
}

.game-page__rescue-animal-name {
  font-family: var(--font-readable);
  font-size: clamp(var(--text-sm), 1.1vw + 10px, var(--text-base));
  font-weight: 800;
  color: var(--color-text);
  word-break: break-word;
}

.game-page__rescue-animal-text {
  display: inline;
  text-align: left;
  line-height: 1.35;
}

// ── Clues + badges ────────────────────────────────────────────────────────────
.game-page__clue-summary {
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-3);
  justify-content: flex-start;

  @media (max-width: #{$bp-lg - 0.02px}) {
    grid-column: 1 / -1;
    flex-direction: column;
    align-items: stretch;
  }

  @media (min-width: #{$bp-xl}) {
    gap: var(--space-3);
  }
}

.game-page__clue-count {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  flex-shrink: 0;
}

.game-page__clue-count-label {
  font-family: var(--font-readable);
  font-size: var(--text-sm);
  font-weight: 800;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.game-page__clue-count-value {
  font-family: var(--font-readable);
  font-size: clamp(var(--text-base), 1.1vw + 11px, 18px);
  font-weight: 900;
  color: var(--color-text);
}

.game-page__clue-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  min-width: 0;
  flex: 1 1 auto;
  justify-content: flex-start;
}

.game-page__clue-badges :deep(.rescue-trait-badge--mission) {
  min-height: clamp(44px, 5.5vw, 50px);
  padding: var(--space-2) clamp(var(--space-2), 1.8vw, var(--space-3));
}

// ── Points chip ─────────────────────────────────────────────────────────────────
.game-page__points-chip {
  justify-content: center;
  padding: var(--space-1) var(--space-3);
  background: rgba(255, 248, 231, 0.85);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--pixel-shadow);
  flex-shrink: 0;
  gap: var(--space-2);

  @media (max-width: #{$bp-lg - 0.02px}) {
    grid-column: 1 / -1;
    width: 100%;
  }

  @media (min-width: #{$bp-xl}) {
    justify-self: end;
  }
}

.game-page__points-value {
  font-family: var(--font-readable);
  font-size: var(--text-base);
  font-weight: 800;
  color: var(--color-text);
}

.game-page__leaf-icon {
  flex-shrink: 0;
}

.game-page__keyboard-hint {
  font-family: var(--font-readable);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text-muted);
  text-align: center;
  margin: 0;
  flex-shrink: 0;
}

// ── Game frame (canvas + overlays) ─────────────────────────────────────────────
.game-page__frame {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  border: 3px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  box-shadow:
    inset 0 4px 0 rgba(61, 43, 31, 0.06),
    var(--pixel-shadow-lg);
  background: rgba(91, 138, 60, 0.12);

  @media (max-width: #{$bp-lg - 0.02px}) {
    border-radius: var(--radius-lg);
    border-top: 3px solid var(--color-border);
  }
}

.game-page__canvas {
  display: block;
  width: 100%;
  flex: 1 1 auto;
  min-height: var(--game-min-canvas-height);
  position: relative;

  @media (max-width: #{$bp-lg - 0.02px}) {
    min-height: min(340px, 52vh);
    aspect-ratio: 4 / 3;
    flex: none;
    height: auto;
    max-height: min(58vh, 520px);
  }

  @media (min-width: #{$bp-lg}) {
    min-height: max(var(--game-min-canvas-height), clamp(352px, 34vh, 420px));

    .explorer-rescue-game-host--fill-viewport & {
      /* Flex chain fills shell below HUD — avoids body scroll from vh-based mins */
      min-height: 0;
      flex: 1 1 auto;
    }
  }

  :deep(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    touch-action: none;
  }
}

.game-page__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card);
  z-index: 20;

  &--error {
    background: rgba(255, 248, 231, 0.97);
  }

  &--choosing {
    background: rgba(255, 248, 231, 0.95);
    backdrop-filter: blur(4px);
    z-index: 25;
    align-items: center;
    justify-content: safe center;
    overflow-x: hidden;
    overflow-y: auto;
    padding: var(--space-3);
    -webkit-overflow-scrolling: touch;
    pointer-events: auto;
  }
}

// ── Choosing Panel ────────────────────────────────────────────────────────────
.choosing-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-2);
  width: min(100%, 940px);
  margin: auto;
  height: auto;
  flex-shrink: 0;
  box-sizing: border-box;
  gap: var(--space-2);

  @media (max-width: #{$bp-lg - 0.02px}) {
    padding: var(--space-3);
    gap: var(--space-3);
  }
}

.choosing-panel__title {
  font-family: var(--font-readable);
  font-size: clamp(20px, 3.2vw, 28px);
  font-weight: 900;
  color: var(--color-primary);
  margin: 0;
  flex-shrink: 0;
  line-height: 1.15;
}

.choosing-panel__sub {
  font-family: var(--font-readable);
  font-size: clamp(var(--text-sm), 1vw + 11px, var(--text-base));
  color: var(--color-text);
  margin: 0;
  flex-shrink: 0;
  line-height: 1.35;
  max-width: 42ch;
}

.choosing-panel__cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 280px));
  justify-content: center;
  gap: var(--space-2);
  width: 100%;

  @media (max-width: $bp-sm) {
    grid-template-columns: minmax(0, 360px);
  }
}

.choice-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-2);
  background: var(--color-bg-card);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  box-shadow: var(--pixel-shadow);
  transition: transform var(--transition-fast), border-color var(--transition-fast);
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  text-align: center;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    pointer-events: none;
  }

  &:not(:disabled):hover {
    transform: translateY(-2px);
    border-color: var(--color-secondary);
  }

  &:not(:disabled):active {
    transform: translateY(1px);
    box-shadow: none;
  }

  // Trait rows and icons are display-only — the whole card is one pick target.
  .choice-card__icon-wrap,
  .choice-card__name,
  .choice-card__traits,
  :deep(.rescue-choice-trait-list),
  :deep(.rescue-trait-badge) {
    pointer-events: none;
  }
}

.choice-card__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: var(--game-choice-animal-size, 80px);
  flex-shrink: 0;
}

.choice-card__icon {
  flex-shrink: 0;
}

.choice-card__name {
  font-family: var(--font-readable);
  font-size: clamp(var(--text-sm), 1.1vw + 10px, var(--text-base));
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.25;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  width: 100%;
  flex-shrink: 0;
}

.choice-card__traits {
  width: 100%;
  min-width: 0;
  flex-shrink: 0;
}

.game-page__feedback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  z-index: 40;
  background: rgba(45, 32, 22, 0.55);
  backdrop-filter: blur(3px);
  pointer-events: auto;

  &--wrong {
    z-index: 45;
  }

  &--correct {
    z-index: 50;
  }
}

.game-page__feedback-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  width: min(100%, 420px);
  padding: clamp(var(--space-4), 4vw, var(--space-6));
  border-radius: var(--radius-lg);
  border: 4px solid var(--color-border);
  box-shadow: var(--pixel-shadow-lg);
  text-align: center;

  &--wrong {
    background: #fff8e7;
    border-color: #e65100;
  }

  &--correct {
    background: #f1fff1;
    border-color: #2e7d32;
  }
}

.game-page__feedback-title {
  font-family: var(--font-readable);
  font-size: clamp(28px, 5vw, 40px);
  font-weight: 900;
  color: var(--color-primary);
  margin: 0;
  line-height: 1.15;

  .game-page__feedback-panel--wrong & {
    color: #e65100;
  }

  .game-page__feedback-panel--correct & {
    color: #2e7d32;
  }
}

.game-page__feedback-sub {
  font-family: var(--font-readable);
  font-size: clamp(var(--text-base), 1.4vw + 12px, 20px);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.4;
  max-width: 34ch;
}

.game-page__feedback-traits {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: center;
  width: 100%;
}

.game-page__feedback-traits :deep(.rescue-trait-badge--mission) {
  min-height: clamp(48px, 6vw, 56px);
}

.game-page__reward-btn {
  margin-top: var(--space-2);
}

// ── Mobile controls ───────────────────────────────────────────────────────────
.game-page__mobile-controls {
  margin-top: var(--space-2);
  padding-bottom: calc(var(--nav-height-bottom) + env(safe-area-inset-bottom, 0px));

  @media (min-width: 768px) {
    display: none;
  }
}

// ── Transitions ───────────────────────────────────────────────────────────────
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.feedback-enter-active,
.feedback-leave-active {
  transition: opacity 0.3s ease;
}
.feedback-enter-from,
.feedback-leave-to {
  opacity: 0;
}
</style>
