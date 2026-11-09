<script setup lang="ts">
import type { ExplorerRescueResult } from '../game/types'
import RewardAchievementBoard from '@/components/results/RewardAchievementBoard.vue'

defineProps<{
  result: ExplorerRescueResult
  totalLeafPoints: number
  level: number
  levelTitle: string
  levelProgressPercent: number
  showLevelUp: boolean
}>()
</script>

<template>
  <RewardAchievementBoard
    :points-earned="result.pointsEarned"
    :total-leaf-points="totalLeafPoints"
    :level="level"
    :level-title="levelTitle"
    :level-progress-percent="levelProgressPercent"
    :show-level-up="showLevelUp"
    :restoration-before="result.restorationBefore"
    :restoration-after="result.restorationAfter"
    :is-first-completion="result.isFirstCompletion"
    restoration-replay-hint="Already restored for this rescue"
  />
</template>
