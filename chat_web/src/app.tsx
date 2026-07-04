import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { chatKeys, appendChatToCache, removeChatFromCache } from '@/hooks/use-chats'
import { appendMessageToCache } from '@/hooks/use-messages'
import type { AppEvent } from '@/types/events'
import type { Chat, Message } from '@/types/models'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 2 },
  },
})

export function handleSSEEvent(event: AppEvent) {
  switch (event.event) {
    case 'NewChat':
      appendChatToCache(queryClient, event as unknown as Chat)
      break
    case 'AddToChat':
      void queryClient.invalidateQueries({ queryKey: chatKeys.list() })
      break
    case 'RemoveFromChat':
      removeChatFromCache(queryClient, event.id)
      break
    case 'NewMessage':
      appendMessageToCache(queryClient, event.chat_id, event as unknown as Message)
      break
  }
}

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: { queryClient },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
