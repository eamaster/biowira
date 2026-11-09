<script setup lang="ts">
import { computed } from 'vue'
import { BRANDING } from '@/app/branding'
import { useAppBootstrapStore } from '@/stores/appBootstrapStore'

const bootstrapStore = useAppBootstrapStore()
const progress = computed(() => bootstrapStore.percentage)
const message = computed(() => bootstrapStore.message)

// Announce message changes to screen readers
const ariaLabel = computed(
  () => `BioWira is loading. ${progress.value}% complete. ${message.value}`,
)
</script>

<template>
  <div
    class="bw-loader"
    role="status"
    aria-live="polite"
    :aria-label="ariaLabel"
    data-testid="initial-app-loader"
  >
    <div class="bw-loader__panel">
      <!-- BioWira wordmark -->
      <img
        :src="BRANDING.wordmark"
        alt="BioWira"
        class="bw-loader__wordmark"
        width="200"
        height="56"
        draggable="false"
      />

      <!-- Progress bar -->
      <div
        class="bw-loader__track"
        role="progressbar"
        :aria-valuenow="progress"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Loading progress"
      >
        <div class="bw-loader__fill" :style="{ width: `${progress}%` }" />
      </div>

      <!-- Friendly message -->
      <p class="bw-loader__msg" aria-hidden="true">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ── Full-screen overlay ──────────────────────────────────────────── */
.bw-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  /* Responsive scenic background — same breakpoints as the home page */
  background-color: var(--color-bg);
  background-image: url('/backgrounds/home-background-mobile.webp');
  background-size: cover;
  background-position: center bottom;
  background-repeat: no-repeat;

  @media (min-width: 768px) {
    background-image: url('/backgrounds/home-background-tablet.webp');
  }

  @media (min-width: 1024px) {
    background-image: url('/backgrounds/home-background-desktop.webp');
  }

  /* Reduced motion: solid background only, no scenic image */
  @media (prefers-reduced-motion: reduce) {
    background-image: none;
  }
}

/* ── Inner panel ─────────────────────────────────────────────────── */
.bw-loader__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 32px 40px;
  background: rgba(245, 230, 200, 0.92);
  border-radius: 20px;
  border: 3px solid var(--color-border);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(6px);
  max-width: min(90vw, 360px);
  width: 100%;
}

/* ── Wordmark ─────────────────────────────────────────────────────── */
.bw-loader__wordmark {
  height: 56px;
  width: auto;
  object-fit: contain;
  image-rendering: pixelated;
  user-select: none;
}

/* ── Progress bar ─────────────────────────────────────────────────── */
.bw-loader__track {
  width: 100%;
  height: 14px;
  background: var(--color-border-light, #e8d4a8);
  border-radius: 999px;
  overflow: hidden;
  border: 2px solid var(--color-border);
}

.bw-loader__fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-primary-dark, #3a5c24),
    var(--color-primary, #5b8a3c),
    var(--color-primary-light, #7bb85a)
  );
  border-radius: 999px;
  transition: width 0.35s ease-out;
  min-width: 6px; /* Always show a tiny sliver so users see it's alive */

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

/* ── Message ──────────────────────────────────────────────────────── */
.bw-loader__msg {
  font-family: 'Nunito', 'Segoe UI', sans-serif;
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  font-weight: 600;
  color: var(--color-text, #3d2b1f);
  text-align: center;
  margin: 0;
  min-height: 1.5em;
  line-height: 1.5;
}
</style>
