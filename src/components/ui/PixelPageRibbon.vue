<script setup lang="ts">
/**
 * Full-width page title bar — matches Discover, Quiz, and Fun Facts:
 * brown (nav) ribbon + yellow pixel title + optional subtitle on the ribbon.
 */
defineProps<{
  title: string
  /** Shown under the title on the same ribbon (cream tone for contrast on dark). */
  subtitle?: string
}>()
</script>

<template>
  <header class="pixel-page-ribbon">
    <h1 class="pixel-page-ribbon__title">{{ title }}</h1>
    <p v-if="subtitle" class="pixel-page-ribbon__subtitle">{{ subtitle }}</p>
  </header>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.pixel-page-ribbon {
  background: var(--color-bg-nav);
  padding: var(--space-5) var(--space-6);
  border-bottom: 3px solid var(--color-border);
  text-align: center;
}

.pixel-page-ribbon__title {
  font-family: var(--font-readable);
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 900;
  color: var(--color-secondary);
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.35);
  margin: 0;
  line-height: 1.2;
}

.pixel-page-ribbon__subtitle {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 700;
  color: rgba(255, 248, 231, 0.9);
  margin: var(--space-2) 0 0;
  line-height: 1.45;
  max-width: 28rem;
  margin-left: auto;
  margin-right: auto;
}
</style>
