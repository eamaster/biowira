<script setup lang="ts">
/**
 * Shared 4-up reward summary (Leaf, Level, Rainforest, Stamp) used on result surfaces.
 * Styling matches Explorer Rescue completion; callers supply copy for restoration replay.
 */
import { computed, useId } from 'vue'
import { EXPLORER_RESCUE_ASSETS } from '@/app/branding'
import {
  LEAF_POINTS_GAMEPLAY_ICON_KEY,
  formatLeafPointsCount,
} from '@/domain/pointsCurrency'
import PixelProgressBar from '@/components/ui/PixelProgressBar.vue'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'

const props = withDefaults(
  defineProps<{
    pointsEarned: number
    totalLeafPoints: number
    level: number
    levelTitle: string
    levelProgressPercent: number
    showLevelUp: boolean
    /**
     * Rainforest + journal stamp cards — only for activities that record
     * game-journal completions (rescue, mission, eco-comic). Quiz omits these.
     */
    includeJournalRewards?: boolean
    restorationBefore?: number
    restorationAfter?: number
    isFirstCompletion?: boolean
    /** e.g. "Already restored for this rescue" / "…this stamp" */
    restorationReplayHint?: string
    /** Override default "NEW STAMP" / "STAMP COLLECTED" heading when set. */
    stampTitleLabel?: string
    /** Override default journal stamp status line when set. */
    stampStatusLabel?: string
  }>(),
  {
    includeJournalRewards: true,
    restorationBefore: 0,
    restorationAfter: 0,
    isFirstCompletion: false,
    restorationReplayHint: '',
  },
)

const uid = useId()
const leafHeadingId = `${uid}-leaf`
const levelHeadingId = `${uid}-level`
const restorationHeadingId = `${uid}-restoration`
const stampHeadingId = `${uid}-stamp`

const forestIconSrc = EXPLORER_RESCUE_ASSETS.gameplay.clues.habitatForest
const passportSrc = EXPLORER_RESCUE_ASSETS.landing.passportIcon

const restorationDelta = computed(
  () => props.restorationAfter - props.restorationBefore,
)

const stampTitleLabel = computed(
  () =>
    props.stampTitleLabel ??
    (props.isFirstCompletion ? 'NEW STAMP' : 'STAMP COLLECTED'),
)

const stampStatusLabel = computed(
  () =>
    props.stampStatusLabel ??
    (props.isFirstCompletion ? 'Journal Updated!' : 'Already in Journal'),
)
</script>

<template>
  <section
    class="result-page__achievement-board"
    :class="{
      'result-page__achievement-board--progress-only': !includeJournalRewards,
    }"
    aria-label="Your rewards"
  >
    <article
      class="result-page__achievement-card result-page__achievement-card--leaf"
      data-testid="result-reward-leaf-points"
      :aria-labelledby="leafHeadingId"
    >
      <h2 :id="leafHeadingId" class="result-page__achievement-heading">
        LEAF POINTS EARNED
      </h2>
      <GameplayIcon
        :type="LEAF_POINTS_GAMEPLAY_ICON_KEY"
        size="clamp(52px, 9vw, 76px)"
        class="result-page__achievement-icon"
        alt=""
      />
      <p class="result-page__achievement-value">
        +{{ formatLeafPointsCount(pointsEarned) }}
      </p>
      <p class="result-page__achievement-sub">
        Total: {{ formatLeafPointsCount(totalLeafPoints) }}
      </p>
    </article>

    <article
      class="result-page__achievement-card result-page__achievement-card--level"
      data-testid="result-reward-level-progress"
      :aria-labelledby="levelHeadingId"
    >
      <div class="result-page__achievement-card-head">
        <h2 :id="levelHeadingId" class="result-page__achievement-heading">
          LEVEL PROGRESS
        </h2>
        <span
          v-if="showLevelUp"
          class="result-page__level-up-badge"
          aria-live="polite"
        >
          LEVEL UP!
        </span>
      </div>
      <div
        class="result-page__achievement-progress-icon-gap"
        aria-hidden="true"
      ></div>
      <PixelProgressBar
        :value="levelProgressPercent"
        :max="100"
        class="result-page__achievement-bar"
      />
      <p class="result-page__achievement-level-line">
        LV {{ level }} - {{ levelTitle }}
      </p>
    </article>

    <article
      v-if="includeJournalRewards"
      class="result-page__achievement-card result-page__achievement-card--restoration"
      data-testid="result-reward-restoration"
      :aria-labelledby="restorationHeadingId"
    >
      <h2 :id="restorationHeadingId" class="result-page__achievement-heading">
        RAINFOREST RESTORED
      </h2>
      <img
        :src="forestIconSrc"
        alt=""
        class="result-page__achievement-progress-icon-gap result-page__achievement-icon-img"
        aria-hidden="true"
        draggable="false"
      >
      <PixelProgressBar
        :value="restorationAfter"
        :max="100"
        color="var(--color-primary)"
        class="result-page__achievement-bar"
      />
      <p class="result-page__achievement-restoration-range">
        {{ restorationBefore }}% → {{ restorationAfter }}%
      </p>
      <p
        v-if="restorationDelta > 0"
        class="result-page__achievement-sub result-page__achievement-sub--delta"
      >
        +{{ restorationDelta }}% Restoration
      </p>
      <p
        v-else
        class="result-page__achievement-sub result-page__achievement-sub--replay"
      >
        {{ restorationReplayHint }}
      </p>
    </article>

    <article
      v-if="includeJournalRewards"
      class="result-page__achievement-card result-page__achievement-card--stamp"
      :class="
        isFirstCompletion
          ? 'result-page__achievement-card--stamp-new'
          : 'result-page__achievement-card--stamp-replay'
      "
      data-testid="result-reward-journal-stamp"
      :aria-labelledby="stampHeadingId"
    >
      <h2 :id="stampHeadingId" class="result-page__achievement-heading">
        {{ stampTitleLabel }}
      </h2>
      <img
        :src="passportSrc"
        alt=""
        class="result-page__achievement-stamp-img"
        aria-hidden="true"
        draggable="false"
      >
      <p class="result-page__achievement-stamp-status">
        {{ stampStatusLabel }}
      </p>
    </article>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.result-page__achievement-board {
  display: grid;
  width: 100%;
  min-width: 0;
  gap: clamp(var(--space-3), 1.8vw, var(--space-5));
  grid-template-columns: 1fr;

  @media (min-width: $bp-md) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1100px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  &--progress-only {
    @media (min-width: $bp-md) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (min-width: 1100px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}

.result-page__achievement-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: clamp(var(--space-2), 1.2vw, var(--space-3));
  min-height: clamp(188px, 26vh, 248px);
  min-width: 0;
  padding: clamp(var(--space-3), 2vw, var(--space-5));
  background: var(--scene-warm-panel-bg);
  border: var(--pixel-border-thick) solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--pixel-shadow-lg), var(--scene-warm-panel-shadow);
}

.result-page__achievement-card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
}

.result-page__achievement-heading {
  margin: 0;
  font-family: var(--font-readable);
  font-size: clamp(var(--text-xs), 1.1vw + 10px, var(--text-sm));
  font-weight: 900;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  text-transform: uppercase;
  line-height: 1.25;
}

.result-page__level-up-badge {
  font-family: var(--font-readable);
  font-size: clamp(11px, 1vw + 8px, 13px);
  font-weight: 900;
  letter-spacing: 0.04em;
  color: var(--color-text-on-dark);
  background: var(--color-secondary);
  border: 2px solid var(--btn-yellow-border);
  border-radius: var(--radius-full);
  padding: 4px 10px;
  box-shadow: var(--pixel-shadow);
}

.result-page__achievement-progress-icon-gap,
.result-page__achievement-icon-img {
  width: clamp(48px, 8vw, 72px);
  height: clamp(48px, 8vw, 72px);
  flex-shrink: 0;
}

.result-page__achievement-icon-img {
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.result-page__achievement-stamp-img {
  width: clamp(56px, 10vw, 84px);
  height: clamp(56px, 10vw, 84px);
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  flex-shrink: 0;
}

.result-page__achievement-value {
  margin: 0;
  font-family: var(--font-readable);
  font-weight: 900;
  font-size: clamp(var(--text-xl), 3vw + 12px, var(--text-3xl));
  color: var(--color-secondary);
  line-height: 1.1;
}

.result-page__achievement-sub {
  margin: 0;
  font-family: var(--font-readable);
  font-size: clamp(var(--text-sm), 1.2vw + 10px, var(--text-base));
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.3;
}

.result-page__achievement-sub--delta {
  color: var(--color-primary-dark);
}

.result-page__achievement-sub--replay {
  color: var(--color-text-muted);
}

.result-page__achievement-level-line {
  margin: 0;
  font-family: var(--font-readable);
  font-size: clamp(var(--text-sm), 1.3vw + 9px, var(--text-md));
  font-weight: 900;
  color: var(--color-text);
  line-height: 1.3;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.result-page__achievement-restoration-range {
  margin: 0;
  font-family: var(--font-readable);
  font-weight: 900;
  font-size: clamp(var(--text-base), 1.8vw + 8px, var(--text-lg));
  color: var(--color-primary-dark);
  line-height: 1.2;
}

.result-page__achievement-stamp-status {
  margin: 0;
  font-family: var(--font-readable);
  font-weight: 800;
  font-size: clamp(var(--text-sm), 1.2vw + 10px, var(--text-base));
  color: var(--color-text);
  line-height: 1.35;
}

.result-page__achievement-bar {
  width: 100%;
  min-width: 0;

  :deep(.progress-bar) {
    width: 100%;
  }
}

.result-page__achievement-card--leaf {
  border-color: var(--color-secondary);
}

.result-page__achievement-card--stamp-new {
  border-color: var(--color-secondary);
  background: linear-gradient(
    180deg,
    rgba(232, 160, 32, 0.14) 0%,
    var(--scene-warm-panel-bg) 48%
  );
}

.result-page__achievement-card--stamp-replay {
  border-color: var(--color-border-light);
}

.result-page__achievement-card--stamp-replay .result-page__achievement-stamp-status {
  color: var(--color-text-muted);
}
</style>
