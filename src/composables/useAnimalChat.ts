import type { Ref } from 'vue'
import { ref, watch, onUnmounted, toValue } from 'vue'
import { animalChatService } from '@/services/animalChatService'
import { storageService } from '@/services/storageService'
import { STORAGE_KEYS } from '@/app/config'
import { resolveExplorerChatAnimalType } from '@/features/welcome/data/explorerAnimalCatalog'
import type { AnimalChatMessage, AnimalChatStatus } from '@/domain/animalChat'

export type MaybeRefOrGetter<T> = T | Ref<T> | (() => T)

export function useAnimalChat(
  profileId: MaybeRefOrGetter<string | undefined>,
  animalId: MaybeRefOrGetter<string | undefined>,
  animalVisualKey: MaybeRefOrGetter<string | undefined>,
) {
  const isExpanded = ref(false)
  const status = ref<AnimalChatStatus>('idle')
  const messages = ref<AnimalChatMessage[]>([])
  
  const currentSessionId = ref<string | undefined>()
  
  let abortController: AbortController | undefined

  function generateId() {
    return Math.random().toString(36).slice(2, 9)
  }

  function toggleChat() {
    isExpanded.value = !isExpanded.value
  }

  function closeChat() {
    isExpanded.value = false
  }

  const resolvedAnimalType = ref('tiger')

  // Load session from storage if it exists for the current profile and animal type
  function updateSessionContext() {
    const currentProfileId = toValue(profileId)
    const currentAnimalId = toValue(animalId)
    const currentVisualKey = toValue(animalVisualKey)

    const newAnimalType = resolveExplorerChatAnimalType({ animalId: currentAnimalId, animalVisualKey: currentVisualKey })
    resolvedAnimalType.value = newAnimalType
    
    messages.value = []
    status.value = 'idle'
    
    if (abortController) {
      abortController.abort()
      abortController = undefined
    }

    if (currentProfileId && newAnimalType) {
      const storedSession = storageService.get<string>(
        STORAGE_KEYS.animalChatSession(currentProfileId, newAnimalType)
      )
      currentSessionId.value = storedSession ?? undefined
    } else {
      currentSessionId.value = undefined
    }
  }

  watch(
    () => [toValue(profileId), toValue(animalId), toValue(animalVisualKey)],
    () => {
      updateSessionContext()
    },
    { immediate: true }
  )

  onUnmounted(() => {
    if (abortController) {
      abortController.abort()
    }
  })

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    if (status.value === 'sending') return

    // Limit length to around 160 characters
    const messageText = trimmed.slice(0, 160)

    messages.value.push({
      id: generateId(),
      role: 'user',
      text: messageText,
      timestamp: Date.now(),
    })

    status.value = 'sending'

    if (abortController) {
      abortController.abort()
    }
    abortController = new AbortController()

    try {
      const response = await animalChatService.ask(
        {
          userMessage: `${messageText} (Keep your answer playful, use emojis, but very short! 2 to 3 sentences max.)`,
          animalType: resolvedAnimalType.value,
        },
        currentSessionId.value,
        abortController.signal
      )

      if (response.reply) {
        messages.value.push({
          id: generateId(),
          role: 'animal',
          text: response.reply,
          timestamp: Date.now(),
        })
      }

      if (response.sessionId) {
        const currentProfileId = toValue(profileId)
        if (currentProfileId) {
          currentSessionId.value = response.sessionId
          storageService.set(
            STORAGE_KEYS.animalChatSession(currentProfileId, resolvedAnimalType.value),
            response.sessionId
          )
        }
      }

      status.value = 'idle'
    } catch (err: any) {
      if (err.name === 'AbortError') return
      
      console.warn('[AnimalChat] request failed', err)
      status.value = 'error'
      
      messages.value.push({
        id: generateId(),
        role: 'system',
        text: 'Oops, the jungle radio is quiet. Try again!',
        timestamp: Date.now(),
      })
    } finally {
      abortController = undefined
    }
  }

  return {
    isExpanded,
    status,
    messages,
    resolvedAnimalType,
    toggleChat,
    closeChat,
    sendMessage,
  }
}
