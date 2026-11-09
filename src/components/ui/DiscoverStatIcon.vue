<script setup lang="ts">
/**
 * DiscoverStatIcon — renders a pixel-art stat icon for Discover profile sheets.
 *
 * Accepts a pre-resolved `src` (from discoverStatIconRegistry) and a
 * `fallbackText` string. When `src` is present and loads successfully the
 * pixel-art WebP is shown; otherwise `fallbackText` is shown as plain text.
 *
 * Usage:
 *   <DiscoverStatIcon
 *     :src="iconResult.src"
 *     :fallback-text="iconResult.fallbackText"
 *     :label="iconResult.label"
 *     size="32px"
 *   />
 */
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Resolved WebP URL from discoverStatIconRegistry. Undefined = no image. */
    src?: string
    /** Always-present text fallback (emoji or short text). */
    fallbackText: string
    /** Accessible label for the icon (e.g. "Group: Mammals"). */
    label?: string
    /** CSS size for width and height. Default: '28px' */
    size?: string
  }>(),
  {
    src: undefined,
    label: undefined,
    size: '28px',
  },
)

const imgFailed = ref(false)

function onImgError() {
  imgFailed.value = true
}
</script>

<template>
  <span
    class="discover-stat-icon"
    :aria-label="label ?? fallbackText"
    :style="{ width: size, height: size }"
  >
    <img
      v-if="src && !imgFailed"
      :src="src"
      alt=""
      aria-hidden="true"
      class="discover-stat-icon__img"
      draggable="false"
      @error="onImgError"
    >
    <span v-else class="discover-stat-icon__fallback" aria-hidden="true">
      {{ fallbackText }}
    </span>
  </span>
</template>

<style scoped>
.discover-stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
  pointer-events: none;
}

.discover-stat-icon__img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.discover-stat-icon__fallback {
  font-size: calc(v-bind(size) * 0.85);
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
