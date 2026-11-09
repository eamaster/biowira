<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NAV_ITEMS, type NavItem } from '@/app/config'
import AppIcon from '@/components/ui/AppIcon.vue'
import AudioSettingsControl from '@/components/audio/AudioSettingsControl.vue'

const route = useRoute()
const activeRoute = computed(() => route.path)

function isNavItemActive(item: NavItem): boolean {
  const path = item.path
  if (path === '/') return activeRoute.value === '/'
  if (activeRoute.value === path || activeRoute.value.startsWith(path + '/')) return true
  if (item.activePathPrefixes) {
    return item.activePathPrefixes.some(
      (p) => activeRoute.value === p || activeRoute.value.startsWith(p + '/'),
    )
  }
  return false
}
</script>

<template>
  <nav class="bottom-nav" aria-label="Main navigation">
    <RouterLink
      v-for="item in NAV_ITEMS"
      :key="item.path"
      :to="item.path"
      :class="['bottom-nav__item', { 'bottom-nav__item--active': isNavItemActive(item) }]"
    >
      <AppIcon
        class="bottom-nav__icon"
        :icon-key="item.iconKey"
        :fallback-text="item.fallbackIcon"
        size="24px"
      />
      <span class="bottom-nav__label">{{ item.label }}</span>
    </RouterLink>

    <!-- Audio settings: compact sound button on mobile -->
    <div class="bottom-nav__item bottom-nav__item--audio">
      <AudioSettingsControl />
    </div>
  </nav>
</template>

<style scoped lang="scss">
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-nav);
  background: var(--color-bg-nav);
  border-top: 3px solid var(--color-border);
  display: flex;
  align-items: stretch;
  height: var(--nav-height-bottom);
  padding-bottom: env(safe-area-inset-bottom, 0);
  box-shadow: 0 -3px 0 rgba(0,0,0,0.2);

  &__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    text-decoration: none;
    padding: var(--space-2);
    color: rgba(255,255,255,0.6);
    transition: all var(--transition-fast);
    border-top: 3px solid transparent;

    &--active {
      color: var(--color-secondary);
      border-top-color: var(--color-secondary);
      background: rgba(232, 160, 32, 0.1);
    }

    &:not(&--active):active {
      background: rgba(255,255,255,0.05);
    }

    &--audio {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      min-width: 52px;
    }
  }

  &__icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__label {
    font-family: var(--font-readable);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 64px;
  }
}
</style>
