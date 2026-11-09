<script setup lang="ts">
/**
 * RewardIcon — A highly stable, dedicated visual wrapper guaranteeing that core
 * gameplay/reward graphics (coins, trophies, status ticks) render perfectly
 * across all browsers without falling victim to OS-level emoji inconsistences.
 *
 * Trophy uses the same registry-backed asset as GameplayIcon (see iconRegistry).
 * Correct / wrong quiz feedback stays inline — no public asset for those.
 */
import { computed } from 'vue'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'

const props = withDefaults(
  defineProps<{
    type: 'coin' | 'correct' | 'wrong' | 'trophy' | 'leaf' | 'score'
    size?: string
  }>(),
  {
    size: '24px',
  }
)

const wrapperStyle = computed(() => ({
  width: props.size,
  height: props.size,
  minWidth: props.size,
}))
</script>

<template>
  <div class="reward-icon" :style="wrapperStyle" aria-hidden="true">
    <!-- Coin / Points -->
    <svg v-if="type === 'coin'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="var(--color-secondary)" stroke="var(--color-border)" stroke-width="2" />
      <path d="M12 7 L14 11 L18 12 L14 13 L12 17 L10 13 L6 12 L10 11 Z" fill="#FFF8E7" />
    </svg>

    <!-- Correct / Success -->
    <svg v-else-if="type === 'correct'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="var(--btn-green-bg)" stroke="var(--btn-green-border)" stroke-width="2" />
      <path d="M7 12 L10 15 L17 8" stroke="#FFF8E7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    </svg>

    <!-- Wrong / Failure -->
    <svg v-else-if="type === 'wrong'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="var(--btn-red-bg)" stroke="var(--btn-red-border)" stroke-width="2" />
      <path d="M9 9 L15 15 M15 9 L9 15" stroke="#FFF8E7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    </svg>

    <!-- Trophy / Win — asset from public/icons/rewards/ via getGameplayIconUrl -->
    <GameplayIcon v-else-if="type === 'trophy'" type="trophy" :size="size" />

    <!-- Quiz score % — quiz hub card art from iconRegistry -->
    <GameplayIcon v-else-if="type === 'score'" type="quiz" :size="size" />

    <!-- Leaf / Nature Progress -->
    <svg v-else-if="type === 'leaf'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21C12 21 4 16 4 10C4 6.68629 6.68629 4 10 4C11.6569 4 12 5 12 5C12 5 12.3431 4 14 4C17.3137 4 20 6.68629 20 10C20 16 12 21 12 21Z" fill="var(--color-primary)" stroke="var(--color-primary-dark)" stroke-width="2" />
      <path d="M12 21V10" stroke="var(--color-bg-card)" stroke-width="2" stroke-linecap="round" />
    </svg>
  </div>
</template>

<style scoped>
.reward-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  pointer-events: none;
  user-select: none;
}
.reward-icon svg {
  width: 100%;
  height: 100%;
  display: block;
  /* Pixel rendering tweaks if desired, though standard shapes anti-alias well */
}
</style>
