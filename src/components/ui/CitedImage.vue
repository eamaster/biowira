<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import ImageAttributionCaption from '@/components/ui/ImageAttributionCaption.vue'
import type { ImageAttribution } from '@/domain/imageAttribution'
import { warnMissingImageAttribution, hasUsableAttribution } from '@/domain/imageAttribution'

const props = withDefaults(
  defineProps<{
    src?: string | null
    alt: string
    attribution?: ImageAttribution | null
    fallback?: 'hide' | 'spirit' | 'slot'
    loading?: 'lazy' | 'eager'
    objectFit?: 'cover' | 'contain'
    showCaption?: boolean
    attributionAlign?: 'left' | 'center' | 'right'
    attributionCompact?: boolean
    attributionEntity?: string
  }>(),
  {
    fallback: 'hide',
    loading: 'lazy',
    objectFit: 'contain',
    showCaption: true,
    attributionAlign: 'center',
    attributionCompact: false,
    attributionEntity: 'image',
  },
)

const emit = defineEmits<{
  error: [evt: Event]
}>()

function onError(e: Event) {
  emit('error', e)
}

/** When captions are enforced, block http(s) images that lack attributable metadata. Local/paths still render — caller chooses showCaption=false for purely decorative blobs. */
const srcTrimmed = computed(() => props.src?.trim() ?? '')

const isRemoteHttpSrc = computed(() => /^https?:\/\//i.test(srcTrimmed.value))

const shouldRenderImg = computed(() => {
  const src = srcTrimmed.value
  if (!src) return false
  if (props.showCaption === false) return true
  if (!isRemoteHttpSrc.value) return true
  return hasUsableAttribution(props.attribution ?? undefined)
})

const showSlotFallback = computed(
  () => props.fallback === 'slot' && Boolean(srcTrimmed.value) && !shouldRenderImg.value,
)

watchEffect(() => {
  if (!import.meta.env.DEV || props.showCaption === false) return
  const src = srcTrimmed.value
  if (!src.startsWith('http')) return
  if (hasUsableAttribution(props.attribution ?? undefined)) return
  warnMissingImageAttribution(props.attributionEntity, src)
})
</script>

<template>
  <div class="cited-image">
    <div
      class="cited-image__media"
      :class="[`cited-image__media--fit-${objectFit}`]"
    >
      <slot v-if="(!srcTrimmed || showSlotFallback) && fallback === 'slot'" name="fallback"></slot>
      <img
        v-else-if="shouldRenderImg"
        class="cited-image__img"
        :src="srcTrimmed"
        :alt="alt"
        :loading="loading"
        draggable="false"
        @error="onError($event)"
      >
    </div>
    <ImageAttributionCaption
      v-if="showCaption !== false && shouldRenderImg && attribution"
      :attribution="attribution"
      :compact="attributionCompact"
      :align="attributionAlign"
    />
    <slot name="below-caption"></slot>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.cited-image {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-2);
}

.cited-image__media {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border-light);

  &--fit-cover .cited-image__img {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }

  &--fit-contain .cited-image__img {
    object-fit: contain;
    width: 100%;
    height: auto;
    max-height: min(360px, 55vh);
  }
}

.cited-image__img {
  display: block;
}
</style>
