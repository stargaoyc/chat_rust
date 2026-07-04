import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatsApi } from '@/api/chats'
import type { CreateChatInput, UpdateChatInput } from '@/schemas/chat'
import type { Chat } from '@/types/models'

export const chatKeys = {
  all: ['chats'] as const,
  list: () => [...chatKeys.all, 'list'] as const,
  detail: (id: number) => [...chatKeys.all, 'detail', id] as const,
}

export function useChatList() {
  return useQuery({
    queryKey: chatKeys.list(),
    queryFn: chatsApi.list,
    staleTime: 30_000,
  })
}

export function useChat(id: number) {
  return useQuery({
    queryKey: chatKeys.detail(id),
    queryFn: () => chatsApi.get(id),
    enabled: id > 0,
  })
}

export function useCreateChat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateChatInput) => chatsApi.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.list() })
    },
  })
}

export function useUpdateChat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateChatInput }) =>
      chatsApi.update(id, data),
    onSuccess: (_result, { id }) => {
      void qc.invalidateQueries({ queryKey: chatKeys.list() })
      void qc.invalidateQueries({ queryKey: chatKeys.detail(id) })
    },
  })
}

export function useDeleteChat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => chatsApi.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.list() })
    },
  })
}

/** Incremental: SSE NewChat → insert into cache */
export function appendChatToCache(qc: ReturnType<typeof useQueryClient>, chat: Chat) {
  qc.setQueryData(chatKeys.list(), (old: Chat[] | undefined) =>
    old ? [chat, ...old] : [chat],
  )
  qc.setQueryData(chatKeys.detail(chat.id), chat)
}

/** Incremental: SSE RemoveFromChat → remove from cache */
export function removeChatFromCache(qc: ReturnType<typeof useQueryClient>, chatId: number) {
  qc.setQueryData(chatKeys.list(), (old: Chat[] | undefined) =>
    old?.filter((c) => c.id !== chatId),
  )
  qc.removeQueries({ queryKey: chatKeys.detail(chatId) })
}
