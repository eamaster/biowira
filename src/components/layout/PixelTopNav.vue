<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NAV_ITEMS, type NavItem } from '@/app/config'
import { BRANDING } from '@/app/branding'
import { useSessionStore } from '@/stores/sessionStore'
import { useProfileStore } from '@/stores/profileStore'
import ExplorerChip from '@/components/ui/ExplorerChip.vue'
import SwitchExplorerModal from '@/components/ui/SwitchExplorerModal.vue'
import PixelProgressChip from '@/components/ui/PixelProgressChip.vue'
import { useProgressStore } from '@/stores/progressStore'
import AppIcon from '@/components/ui/AppIcon.vue'
import { getExplorerAnimalById } from '@/features/welcome/data/explorerAnimalCatalog'
import AudioSettingsControl from '@/components/audio/AudioSettingsControl.vue'

const route = useRoute()
const sessionStore = useSessionStore()
const profileStore = useProfileStore()
const progressStore = useProgressStore()

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
const switcherOpen = ref(false)

function openSwitcher() {
  profileStore.loadProfiles()
  switcherOpen.value = true
}
</script>

<template>
  <header class="top-nav">
    <div class="top-nav__inner">
      <RouterLink to="/" class="top-nav__brand">
        <img :src="BRANDING.wordmark" :alt="BRANDING.appName" class="top-nav__wordmark">
      </RouterLink>

      <nav class="top-nav__links" aria-label="Main navigation">
        <RouterLink
          v-for="item in NAV_ITEMS"
          :key="item.path"
          :to="item.path"
          :class="['top-nav__link', { 'top-nav__link--active': isNavItemActive(item) }]"
        >
          <AppIcon
            class="top-nav__link-icon"
            :icon-key="item.iconKey"
            :fallback-text="item.fallbackIcon"
            size="36px"
          />
          <span class="top-nav__link-label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <!-- Profile chip: ExplorerChip when session active, fallback PixelProgressChip -->
      <div class="top-nav__profile">
        <ExplorerChip
          v-if="sessionStore.hasActiveSession && sessionStore.activeProfile"
          :animal-visual-key="sessionStore.activeProfile.animalVisualKey"
          :fallback-emoji="
            getExplorerAnimalById(sessionStore.activeProfile.animalId)?.fallbackEmoji ?? '🐾'
          "
          :nickname="sessionStore.activeProfile.displayNickname"
          :level="sessionStore.activeProfile.level"
          @open-switcher="openSwitcher"
        />
        <PixelProgressChip
          v-else
          :level="progressStore.level"
          :points="progressStore.leafPoints"
          compact
        />
      </div>

      <!-- Audio settings control (desktop only — hidden on mobile via CSS) -->
      <AudioSettingsControl class="top-nav__audio" />
    </div>

    <SwitchExplorerModal v-model="switcherOpen" />
  </header>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.top-nav {
  position: sticky;
  top: 0;
  z-index: var(--z-nav);
  background: var(--color-bg-nav);
  border-bottom: 3px solid var(--color-border);
  box-shadow: 0 3px 0 rgba(0,0,0,0.2);
  height: var(--nav-height-top);
  overflow: visible;

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: var(--max-content-width);
    margin: 0 auto;
    padding: 0 var(--space-6);
    height: 100%;
    gap: var(--space-4);
    overflow: visible;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    text-decoration: none;
    flex-shrink: 0;
    min-width: 0;
  }

  &__wordmark {
    display: block;
    width: auto;
    height: var(--nav-wordmark-height);
    max-width: min(var(--nav-wordmark-max-w), 46vw);
    object-fit: contain;
    object-position: center;
    /* Do not clip bottom: inset() bottom % was cutting real letter pixels in the wordmark */
    image-rendering: pixelated;
    image-rendering: crisp-edges;

    @media (min-width: $bp-md) {
      height: var(--nav-wordmark-height-md);
      max-width: min(var(--nav-wordmark-max-w-md), 30vw);
    }
  }

  &__links {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-radius: var(--radius-md);
    font-family: var(--font-readable);
    font-size: var(--text-md);
    font-weight: 700;
    color: rgba(255,255,255,0.7);
    text-decoration: none;
    transition: all var(--transition-fast);
    border: 2px solid transparent;
    white-space: nowrap;

    &:hover:not(&--active) {
      background: rgba(255,255,255,0.1);
      color: #fff;
    }

    &--active {
      background: var(--color-primary);
      color: #fff;
      border-color: var(--color-primary-light);
      box-shadow: 0 2px 0 var(--color-primary-dark);
    }
  }

  // Icon wrapper matches the AppIcon size prop (36px) so the icon fills the space.
  &__link-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__profile {
    flex-shrink: 0;
  }

  &__audio {
    flex-shrink: 0;
  }

  /**
   * Tablet-ish widths: wordmark + nowrap nav links must not exceed the layout box
   * (fixes document scrollWidth > clientWidth on Home e2e viewports ~768–900px).
   */
  @media (max-width: 920px) {
    &__inner {
      padding-inline: var(--space-3);
      gap: var(--space-2);
      max-width: 100%;
    }

    &__wordmark {
      max-width: min(200px, 26vw);
    }

    &__link {
      padding: 8px 10px;
      font-size: clamp(13px, 2.2vw, 15px);
      gap: 8px;
    }

    &__link-icon {
      width: 30px;
      height: 30px;
    }
  }
}
</style>
