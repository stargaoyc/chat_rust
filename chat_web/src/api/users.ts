import { apiClient } from './client'
import type { ChatUser } from '@/types/models'

export const usersApi = {
  list: () => apiClient.get('users').json<ChatUser[]>(),
}
