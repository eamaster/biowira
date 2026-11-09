<script setup lang="ts">
import AnimalChatGuide from '@/components/animal-chat/AnimalChatGuide.vue'

const props = defineProps<{
  profileId?: string
  animalId?: string
  displayName: string
  animalVisualKey?: string
  explorerFallbackEmoji?: string
}>()

const emit = defineEmits<{ 'switch-explorer': [] }>()
</script>

<template>
  <section class="hero" aria-label="Welcome banner">
    <AnimalChatGuide
      :profile-id="props.profileId"
      :animal-id="props.animalId"
      :animal-visual-key="props.animalVisualKey"
      :display-name="props.displayName"
      :fallback-emoji="props.explorerFallbackEmoji"
      mode="home"
      placement="home"
      @switch-explorer="emit('switch-explorer')"
    />
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

/** Below `$bp-md − 1`: show duplicate explorer chip inside panel (PixelTopNav hides chip). Through `$bp-md`: stack panel + mascot so tablet matches phone. */
$hero-chip-visible-max: $bp-md - 1px;
$hero-stack-max: $bp-md;

.hero {
  width: 100%;
  padding: var(--space-6) var(--space-6) var(--space-4);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
  z-index: 50;

  @media (min-width: #{$bp-md + 1px}) {
    /** Offset keeps mascot + greeting clear of the background sun hotspot. */
    padding-block-start: clamp(112px, 17vh, 220px);
    /** Tighter strip before cards (hero visually closer to feature row). */
    padding-block-end: clamp(20px, 3.8vh, 48px);
  }

  @media (max-width: #{$hero-stack-max}) {
    align-items: center;
  }

  @media (max-width: $bp-md) {
    padding: var(--space-6) var(--space-4) var(--space-3);
  }

  @media (max-width: $bp-sm) {
    padding: var(--space-4) var(--space-4) var(--space-3);
  }
}
</style>
