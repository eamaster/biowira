<script setup lang="ts">
defineProps<{
  backgroundSrc: string
  mascotSrc: string
  /** Alt text for the foreground mascot illustration. */
  mascotAlt?: string
}>()
</script>

<template>
  <section
    class="rescue-stage-preview"
    aria-label="Explorer Rescue stage preview"
    data-testid="explorer-rescue-stage-preview"
  >
    <div class="rescue-stage-preview__frame pixel-card">
      <div class="rescue-stage-preview__scene">
        <img
          class="rescue-stage-preview__bg"
          :src="backgroundSrc"
          alt=""
          draggable="false"
        >
        <img
          class="rescue-stage-preview__mascot"
          :src="mascotSrc"
          :alt="mascotAlt ?? 'Rescue run preview'"
          draggable="false"
        >
        <div class="rescue-stage-preview__overlay" aria-hidden="true"></div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.rescue-stage-preview {
  width: 100%;
}

.rescue-stage-preview__frame {
  background: rgba(30, 20, 10, 0.7);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--pixel-shadow-lg);
  overflow: hidden;
  padding: 0;
}

.rescue-stage-preview__scene {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 4.5;
  overflow: hidden;

  @media (max-width: $bp-sm) {
    aspect-ratio: 16 / 6;
  }
}

.rescue-stage-preview__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.rescue-stage-preview__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 60%,
    rgba(0, 0, 0, 0.25) 100%
  );
  pointer-events: none;
}

.rescue-stage-preview__mascot {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: clamp(70px, 10vw, 110px);
  height: auto;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  z-index: 2;

  @media (max-width: $bp-sm) {
    width: clamp(56px, 14vw, 84px);
  }
}
</style>
