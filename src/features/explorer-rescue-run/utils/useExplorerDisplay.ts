import { computed } from 'vue'
import { useSessionStore } from '@/stores/sessionStore'
import { findExplorerAnimalChoice } from '@/features/welcome/data/explorerAnimalCatalog'

/**
 * Single source of truth for displaying the active explorer's identity
 * across Chapter, Gameplay, Result, and Journal pages.
 *
 * Display model:
 *  - nickname:    profile display name, e.g. "Noble Sage"
 *  - animalName:  species common name,  e.g. "Bornean Orangutan" (not generic "Orangutan")
 *  - displayName: nickname if set, otherwise animalName
 *  - visualKey:   icon registry key for AnimalIcon / Phaser
 *
 * Resolution: tries animalId first, then animalVisualKey as fallback.
 * This handles profiles that were created with legacy visual keys like 'orangutan'
 * or 'hornbill' which are now aliases for canonical catalog entries.
 */
export function useExplorerDisplay() {
  const sessionStore = useSessionStore()

  const animalId = computed(() => sessionStore.activeProfile?.animalId ?? 'malayan-tiger')
  const visualKey = computed(() => sessionStore.activeProfile?.animalVisualKey ?? 'malayan-tiger')
  const nickname = computed(() => sessionStore.activeProfile?.displayNickname ?? '')

  // Try resolving by animalId first; fall back to visualKey for legacy profiles
  const catalogEntry = computed(
    () => findExplorerAnimalChoice(animalId.value) ?? findExplorerAnimalChoice(visualKey.value),
  )
  const animalName = computed(() => catalogEntry.value?.commonName ?? animalId.value)
  const fallbackEmoji = computed(() => catalogEntry.value?.fallbackEmoji ?? '🐾')

  // Primary display: prefer nickname; fall back to animal species
  const displayName = computed(() => nickname.value || animalName.value)

  return { animalId, visualKey, nickname, animalName, displayName, fallbackEmoji }
}
