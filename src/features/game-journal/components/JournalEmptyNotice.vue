<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/app/config'
import PixelButton from '@/components/ui/PixelButton.vue'

defineProps<{
  categoryTitle: string
}>()

const router = useRouter()

function goToGames() {
  router.push({ name: ROUTE_NAMES.games })
}
</script>

<template>
  <div
    class="journal-empty-notice"
    role="status"
    aria-live="polite"
    data-testid="journal-empty-notice"
  >
    <div class="journal-empty-notice__icon" aria-hidden="true">📖</div>
    <h3 class="journal-empty-notice__heading">No stamps yet for {{ categoryTitle }}!</h3>
    <p class="journal-empty-notice__message" data-testid="journal-empty-message">
      Please complete a game to unlock the stamps!
    </p>
    <PixelButton
      variant="green"
      size="md"
      aria-label="Play games to earn stamps"
      data-testid="journal-play-games-btn"
      @click="goToGames"
    >
      Play Games
    </PixelButton>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.journal-empty-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
  padding: var(--space-6);
  background: rgba(255, 248, 200, 0.92);
  border: 3px solid rgba(200, 160, 0, 0.45);
  border-radius: var(--radius-xl);
  box-shadow: 5px 5px 0 rgba(61, 43, 31, 0.12);
  max-width: 420px;
  margin: 0 auto;

  &__icon {
    font-size: 52px;
    line-height: 1;
  }

  &__heading {
    font-family: var(--font-readable);
    font-size: clamp(16px, 2.5vw, 22px);
    font-weight: 900;
    color: var(--color-secondary);
    margin: 0;
  }

  &__message {
    font-family: var(--font-body);
    font-size: clamp(14px, 1.8vw, 17px);
    font-weight: 700;
    color: var(--color-text-light);
    line-height: 1.5;
    margin: 0;
  }
}
</style>
