<script setup lang="ts">
import { ref } from 'vue'
import type { RescueTrait } from '../game/types'

const props = defineProps<{
  trait: RescueTrait
  collected?: boolean
  size?: 'sm' | 'md' | 'compact' | 'mission' | 'choice'
}>()

const imgFailed = ref(false)

function onImgError() {
  imgFailed.value = true
}
</script>

<template>
  <div
    :class="['rescue-trait-badge', `rescue-trait-badge--${size ?? 'md'}`, { 'rescue-trait-badge--collected': collected }]"
    :aria-label="trait.label"
  >
    <!-- WebP icon is the primary visual; emoji is only shown on image error or no iconPath -->
    <img
      v-if="trait.iconPath && !imgFailed"
      :src="trait.iconPath"
      alt=""
      aria-hidden="true"
      class="rescue-trait-badge__icon"
      @error="onImgError"
    >
    <span v-else class="rescue-trait-badge__emoji" aria-hidden="true">{{ trait.emoji }}</span>
    <span class="rescue-trait-badge__label">{{ trait.label }}</span>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.rescue-trait-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-readable);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text);
  box-shadow: var(--pixel-shadow);
  max-width: min(100%, 200px);
  min-width: 0;

  @media (min-width: $bp-md) {
    max-width: none;
  }

  &--sm {
    font-size: 12px;
    padding: 4px 8px;
  }

  &--compact {
    font-size: 13px;
    padding: 4px 6px;
    gap: 4px;
    max-width: 100%;

    .rescue-trait-badge__label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  // Large, kid-friendly size for the mission clue bar on the play page.
  &--mission {
    font-size: clamp(14px, 1.2vw + 10px, 17px);
    padding: 8px 12px;
    gap: 8px;
    max-width: 100%;
    min-height: 52px;

    @media (max-width: $bp-md) {
      padding: 6px 10px;
      min-height: 44px;
    }

    .rescue-trait-badge__icon {
      width: var(--game-mission-badge-icon, clamp(36px, 4vw + 24px, 48px));
      height: var(--game-mission-badge-icon, clamp(36px, 4vw + 24px, 48px));
    }

    .rescue-trait-badge__emoji {
      font-size: clamp(22px, 3vw, 32px);
    }

    .rescue-trait-badge__label {
      white-space: nowrap;
    }
  }

  // Choosing overlay traits — synced with centralized CSS var where available.
  &--choice {
    box-sizing: border-box;
    display: flex;
    flex: 0 0 auto;
    align-self: stretch;
    font-size: clamp(12px, 1vw + 10px, 14px);
    padding: 6px 8px;
    gap: 6px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    justify-content: flex-start;

    .rescue-trait-badge__icon {
      width: var(--game-choice-trait-icon, 24px);
      height: var(--game-choice-trait-icon, 24px);
    }

    .rescue-trait-badge__emoji {
      font-size: clamp(16px, 2.8vw, 22px);
    }

    .rescue-trait-badge__label {
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
      max-width: none;
      line-height: 1.25;
      text-align: left;
    }
  }
  &--collected {
    background: #fff8e7;
    border-color: var(--color-secondary);
    box-shadow: 0 0 6px rgba(232, 160, 32, 0.5);
  }

  &__icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    flex-shrink: 0;

    .rescue-trait-badge--sm & {
      width: 18px;
      height: 18px;
    }

    .rescue-trait-badge--compact & {
      width: 20px;
      height: 20px;
    }
  }

  &__emoji {
    font-size: 1.2em;
    flex-shrink: 0;
  }

  &__label {
    line-height: 1.2;
    min-width: 0;
    overflow-wrap: break-word;
    white-space: normal;
    text-align: left;

    @media (min-width: $bp-md) {
      .rescue-trait-badge:not(.rescue-trait-badge--choice) & {
        white-space: nowrap;
      }
    }
  }
}
</style>
