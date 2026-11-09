<script setup lang="ts">
import { computed } from 'vue'
import type { MissionInstance } from '@/domain/mission'
import PixelCard from '@/components/ui/PixelCard.vue'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'
import AnimalIcon from '@/components/ui/AnimalIcon.vue'
import { LEAF_POINTS_GAMEPLAY_ICON_KEY, LEAF_POINTS_LABEL } from '@/domain/pointsCurrency'
import { resolveMissionCardTitleDisplay } from '@/features/game-journal/data/journalMissionMapping'

const props = defineProps<{
  mission: MissionInstance | null
  loading?: boolean
  starting?: boolean
  completing?: boolean
}>()

/** Preview / in-progress: spirit icon + emoji-free headline (animal keyword rules mirror journal/stamps). */
const activeMissionTitleParts = computed(() =>
  props.mission && (props.mission.status === 'preview' || props.mission.status === 'in_progress')
    ? resolveMissionCardTitleDisplay(props.mission.title)
    : null,
)

const emit = defineEmits<{
  start: []
  complete: []
  'new-mission': []
}>()
</script>

<template>
  <div class="mission-card-wrapper">
    <!-- Loading: fetching mission from API -->
    <PixelCard v-if="loading" class="mission-card mission-card--loading">
      <div class="mission-card__loading-text">Finding a mission...</div>
    </PixelCard>

    <!-- Completed state -->
    <PixelCard v-else-if="mission && mission.completed" class="mission-card mission-card--completed">
      <div class="mission-card__celebration" aria-hidden="true">
        <GameplayIcon type="trophy" size="56px" />
      </div>
      <h3 class="mission-card__title">Mission Complete!</h3>
      <p class="mission-card__desc">
        Great job! You earned {{ mission.pointsValue }} {{ LEAF_POINTS_LABEL }}.
      </p>
      <button
        class="mission-card__btn mission-card__btn--new"
        @click="emit('new-mission')"
      >
        Get a New Mission
      </button>
    </PixelCard>

    <!-- Preview state: mission fetched but not yet started -->
    <PixelCard v-else-if="mission && mission.status === 'preview'" class="mission-card">
      <div class="mission-card__header">
        <h3 class="mission-card__title mission-card__title--with-spirit">
          <span class="mission-card__title-text">{{ activeMissionTitleParts?.titleText }}</span>
          <AnimalIcon
            v-if="activeMissionTitleParts"
            class="mission-card__title-spirit"
            :icon-key="activeMissionTitleParts.animalIconKey"
            :fallback-emoji="activeMissionTitleParts.animalFallbackEmoji"
            size="30px"
          />
        </h3>
        <span class="mission-card__badge" :class="`mission-card__badge--${mission.environment}`">
          {{ mission.environment === 'outdoor' ? 'Outdoor' : mission.environment === 'indoor' ? 'Indoor' : 'Indoor or outdoor' }}
        </span>
      </div>

      <p class="mission-card__desc">{{ mission.description }}</p>

      <ol class="mission-card__steps">
        <li v-for="(step, index) in mission.steps" :key="index">
          {{ step }}
        </li>
      </ol>

      <div class="mission-card__footer">
        <span class="mission-card__meta">
          <GameplayIcon type="missions" size="16px" class="mission-card__meta-icon" />
          {{ mission.durationMinutes }} min
        </span>
        <span class="mission-card__meta">
          <GameplayIcon :type="LEAF_POINTS_GAMEPLAY_ICON_KEY" size="16px" class="mission-card__meta-icon" />
          +{{ mission.pointsValue }} {{ LEAF_POINTS_LABEL }}
        </span>
      </div>

      <button
        class="mission-card__btn mission-card__btn--start"
        :disabled="starting"
        @click="emit('start')"
      >
        {{ starting ? 'Starting...' : 'Start Mission!' }}
      </button>
    </PixelCard>

    <!-- In-progress state: mission assigned and started -->
    <PixelCard v-else-if="mission && mission.status === 'in_progress'" class="mission-card">
      <div class="mission-card__header">
        <h3 class="mission-card__title mission-card__title--with-spirit">
          <span class="mission-card__title-text">{{ activeMissionTitleParts?.titleText }}</span>
          <AnimalIcon
            v-if="activeMissionTitleParts"
            class="mission-card__title-spirit"
            :icon-key="activeMissionTitleParts.animalIconKey"
            :fallback-emoji="activeMissionTitleParts.animalFallbackEmoji"
            size="30px"
          />
        </h3>
        <span class="mission-card__badge" :class="`mission-card__badge--${mission.environment}`">
          {{ mission.environment === 'outdoor' ? 'Outdoor' : mission.environment === 'indoor' ? 'Indoor' : 'Indoor or outdoor' }}
        </span>
      </div>

      <p class="mission-card__desc">{{ mission.description }}</p>

      <ol class="mission-card__steps">
        <li v-for="(step, index) in mission.steps" :key="index">
          {{ step }}
        </li>
      </ol>

      <div class="mission-card__footer">
        <span class="mission-card__meta">
          <GameplayIcon type="missions" size="16px" class="mission-card__meta-icon" />
          {{ mission.durationMinutes }} min
        </span>
        <span class="mission-card__meta">
          <GameplayIcon :type="LEAF_POINTS_GAMEPLAY_ICON_KEY" size="16px" class="mission-card__meta-icon" />
          +{{ mission.pointsValue }} {{ LEAF_POINTS_LABEL }}
        </span>
      </div>

      <button
        class="mission-card__btn mission-card__btn--complete"
        :disabled="completing"
        @click="emit('complete')"
      >
        {{ completing ? 'Saving...' : 'Done!' }}
      </button>
    </PixelCard>

    <!-- Empty / no mission available -->
    <PixelCard v-else class="mission-card mission-card--empty">
      <div class="mission-card__empty-icon" aria-hidden="true">
        <GameplayIcon type="leafLevel" size="48px" />
      </div>
      <h3 class="mission-card__title">No mission yet</h3>
      <p class="mission-card__desc">Pick a location above, then tap the button for a fresh nature mission!</p>
      <button type="button" class="mission-card__btn mission-card__btn--new" @click="emit('new-mission')">
        Get a New Mission
      </button>
    </PixelCard>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.mission-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background: white;

  &--loading {
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }

  &--completed {
    align-items: center;
    text-align: center;
    background: #F0FFF4;
    border-color: #4CAF50 !important;
  }

  &__loading-text {
    font-family: var(--font-readable);
    font-weight: 800;
    color: var(--color-text-light);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
  }

  &__title {
    font-family: var(--font-readable);
    font-size: var(--text-lg);
    font-weight: 800;
    color: var(--color-text);
    margin: 0;
    line-height: 1.3;

    &--with-spirit {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
      min-width: 0;
    }
  }

  &__title-text {
    flex: 1 1 12rem;
    min-width: 0;
  }

  &__title-spirit {
    flex-shrink: 0;
  }

  &__badge {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-weight: 800;
    text-transform: uppercase;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    color: white;
    flex-shrink: 0;
    &--outdoor { background: #4CAF50; }
    &--indoor { background: #FF9800; }
    &--both { background: #2196F3; }
  }

  &__desc {
    font-family: var(--font-body);
    font-size: var(--text-base);
    color: var(--color-text);
    margin: 0;
  }

  &__steps {
    margin: 0;
    padding-left: var(--space-5);
    font-family: var(--font-body);
    font-size: var(--text-base);
    color: var(--color-text-light);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    li {
      line-height: 1.4;
    }
  }

  &__footer {
    display: flex;
    gap: var(--space-4);
    margin-top: var(--space-2);
  }

  &__meta {
    font-family: var(--font-body);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text);
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }

  &__meta-icon {
    flex-shrink: 0;
  }

  &__btn {
    font-family: var(--font-readable);
    font-weight: 800;
    font-size: var(--text-base);
    padding: var(--space-3);
    border-radius: var(--radius-sm);
    border: var(--pixel-border) solid;
    cursor: pointer;
    margin-top: var(--space-2);
    display: block;
    width: 100%;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: none !important;
    }

    &--start {
      background: #E8F5E9;
      border-color: #4CAF50;
      color: #2E7D32;
      box-shadow: 0 4px 0 #4CAF50;

      &:active:not(:disabled) {
        box-shadow: 0 0 0 #4CAF50;
        transform: translateY(4px);
      }
    }

    &--complete {
      background: var(--color-secondary);
      border-color: #E8A020;
      color: var(--color-text);
      box-shadow: 0 4px 0 #E8A020;

      &:active:not(:disabled) {
        box-shadow: 0 0 0 #E8A020;
        transform: translateY(4px);
      }
    }

    &--new {
      background: #E0F7FA;
      border-color: #00BCD4;
      color: #00838F;
      box-shadow: 0 4px 0 #00BCD4;

      &:active {
        box-shadow: 0 0 0 #00BCD4;
        transform: translateY(4px);
      }
    }
  }

  &__celebration {
    margin-bottom: var(--space-2);
    display: flex;
    justify-content: center;
  }

  &--empty {
    align-items: center;
    text-align: center;
    background: var(--color-bg-card);
    min-height: 180px;
    justify-content: center;
  }

  &__empty-icon {
    margin-bottom: var(--space-2);
    display: flex;
    justify-content: center;
  }
}
</style>
