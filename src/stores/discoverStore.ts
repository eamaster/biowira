import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Animal, AnimalListItem } from '@/domain/animal'
import { AnimalCategory } from '@/domain/enums'
import { findAnimalListItemForFocusId } from '@/domain/discoverFocus'
import { repositories } from '@/repositories'
import { ApiError } from '@/services/apiClient'

export const ANIMALS_PER_PAGE = 6

export const useDiscoverStore = defineStore('discover', () => {
  const animals = ref<AnimalListItem[]>([])
  const selectedAnimal = ref<Animal | null>(null)
  const activeCategory = ref<AnimalCategory>(AnimalCategory.All)
  const activeView = ref<'list' | 'detail' | 'map'>('list')
  const loading = ref(false)
  const error = ref<string | null>(null)
  /** Child-friendly message when list→detail is blocked or a load fails softly */
  const detailNotice = ref<string | null>(null)
  const detailLoading = ref(false)
  const mapLoading = ref(false)

  // Pagination state
  const currentPage = ref(1)
  const totalCount = ref(0)
  const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / ANIMALS_PER_PAGE)))

  /** List is always server-shaped for the active category (no extra client filter). */
  const filteredAnimals = computed(() => animals.value)

  async function fetchAnimals() {
    loading.value = true
    error.value = null
    try {
      const offset = (currentPage.value - 1) * ANIMALS_PER_PAGE
      const result = await repositories.animals.getPage(
        activeCategory.value,
        offset,
        ANIMALS_PER_PAGE,
      )
      animals.value = result.items
      totalCount.value = result.totalCount
    } catch (e) {
      if (e instanceof ApiError && e.status === 400 && e.errorCode === 'INVALID_ANIMAL_CLASS') {
        error.value = 'That group filter is not available right now. Try “All”.'
        console.error('[discover] INVALID_ANIMAL_CLASS', e.details)
      } else {
        error.value = 'Could not load animals'
        console.error('[discover] getAll/getByCategory failed', e)
      }
    } finally {
      loading.value = false
    }
  }

  async function setCategory(category: AnimalCategory) {
    activeCategory.value = category
    currentPage.value = 1
    await fetchAnimals()
  }

  async function goToPage(page: number) {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    await fetchAnimals()
  }

  async function openAnimalProfile(item: AnimalListItem) {
    detailNotice.value = null
    if (!item.backendId) {
      detailNotice.value =
        'Full profiles need a stable animal id from the server. You can still browse the list — ask a grown-up to check the app setup.'
      if (import.meta.env.DEV) {
        console.warn('[discover] openAnimalProfile blocked: list item has no backendId', item)
      }
      return
    }
    detailLoading.value = true
    try {
      const animal = await repositories.animals.getById(item.backendId)
      if (!animal) {
        detailNotice.value = 'We could not find that animal. Try another one!'
        return
      }
      selectedAnimal.value = animal
      activeView.value = 'detail'
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        detailNotice.value = 'That animal is not here anymore. Try another one!'
      } else {
        detailNotice.value = 'Something went wrong loading this animal. Try again.'
        console.error('[discover] getById failed', e)
      }
    } finally {
      detailLoading.value = false
    }
  }

  function closeAnimalProfile() {
    selectedAnimal.value = null
    activeView.value = 'list'
  }

  async function openOccurrencesMap() {
    const id = selectedAnimal.value?.id
    if (!id) return
    mapLoading.value = true
    try {
      const occ = await repositories.animals.getOccurrencesByAnimalId(id)
      if (selectedAnimal.value) {
        selectedAnimal.value = { ...selectedAnimal.value, occurrences: occ }
      }
      activeView.value = 'map'
    } catch (e) {
      detailNotice.value = 'We could not load the map data. Try again later.'
      console.error('[discover] getOccurrencesByAnimalId failed', e)
    } finally {
      mapLoading.value = false
    }
  }

  function closeOccurrencesMap() {
    activeView.value = 'detail'
  }

  function clearDetailNotice() {
    detailNotice.value = null
  }

  /**
   * Open the animal profile for a saved id (backend id, listKey, or visual key) if it exists in the current list.
   */
  async function openAnimalFromFocusIdIfPresent(focusId: string): Promise<boolean> {
    const item = findAnimalListItemForFocusId(animals.value, focusId)
    if (!item) return false
    await openAnimalProfile(item)
    return true
  }

  return {
    animals,
    selectedAnimal,
    activeCategory,
    activeView,
    loading,
    error,
    detailNotice,
    detailLoading,
    mapLoading,
    currentPage,
    totalCount,
    totalPages,
    filteredAnimals,
    fetchAnimals,
    setCategory,
    goToPage,
    openAnimalProfile,
    closeAnimalProfile,
    openOccurrencesMap,
    closeOccurrencesMap,
    clearDetailNotice,
    openAnimalFromFocusIdIfPresent,
  }
})
