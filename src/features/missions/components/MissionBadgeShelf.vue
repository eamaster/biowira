<script setup lang="ts">
import { computed } from 'vue'
import type { BackendBadge } from '@/domain/badgeApi.dto'
import type { NewBadgeDto } from '@/domain/missionApi.dto'

const props = defineProps<{
  /** All badges from GET /api/badges — may include earned AND locked badges */
  badges: BackendBadge[]
  /** Newly earned badges from the most recent mission completion (transient) */
  recentlyEarned?: NewBadgeDto[]
}>()

/**
 * Show only earned/unlocked badges in the "Your Badges" shelf.
 * The backend returns all badges (earned + locked); we only celebrate unlocked ones here.
 * Swagger contract uses `isUnlocked` (not `isEarned`).
 */
const earnedBadges = computed(() =>
  props.badges.filter((b) => b.isUnlocked),
)
</script>

<template>
  <div class="badge-shelf">
    <h3 class="badge-shelf__title">Your Badges</h3>

    <!-- Recently earned badges banner (shown after completing a mission) -->
    <div
      v-if="recentlyEarned && recentlyEarned.length > 0"
      class="badge-shelf__new-badges"
      role="status"
      aria-live="polite"
    >
      <span class="badge-shelf__new-label">🎉 New badge{{ recentlyEarned.length > 1 ? 's' : '' }}!</span>
      <div class="badge-shelf__new-list">
        <div v-for="nb in recentlyEarned" :key="nb.badgeName" class="badge-shelf__new-item">
          <img
            v-if="nb.badgeImageUrl"
            :src="nb.badgeImageUrl"
            :alt="nb.badgeName"
            class="badge-shelf__new-img"
          >
          <span class="badge-shelf__new-name">{{ nb.badgeName }}</span>
        </div>
      </div>
    </div>

    <!-- Badge grid: earned badges only -->
    <div v-if="earnedBadges.length > 0" class="badge-shelf__grid">
      <div
        v-for="badge in earnedBadges"
        :key="badge.badgeName"
        class="badge-shelf__item"
        :title="badge.description"
      >
        <div class="badge-shelf__icon" aria-hidden="true">
          <img
            v-if="badge.badgeImageUrl"
            :src="badge.badgeImageUrl"
            :alt="badge.badgeName"
            class="badge-shelf__icon-img"
          >
          <span v-else class="badge-shelf__icon-fallback">🏅</span>
        </div>
        <div class="badge-shelf__name">{{ badge.badgeName }}</div>
      </div>
    </div>

    <!-- Empty state: no earned badges yet -->
    <p v-else class="badge-shelf__empty">
      Keep completing missions to earn badges!
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.badge-shelf {
  background: white;
  border-radius: var(--radius-lg);
  border: var(--pixel-border) solid var(--color-border);
  padding: var(--space-4);
  box-shadow: 3px 3px 0 rgba(0,0,0,0.1);

  &__title {
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-weight: 800;
    color: var(--color-text);
    margin: 0 0 var(--space-3) 0;
  }

  &__empty {
    font-family: var(--font-body);
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text-light);
    margin: 0;
  }

  &__new-badges {
    background: #FFF8E7;
    border: 2px solid #E8A020;
    border-radius: var(--radius-sm);
    padding: var(--space-3);
    margin-bottom: var(--space-3);
  }

  &__new-label {
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-weight: 800;
    color: #8B5E00;
    display: block;
    margin-bottom: var(--space-2);
  }

  &__new-list {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  &__new-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__new-img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  &__new-name {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-weight: 800;
    color: var(--color-text);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
    gap: var(--space-3);
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-1);
  }

  &__icon {
    font-size: 32px;
    background: #FFF8E7;
    border: 2px solid #E8A020;
    border-radius: 50%;
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 0 #E8A020;
    overflow: hidden;
  }

  &__icon-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__icon-fallback {
    font-size: 28px;
    line-height: 1;
  }

  &__name {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-weight: 800;
    color: var(--color-text);
    line-height: 1.25;
  }
}
</style>
