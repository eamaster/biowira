export interface AnimalChatAskRequest {
  userMessage: string
  animalType: string
}

export interface AnimalChatAskResponse {
  sessionId: string
  animalType: string
  reply: string
}

export type AnimalChatRole = 'user' | 'animal' | 'system'

export interface AnimalChatMessage {
  id: string
  role: AnimalChatRole
  text: string
  timestamp: number
}

export type AnimalChatStatus = 'idle' | 'sending' | 'error'
