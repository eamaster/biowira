<script setup lang="ts">
import type { WeatherDisplayInfo } from '@/domain/weather'
import RewardIcon from '@/components/ui/RewardIcon.vue'

defineProps<{
  loading: boolean
  displayInfo: WeatherDisplayInfo | null
}>()
</script>

<template>
  <div class="weather-chip" aria-live="polite">
    <template v-if="loading">
      <span class="weather-chip__icon" aria-hidden="true">
        <RewardIcon type="leaf" size="20px" />
      </span>
      <div class="weather-chip__copy">
        <span class="weather-chip__label">Checking weather...</span>
        <span class="weather-chip__hint">One moment!</span>
      </div>
    </template>

    <template v-else-if="displayInfo">
      <span class="weather-chip__icon" aria-hidden="true">{{ displayInfo.emoji }}</span>
      <div class="weather-chip__copy">
        <span class="weather-chip__label">{{ displayInfo.label }}</span>
        <span v-if="displayInfo.suggestion" class="weather-chip__hint">{{ displayInfo.suggestion }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.weather-chip {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--space-2);
  background: white;
  border: var(--pixel-border) solid var(--color-border);
  border-radius: 999px;
  padding: var(--space-2) var(--space-4);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
  max-width: min(100%, 420px);

  &__icon {
    font-size: 20px;
    line-height: 1;
    flex-shrink: 0;
    padding-top: 2px;
    display: inline-flex;
    align-items: center;
  }

  &__copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__label {
    font-family: var(--font-body);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.25;
  }

  &__hint {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-light);
    line-height: 1.3;
  }
}
</style>
