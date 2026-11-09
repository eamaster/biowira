<script setup lang="ts">
import { computed } from 'vue'
import { EXPLORER_RESCUE_ASSETS } from '@/app/branding'
import { resolveExplorerRescueSprite } from '../utils/explorerRescueSprites'
import ExplorerRescueStepCard from './ExplorerRescueStepCard.vue'

const props = defineProps<{
  currentStep: 'meet' | 'run' | 'match' | 'journal'
  completed: string[]
  /** Chapter preview icon for the first step (defaults to mascot). */
  previewVisualKey?: string
}>()

const assets = EXPLORER_RESCUE_ASSETS.landing

const meetExplorerIconSrc = computed(() =>
  resolveExplorerRescueSprite(props.previewVisualKey ?? ''),
)

const STEPS = computed(() => [
  {
    key: 'meet',
    label: 'Choose Rescue Run',
    iconSrc: meetExplorerIconSrc.value,
    testId: 'explorer-rescue-step-meet-explorer',
  },
  {
    key: 'run',
    label: 'Rescue Run',
    iconSrc: assets.pawIcon,
    testId: 'explorer-rescue-step-rescue-run',
  },
  {
    key: 'match',
    label: 'Wild Match',
    iconSrc: assets.pawTrailIcon,
    testId: 'explorer-rescue-step-wild-match',
  },
  {
    key: 'journal',
    label: 'Journal Stamp',
    iconSrc: assets.passportIcon,
    testId: 'explorer-rescue-step-journal-stamp',
  },
])

function getStatus(
  key: string,
): 'complete' | 'current' | 'upcoming' {
  if (props.completed.includes(key)) return 'complete'
  if (key === props.currentStep) return 'current'
  const order = ['meet', 'run', 'match', 'journal']
  const curIdx = order.indexOf(props.currentStep)
  const keyIdx = order.indexOf(key)
  return keyIdx < curIdx ? 'complete' : 'upcoming'
}
</script>

<template>
  <div class="rescue-progress" role="list" aria-label="Chapter steps">
    <ExplorerRescueStepCard
      v-for="step in STEPS"
      :key="step.key"
      :data-testid="step.testId"
      :title="step.label"
      :icon-src="step.iconSrc"
      :status="getStatus(step.key)"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.rescue-progress {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
  width: 100%;
  min-width: 0;

  @media (max-width: $bp-md) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 340px) {
    grid-template-columns: 1fr;
  }
}
</style>
