<script setup lang="ts">
import { computed } from 'vue'
import { PRESET_LOCATIONS } from '../data/locationCatalog'

const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [locationId: string]
}>()

const selectedId = computed({
  get: () => props.modelValue ?? '',
  set: (val) => {
    if (val) emit('update:modelValue', val)
  }
})
</script>

<template>
  <div class="location-picker">
    <label for="mission-location" class="location-picker__label">Location:</label>
    <div class="location-picker__select-wrapper">
      <select 
        id="mission-location" 
        v-model="selectedId" 
        class="location-picker__select"
      >
        <option disabled value="">Select a city</option>
        <option 
          v-for="loc in PRESET_LOCATIONS" 
          :key="loc.id" 
          :value="loc.id"
        >
          {{ loc.label }}
        </option>
      </select>
      <div class="location-picker__arrow" aria-hidden="true">▼</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.location-picker {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  
  &__label {
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-weight: 800;
    color: var(--color-text);
  }

  &__select-wrapper {
    position: relative;
    display: inline-block;
  }

  &__select {
    appearance: none;
    -webkit-appearance: none;
    font-family: var(--font-body);
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text);
    background: var(--color-bg-card);
    border: var(--pixel-border) solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-8) var(--space-2) var(--space-3);
    cursor: pointer;
    box-shadow: 2px 2px 0 rgba(0,0,0,0.15);
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }

  &__arrow {
    position: absolute;
    right: var(--space-3);
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    font-size: 10px;
    color: var(--color-text-light);
  }
}
</style>
