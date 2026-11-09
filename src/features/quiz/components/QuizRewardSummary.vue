<script setup lang="ts">
import type { QuizCompletionSnapshot } from '@/stores/quizStore'
import RewardAchievementBoard from '@/components/results/RewardAchievementBoard.vue'

defineProps<{
  snapshot: QuizCompletionSnapshot
  totalLeafPoints: number
  showLevelUp: boolean
}>()
</script>

<template>
  <RewardAchievementBoard
    :include-journal-rewards="false"
    :points-earned="snapshot.pointsEarned"
    :total-leaf-points="totalLeafPoints"
    :level="snapshot.levelAfterQuiz"
    :level-title="snapshot.levelTitleAfterQuiz"
    :level-progress-percent="snapshot.levelProgressAfterQuiz"
    :show-level-up="showLevelUp"
  />
</template>
