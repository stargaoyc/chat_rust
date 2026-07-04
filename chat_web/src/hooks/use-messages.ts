import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi } from '@/api/messages'
import type { CreateMessageInput } from '@/schemas/message'
import type { Message } from '@/types/models'

const PAGE_SIZE = 50

export const messageKeys = {
  all: ['messages'] as const,
  list: (chatId: number) => [...messageKeys.all, 'list', chatId] as const,
}

export function useMessageList(chatId: number) {
  return useInfiniteQuery({
    queryKey: messageKeys.list(chatId),
    queryFn: ({ pageParam }) =>
      messagesApi.list(chatId, {
        limit: PAGE_SIZE,
        last_id: pageParam as number | undefined,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: Message[]) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      return lastPage[lastPage.length - 1].id
    },
    enabled: chatId > 0,
    staleTime: 10_000,
    select: (data) => ({
      ...data,
      allMessages: data.pages.flatMap((page) => [...page].reverse()),
    }),
  })
}

/** Optimistic update: send message */
export function useSendMessage(chatId: number) {
  const qc = useQueryClient()
  const queryKey = messageKeys.list(chatId)

  return useMutation({
    mutationFn: (data: CreateMessageInput) => messagesApi.send(chatId, data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey })
      const snapshot = qc.getQueryData(queryKey)

      const optimisticMessage: Message = {
        id: -Date.now(),
        chat_id: chatId,
        sender_id: 0,
        content: data.content,
        files: data.files,
        created_at: new Date().toISOString(),
      }

      qc.setQueryData(queryKey, (old: undefined | { pages: Message[][]; pageParams: unknown[] }) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page, i) =>
            i === 0 ? [optimisticMessage, ...page] : page,
          ),
        }
      })

      return { snapshot }
    },
    onSuccess: (realMessage) => {
      qc.setQueryData(queryKey, (old: undefined | { pages: Message[][]; pageParams: unknown[] }) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((m) =>
              m.id < 0 && m.chat_id === chatId ? realMessage : m,
            ),
          ),
        }
      })
    },
    onError: (_err, _data, context) => {
      if (context?.snapshot) {
        qc.setQueryData(queryKey, context.snapshot)
      }
    },
  })
}

/** Incremental: SSE NewMessage → insert into cache */
export function appendMessageToCache(
  qc: ReturnType<typeof useQueryClient>,
  chatId: number,
  message: Message,
) {
  const queryKey = messageKeys.list(chatId)
  qc.setQueryData(queryKey, (old: undefined | { pages: Message[][]; pageParams: unknown[] }) => {
    if (!old) return old
    // Skip if message already exists (e.g., optimistic update replaced)
    const exists = old.pages.some((page) => page.some((m) => m.id === message.id))
    if (exists) return old
    return {
      ...old,
      pages: old.pages.map((page, i) =>
        i === 0 ? [message, ...page] : page,
      ),
    }
  })
}
