import { computed } from 'vue'
import { useProgressStore } from '@/stores/progressStore'
import { getLevelForPoints } from '@/domain/user'

export function useProgress() {
  const store = useProgressStore()

  const leafPoints = computed(() => store.leafPoints)
  const level = computed(() => store.level)
  const levelTitle = computed(() => store.levelTitle)
  const displayName = computed(() => store.displayName)
  const levelProgressPercent = computed(() => store.levelProgressPercent)
  const nextLevelDef = computed(() => {
    const pts = store.leafPoints
    const current = getLevelForPoints(pts)
    if (current.maxPoints === Infinity) return null
    return getLevelForPoints(current.maxPoints + 1)
  })
  const pointsToNextLevel = computed(() => {
    const pts = store.leafPoints
    const current = getLevelForPoints(pts)
    if (current.maxPoints === Infinity) return 0
    return current.maxPoints - pts + 1
  })

  return {
    leafPoints,
    level,
    levelTitle,
    displayName,
    levelProgressPercent,
    nextLevelDef,
    pointsToNextLevel,
    fetchProgress: store.fetchProgress,
    addPoints: store.addPoints,
  }
}
