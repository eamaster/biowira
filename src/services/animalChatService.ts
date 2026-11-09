import { apiClient } from '@/services/apiClient'
import type { AnimalChatAskRequest, AnimalChatAskResponse } from '@/domain/animalChat'

export const animalChatService = {
  /**
   * Send a message to the AI animal.
   */
  async ask(
    request: AnimalChatAskRequest,
    sessionId?: string,
    signal?: AbortSignal,
  ): Promise<AnimalChatAskResponse> {
    const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''
    const url = `/Chat/ask${query}`
    
    // Explicitly use baseUrl: '/api' so it goes to /api/Chat/ask instead of /api/v1/Chat/ask
    return apiClient.post<AnimalChatAskResponse>(url, request, {
      signal,
      baseUrl: '/api',
    })
  },
}
