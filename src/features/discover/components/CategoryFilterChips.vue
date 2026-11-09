<script setup lang="ts">
import { computed } from 'vue'
import PixelTabs from '@/components/ui/PixelTabs.vue'
import { AnimalCategory } from '@/domain/enums'
import { CATEGORY_LABELS } from '@/app/config'
import { getCategorySpiritIcon } from '@/app/categorySpiritIcon'

const props = defineProps<{
  modelValue: AnimalCategory
  showLabels?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AnimalCategory]
}>()

const tabs = computed(() =>
  Object.values(AnimalCategory).map((cat) => {
    const spirit = getCategorySpiritIcon(cat)
    return {
      id: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      iconSrc: spirit.iconSrc,
      emoji: spirit.iconSrc ? undefined : spirit.emoji,
    }
  }),
)
</script>

<template>
  <PixelTabs
    :model-value="modelValue"
    :tabs="tabs"
    :show-labels="showLabels"
    @update:model-value="emit('update:modelValue', $event as AnimalCategory)"
  />
</template>
