<script setup lang="ts">
import { computed } from 'vue'
import type { ImageAttribution } from '@/domain/imageAttribution'

const props = withDefaults(
  defineProps<{
    attribution?: ImageAttribution | null
    compact?: boolean
    align?: 'left' | 'center' | 'right'
    prefix?: string
  }>(),
  { align: 'center', prefix: '' },
)

const hasContent = computed(() => {
  const a = props.attribution
  if (!a) return false
  return !!(
    a.creditLine ||
    a.author ||
    a.sourceName ||
    a.licenseName ||
    a.title
  )
})

const cssAlign = computed(() => props.align)

const textClass = computed(() => [
  'image-attribution-caption',
  props.compact ? 'image-attribution-caption--compact' : '',
].filter(Boolean).join(' '))
</script>

<template>
  <figure
    v-if="hasContent"
    class="image-attribution-caption-wrap"
    :class="`image-attribution-caption-wrap--${cssAlign}`"
  >
    <figcaption :class="textClass">
      <span v-if="prefix" class="image-attribution-caption__prefix">{{ prefix }}</span>

      <template v-if="attribution?.creditLine">
        {{ attribution.creditLine }}
      </template>

      <template v-else-if="attribution">
        <!-- Title (e.g. "Panthera tigris sumatran subspecies") -->
        <template v-if="attribution.title">
          "{{ attribution.title }}"
        </template>

        <!-- Author -->
        <template v-if="attribution.author">
          <template v-if="attribution.title"> by </template>
          <template v-else>Image by </template>
          <a
            v-if="attribution.authorUrl"
            class="image-attribution-caption__link"
            :href="attribution.authorUrl"
            target="_blank"
            rel="noopener noreferrer"
          >{{ attribution.author }}</a>
          <template v-else>{{ attribution.author }}</template>
        </template>

        <!-- Source (e.g. "Wikimedia Commons") -->
        <template v-if="attribution.sourceName">
          <template v-if="attribution.author || attribution.title">, </template>
          <template v-else>Image source: </template>
          <a
            v-if="attribution.sourceUrl"
            class="image-attribution-caption__link"
            :href="attribution.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
          >{{ attribution.sourceName }}</a>
          <template v-else>{{ attribution.sourceName }}</template>
        </template>

        <!-- License -->
        <template v-if="attribution.licenseName">
          <template v-if="attribution.author || attribution.title || attribution.sourceName">, </template>
          licensed under
          <a
            v-if="attribution.licenseUrl"
            class="image-attribution-caption__link"
            :href="attribution.licenseUrl"
            target="_blank"
            rel="noopener noreferrer"
          >{{ attribution.licenseName }}</a>
          <template v-else>{{ attribution.licenseName }}</template>
        </template>

        <!-- Trailing period -->
        <template v-if="attribution.author || attribution.title || attribution.sourceName || attribution.licenseName">.</template>
      </template>
    </figcaption>
  </figure>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.image-attribution-caption-wrap {
  margin: 0;
  width: 100%;

  &--left {
    text-align: left;
  }
  &--center {
    text-align: center;
  }
  &--right {
    text-align: right;
  }
}

.image-attribution-caption {
  margin: 0;
  display: block;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  font-family: var(--font-readable);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text-muted);
  line-height: 1.45;

  &--compact {
    font-size: 11px;
    padding: var(--space-1) var(--space-2);
    line-height: 1.35;
  }

  &__prefix {
    margin-right: 0.35em;
    font-weight: 800;
    color: var(--color-text-muted);
  }

  &__link {
    color: var(--color-primary);
    text-decoration: underline;
    text-underline-offset: 2px;

    &:focus-visible {
      outline: 2px solid var(--color-secondary);
      outline-offset: 2px;
      border-radius: 2px;
    }
  }
}
</style>
