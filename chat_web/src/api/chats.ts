import { apiClient } from './client'
import type { Chat } from '@/types/models'
import type { CreateChatInput, UpdateChatInput } from '@/schemas/chat'

export const chatsApi = {
  list: () => apiClient.get('chats').json<Chat[]>(),

  create: (data: CreateChatInput) =>
    apiClient.post('chats', { json: data }).json<Chat>(),

  get: (id: number) =>
    apiClient.get(`chats/${id}`).json<Chat>(),

  update: (id: number, data: UpdateChatInput) =>
    apiClient.patch(`chats/${id}`, { json: data }).json<Chat>(),

  delete: (id: number) =>
    apiClient.delete(`chats/${id}`),
}
