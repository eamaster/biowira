<script setup lang="ts">
/**
 * RescueChoiceTraitList — shows an animal's own 3 traits as pixel-art icon badges.
 *
 * Used on choice cards in the choosing overlay and anywhere the game needs to
 * display an animal's habitat + diet + group before the player answers.
 *
 * Important: this component must NEVER reveal the answer or show a match count.
 * It always shows the choice animal's own traits, not shared-trait counts.
 *
 * Reuses RescueTraitBadge for each trait so icon/emoji fallback logic is
 * centralized in one place.
 */
import type { RescueTrait } from '../game/types'
import RescueTraitBadge from './RescueTraitBadge.vue'

const props = withDefaults(
  defineProps<{
    /** Exactly 3 traits for the choice animal (habitat, diet, group). */
    traits: RescueTrait[]
    /** Animal name — used for the accessible aria-label. */
    animalName: string
    /**
     * Badge size variant. 'compact' keeps each badge small enough to fit
     * inside a choice card alongside the animal icon and name.
     */
    size?: 'sm' | 'compact' | 'choice'
  }>(),
  {
    size: 'compact',
  },
)
</script>

<template>
  <div
    class="rescue-choice-trait-list"
    :aria-label="`${animalName} traits: ${traits.map((t) => t.label).join(', ')}`"
    role="list"
  >
    <RescueTraitBadge
      v-for="trait in traits"
      :key="trait.id"
      :trait="trait"
      :size="size"
      role="listitem"
    />
  </div>
</template>

<style scoped lang="scss">
.rescue-choice-trait-list {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  gap: var(--space-1);
  justify-content: flex-start;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  padding-bottom: var(--space-1);
}
</style>
