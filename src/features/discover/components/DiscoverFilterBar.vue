<script setup lang="ts">
import { computed } from 'vue'
import type { AnimalCategory } from '@/domain/enums'
import { CATEGORY_LABELS } from '@/app/config'
import { getCategorySpiritIcon } from '@/app/categorySpiritIcon'
import PixelTabs from '@/components/ui/PixelTabs.vue'

const props = defineProps<{
  activeCategory: AnimalCategory
  categories: AnimalCategory[]
}>()

const emit = defineEmits<{
  'update:activeCategory': [value: AnimalCategory]
}>()

const tabs = computed(() =>
  props.categories.map((cat) => {
    const spirit = getCategorySpiritIcon(cat as string)
    return {
      id: cat as string,
      label: CATEGORY_LABELS[cat] ?? cat,
      iconSrc: spirit.iconSrc,
      emoji: spirit.iconSrc ? undefined : spirit.emoji,
    }
  }),
)

</script>

<template>
  <div class="discover-filter-bar" role="toolbar" aria-label="Discover filters">
    <PixelTabs
      :model-value="activeCategory"
      :tabs="tabs"
      :show-labels="true"
      @update:model-value="emit('update:activeCategory', $event as AnimalCategory)"
    />
  </div>
</template>

<style scoped lang="scss">
.discover-filter-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;

}
</style>
