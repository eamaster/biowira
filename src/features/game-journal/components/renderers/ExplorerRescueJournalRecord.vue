<script setup lang="ts">
/**
 * ExplorerRescueJournalRecord — Explorer Rescue Run journal stamp page.
 * Uses WEBP sprites from the central asset registry.
 *
 * Prototype: explorer_rescue_run_journal_frogs.png / explorer_rescue_run_journal_sunbear.png
 */
import { computed } from 'vue'
import type { GameJournalRecord } from '@/domain/gameJournal'
import { getAnimalIconUrl } from '@/app/iconRegistry'
import { getExplorerRescueJournalAssets } from '../../data/gameJournalAssetRegistry'
import { resolveSharedClueBadgesForJournal } from '@/features/explorer-rescue-run/data/explorerRescueClues'
import { getStampById } from '../../data/gameJournalCatalog'
import JournalBookFrame from '../JournalBookFrame.vue'
import PixelProgressBar from '@/components/ui/PixelProgressBar.vue'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'
import { LEAF_POINTS_GAMEPLAY_ICON_KEY, LEAF_POINTS_LABEL, formatLeafPointsCount } from '@/domain/pointsCurrency'

const props = defineProps<{
  record: GameJournalRecord
  /** @deprecated Restoration is read from record.restorationPercent* fields. */
  rainforestPercent?: number
}>()

const rescueAnimalName = computed(() => props.record.metadata?.rescueAnimalName ?? 'Unknown Explorer')
const wildMatchName    = computed(() => props.record.metadata?.wildMatchName    ?? 'Wild Match')
const sharedClueBadges = computed(() =>
  resolveSharedClueBadgesForJournal({
    sharedTraitIds: props.record.metadata?.sharedTraitIds,
    sharedTraitLabels: props.record.metadata?.sharedTraitLabels,
  }),
)

// Resolve WEBP sprites based on animal names
const webpAssets = computed(() =>
  getExplorerRescueJournalAssets(rescueAnimalName.value, wildMatchName.value),
)

const hasWebpCard  = computed(() => Boolean(webpAssets.value.cardAsset))
const hasWebpStamp = computed(() => Boolean(webpAssets.value.stampAsset))

// Fallback SVG icon URLs for animals without dedicated WEBP sprites
function nameToId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}
const rescueIconUrl  = computed(() => getAnimalIconUrl(nameToId(rescueAnimalName.value)))
const wildMatchUrl   = computed(() => getAnimalIconUrl(nameToId(wildMatchName.value)))

const stampTitle = computed(() => {
  const r = rescueAnimalName.value
  const w = wildMatchName.value
  if (!r || r === 'Unknown Explorer') return props.record.stampTitle || 'Wild Match Finder'
  return `${r} & ${w}`
})

/** Same data chain as Eco-Comic / Nature Mission journal pages — catalog fallback when record text is missing. */
const missionDescription = computed(() => {
  const raw = props.record.description?.trim()
  if (raw) return raw
  return getStampById(props.record.stampId)?.description ?? ''
})

// Fixed restoration values from the record (AC3)
const restAfter  = computed(() => props.record.restorationPercentAfter  ?? props.rainforestPercent ?? 0)
const restBefore = computed(() => props.record.restorationPercentBefore ?? 0)
const restDelta  = computed(() => props.record.restorationPercentDelta  ?? Math.max(0, restAfter.value - restBefore.value))
const restLabel  = computed(() =>
  restDelta.value > 0 ? `+${restDelta.value}% this session` : 'Already restored for this stamp',
)
</script>

<template>
  <JournalBookFrame>
    <!-- LEFT: Rescue Animal + Wild Match cards -->
    <template #left>
      <div class="rescue-left">
        <!-- Use WEBP card sprite when available -->
        <template v-if="hasWebpCard">
          <img
            :src="webpAssets.cardAsset"
            :alt="`${rescueAnimalName} and ${wildMatchName}`"
            class="rescue-left__webp-card"
          />
        </template>

        <!-- CSS card fallback when no dedicated WEBP exists -->
        <template v-else>
          <div class="rescue-left__card rescue-left__card--rescue">
            <div class="rescue-left__card-badge">Rescue Animal</div>
            <div class="rescue-left__img-wrap">
              <img
                v-if="rescueIconUrl"
                :src="rescueIconUrl"
                :alt="rescueAnimalName"
                class="rescue-left__img"
              />
              <span v-else aria-hidden="true" class="rescue-left__emoji">🐾</span>
            </div>
            <div class="rescue-left__card-name">
              <span class="rescue-left__sublabel">Explorer:</span>
              {{ rescueAnimalName }}
            </div>
          </div>

          <div class="rescue-left__card rescue-left__card--wild">
            <div class="rescue-left__card-badge rescue-left__card-badge--wild">Wild Match</div>
            <div class="rescue-left__img-wrap rescue-left__img-wrap--sm">
              <img
                v-if="wildMatchUrl"
                :src="wildMatchUrl"
                :alt="wildMatchName"
                class="rescue-left__img rescue-left__img--sm"
              />
              <span v-else aria-hidden="true" class="rescue-left__emoji rescue-left__emoji--sm">🐾</span>
            </div>
            <div class="rescue-left__card-name">{{ wildMatchName }}</div>
          </div>
        </template>
      </div>
    </template>

    <!-- CENTER: Rescue stamp WEBP or CSS fallback -->
    <template #center>
      <div class="rescue-center">
        <div
          class="rescue-center__stamp"
          :aria-label="`${stampTitle} rescue stamp`"
          :data-testid="`journal-stamp-${record.stampId}`"
        >
          <template v-if="hasWebpStamp">
            <img
              :src="webpAssets.stampAsset"
              :alt="stampTitle"
              class="rescue-center__stamp-webp"
            />
          </template>
          <template v-else>
            <div class="rescue-center__title">{{ stampTitle }}</div>
            <div class="rescue-center__art" aria-hidden="true">
              <div class="rescue-center__art-pair">
                <img
                  v-if="rescueIconUrl"
                  :src="rescueIconUrl"
                  :alt="rescueAnimalName"
                  class="rescue-center__art-img"
                />
                <span v-else class="rescue-center__art-emoji">🐾</span>
                <img
                  v-if="wildMatchUrl"
                  :src="wildMatchUrl"
                  :alt="wildMatchName"
                  class="rescue-center__art-img"
                />
                <span v-else class="rescue-center__art-emoji">🐾</span>
              </div>
            </div>
            <div class="rescue-center__caption">{{ stampTitle }}</div>
          </template>
        </div>
      </div>
    </template>

    <!-- RIGHT: Clue badges + stats -->
    <template #right>
      <div class="rescue-right">
        <div class="rescue-right__clues-block">
          <h3 class="rescue-right__heading">Shared Clue Badges</h3>

          <div
            v-if="sharedClueBadges.length"
            class="rescue-right__badges"
            aria-label="Shared clue badges"
          >
            <div
              v-for="badge in sharedClueBadges"
              :key="badge.label"
              class="rescue-right__badge"
            >
              <div class="rescue-right__badge-icon-slot" aria-hidden="true">
                <img
                  v-if="badge.iconPath"
                  :src="badge.iconPath"
                  alt=""
                  class="rescue-right__badge-img"
                />
                <span v-else class="rescue-right__badge-emoji">
                  {{ badge.fallbackEmoji }}
                </span>
              </div>
              <span class="rescue-right__badge-label">{{ badge.label }}</span>
            </div>
          </div>
          <p v-else class="rescue-right__no-clues">No shared clue data recorded.</p>
        </div>

        <div v-if="missionDescription" class="rescue-right__mission">
          <h3 class="rescue-right__heading">Mission Description</h3>
          <p class="rescue-right__desc">{{ missionDescription }}</p>
        </div>

        <div class="rescue-right__stat">
          <span class="rescue-right__stat-label">🌿 Rainforest Restored</span>
          <PixelProgressBar :value="restAfter" :max="100" />
          <span class="rescue-right__stat-value rescue-right__stat-value--restore">
            {{ restBefore }}% → {{ restAfter }}%
          </span>
          <span class="rescue-right__stat-delta" :class="restDelta > 0 ? 'rescue-right__stat-delta--positive' : ''">
            {{ restLabel }}
          </span>
        </div>

        <div class="rescue-right__stat">
          <span class="rescue-right__stat-label">
            <GameplayIcon :type="LEAF_POINTS_GAMEPLAY_ICON_KEY" size="18px" :alt="LEAF_POINTS_LABEL" />
            {{ LEAF_POINTS_LABEL }} Earned
          </span>
          <span class="rescue-right__stat-value rescue-right__stat-value--points">
            {{ formatLeafPointsCount(record.leafPointsEarned) }}
          </span>
        </div>
      </div>
    </template>
  </JournalBookFrame>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;
@use '@/features/game-journal/styles/journalRecordLayout' as journalLayout;

// ── Left ─────────────────────────────────────────────────────
.rescue-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  height: 100%;
  justify-content: center;
  align-items: center;
  width: 100%;

  // WEBP card variant
  &__webp-card {
    width: 100%;
    max-width: 180px;
    height: auto;
    object-fit: contain;
    display: block;
    border-radius: var(--radius-sm);
  }

  // CSS fallback cards
  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    background: #fffdf0;
    border: 2px solid #c8a870;
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-3);
    box-shadow: 2px 2px 0 rgba(61, 43, 31, 0.12);

    &--wild { transform: translateX(6px); border-color: #d4b060; }
  }

  &__card-badge {
    font-family: var(--font-readable);
    font-size: 10px;
    font-weight: 900;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: rgba(140, 100, 40, 0.12);
    padding: 1px 6px;
    border-radius: 4px;

    &--wild { background: rgba(180, 140, 60, 0.15); }
  }

  &__img-wrap {
    width: 60px;
    height: 60px;
    background: #f0e8d0;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    &--sm { width: 48px; height: 48px; }
  }

  &__img {
    width: 52px;
    height: 52px;
    object-fit: contain;

    &--sm { width: 40px; height: 40px; }
  }

  &__emoji { font-size: 34px; line-height: 1; &--sm { font-size: 26px; } }

  &__card-name {
    font-family: var(--font-readable);
    font-size: clamp(10px, 1.2vw, 12px);
    font-weight: 900;
    color: var(--color-text);
    text-align: center;
  }

  &__sublabel { display: block; font-size: 9px; color: var(--color-text-muted); font-weight: 700; }
}

// ── Center ───────────────────────────────────────────────────
.rescue-center {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;

  &__stamp {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
  }

  // WEBP stamp variant
  &__stamp-webp {
    width: 100%;
    max-width: 220px;
    height: auto;
    object-fit: contain;
    display: block;
    border-radius: var(--radius-md);
  }

  // CSS fallback stamp
  &__title {
    font-family: var(--font-readable);
    font-size: clamp(10px, 1.3vw, 13px);
    font-weight: 900;
    color: var(--color-text);
    text-align: center;
    line-height: 1.3;
  }

  &__art {
    width: 100%;
    background: #e8dfc8;
    border: 2px dashed #c8a870;
    border-radius: var(--radius-sm);
    padding: var(--space-3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__art-pair {
    display: flex;
    gap: var(--space-2);
    align-items: flex-end;
    justify-content: center;
  }

  &__art-img { width: 52px; height: 52px; object-fit: contain; }
  &__art-emoji { font-size: 36px; line-height: 1; }

  &__caption {
    font-family: var(--font-readable);
    font-size: 10px;
    font-weight: 800;
    color: var(--color-text-muted);
    text-align: center;
  }
}

// ── Right ────────────────────────────────────────────────────
// Stack segments in document order — do NOT use nested flex-grow on mission + body copy
// (same pattern as NatureMissionJournalRecord.mission-right) or flex line heights collapse
// and text paints on top of later sections inside the fixed-aspect book.
.rescue-right {
  --explorer-journal-clue-icon-size: clamp(28px, 4.2vw, 40px);
  --explorer-journal-clue-label-lines: 2;
  --explorer-journal-clue-label-min-height: calc(
    var(--text-xs) * 1.2 * var(--explorer-journal-clue-label-lines)
  );

  @include journalLayout.journal-record-right-column;

  &__clues-block {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    flex: 0 0 auto;
    min-width: 0;
  }

  &__heading {
    font-family: var(--font-readable);
    font-size: clamp(12px, 1.5vw, 15px);
    font-weight: 900;
    color: var(--color-text);
    margin: 0;
    line-height: 1.2;
  }

  &__mission {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    flex: 0 0 auto;
    min-width: 0;
  }

  &__desc {
    font-family: var(--font-body);
    font-size: clamp(11px, 1.35vw, 13px);
    font-weight: 700;
    color: var(--color-text-light);
    line-height: 1.35;
    margin: 0;
    min-width: 0;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    overflow-wrap: anywhere;
  }

  &__badges {
    @include journalLayout.journal-clue-badge-row;
  }

  &__badge {
    @include journalLayout.journal-clue-badge-item(var(--explorer-journal-clue-icon-size));
  }

  &__badge-icon-slot {
    @include journalLayout.journal-clue-icon-slot(var(--explorer-journal-clue-icon-size));
  }

  &__badge-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    display: block;
  }

  &__badge-emoji {
    font-size: calc(var(--explorer-journal-clue-icon-size) * 0.72);
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__badge-label {
    font-family: var(--font-readable);
    font-size: var(--text-xs);
    font-weight: 900;
    color: var(--color-text);
    text-align: center;
    line-height: 1.2;
    width: 100%;
    max-width: 100%;
    min-height: var(--explorer-journal-clue-label-min-height);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: var(--explorer-journal-clue-label-lines);
    overflow: hidden;
  }

  &__no-clues {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 0 0 auto;
    min-width: 0;
  }

  &__stat-label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-family: var(--font-readable);
    font-size: var(--text-xs);
    font-weight: 800;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    line-height: 1.2;
  }

  &__stat-value {
    font-family: var(--font-readable);
    font-weight: 900;
    line-height: 1.2;

    &--restore {
      font-size: var(--text-sm);
      color: var(--color-primary);
    }

    &--points {
      font-size: var(--text-lg);
      color: var(--color-secondary);
    }
  }

  &__stat-delta {
    font-family: var(--font-readable);
    font-size: 10px;
    font-weight: 800;
    color: var(--color-text-muted);
    line-height: 1.2;

    &--positive { color: var(--color-primary); }
  }

  :deep(.progress-bar) {
    min-height: 10px;
  }
}
</style>
