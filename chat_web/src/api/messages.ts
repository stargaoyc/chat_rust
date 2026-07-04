import { apiClient } from './client'
import type { Message } from '@/types/models'
import type { CreateMessageInput } from '@/schemas/message'
import type { ListMessagesParams } from '@/types/api'

export const messagesApi = {
  list: (chatId: number, params: ListMessagesParams) =>
    apiClient
      .get(`chats/${chatId}/messages`, {
        searchParams: { limit: String(params.limit), ...(params.last_id != null ? { last_id: String(params.last_id) } : {}) },
      })
      .json<Message[]>(),

  send: (chatId: number, data: CreateMessageInput) =>
    apiClient.post(`chats/${chatId}`, { json: data }).json<Message>(),
}
