<script setup lang="ts">
export interface TabItem {
  id: string
  label: string
  emoji?: string
  /** Pixel-art clue WebP; when set, renders `<img>` instead of emoji. */
  iconSrc?: string
}

const props = defineProps<{
  modelValue: string
  tabs: TabItem[]
  showLabels?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [id: string]
}>()
</script>

<template>
  <div class="pixel-tabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      role="tab"
      :aria-selected="modelValue === tab.id"
      :class="['pixel-tabs__tab', { 'pixel-tabs__tab--active': modelValue === tab.id }]"
      @click="emit('update:modelValue', tab.id)"
    >
      <img
        v-if="tab.iconSrc"
        :src="tab.iconSrc"
        alt=""
        aria-hidden="true"
        class="pixel-tabs__icon-img"
        draggable="false"
      >
      <span v-else-if="tab.emoji" class="pixel-tabs__emoji">{{ tab.emoji }}</span>
      <span v-if="showLabels !== false" class="pixel-tabs__label">{{ tab.label }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.pixel-tabs {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;

  @media (max-width: $bp-md) {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: var(--space-2);
    -webkit-overflow-scrolling: touch;
    
    // Hide scrollbar but allow scroll
    &::-webkit-scrollbar {
      display: none;
    }
    scrollbar-width: none;
  }

  &__tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-bg-card);
    cursor: pointer;
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 700;
    min-height: 44px;
    color: var(--color-text-light);
    transition: all var(--transition-fast);
    box-shadow: 2px 2px 0 var(--color-border);

    &:hover:not(&--active) {
      background: var(--color-border-light);
      transform: translateY(-1px);
    }

    &--active {
      background: var(--color-secondary);
      border-color: #b87a0f;
      color: var(--color-text);
      box-shadow: 2px 2px 0 #b87a0f;
      transform: translateY(-1px);
    }
  }

  &__emoji {
    font-size: 16px;
    line-height: 1;
  }

  &__icon-img {
    width: 20px;
    height: 20px;
    object-fit: contain;
    flex-shrink: 0;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }

  &__label {
    white-space: nowrap;
  }
}
</style>
