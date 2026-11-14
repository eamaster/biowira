<script setup lang="ts">
import { computed } from 'vue'
import type { ImageAttribution } from '@/domain/imageAttribution'
import { isSafeHttpUrl } from '@/domain/mediaUrl'

interface AttributionSegment {
  key: string
  prefix: string
  text: string
  href?: string
}

const props = withDefaults(
  defineProps<{
    attribution?: ImageAttribution | null
    compact?: boolean
    align?: 'left' | 'center' | 'right'
    prefix?: string
  }>(),
  { align: 'center', prefix: '' },
)

const segments = computed<AttributionSegment[]>(() => {
  const a = props.attribution
  if (!a || a.creditLine?.trim()) return []

  const list: AttributionSegment[] = []
  const title = a.title?.trim()
  const author = a.author?.trim()
  const sourceName = a.sourceName?.trim()
  const licenseName = a.licenseName?.trim()

  if (title) {
    list.push({ key: 'title', prefix: '', text: `"${title}"` })
  }
  if (author) {
    list.push({
      key: 'author',
      prefix: list.length ? ' by ' : 'Image by ',
      text: author,
      href: isSafeHttpUrl(a.authorUrl) ? a.authorUrl.trim() : undefined,
    })
  }
  if (sourceName) {
    list.push({
      key: 'source',
      prefix: list.length ? ', ' : 'Image source: ',
      text: sourceName,
      href: isSafeHttpUrl(a.sourceUrl) ? a.sourceUrl.trim() : undefined,
    })
  }
  if (licenseName) {
    list.push({
      key: 'license',
      prefix: list.length ? ', licensed under ' : 'licensed under ',
      text: licenseName,
      href: isSafeHttpUrl(a.licenseUrl) ? a.licenseUrl.trim() : undefined,
    })
  }
  return list
})

const hasContent = computed(() => {
  const credit = props.attribution?.creditLine?.trim()
  return Boolean(credit || segments.value.length > 0)
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
      <span v-if="prefix" class="image-attribution-caption__prefix">{{ prefix }}</span><!--
      --><template v-if="attribution?.creditLine?.trim()">{{ attribution.creditLine.trim() }}</template><!--
      --><template v-else-if="segments.length"><!--
        --><template v-for="seg in segments" :key="seg.key">{{ seg.prefix }}<a
          v-if="seg.href"
          class="image-attribution-caption__link"
          :href="seg.href"
          target="_blank"
          rel="noopener noreferrer"
        >{{ seg.text }}</a><template v-else>{{ seg.text }}</template></template><!--
        -->.</template>
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
  overflow-wrap: anywhere;

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
