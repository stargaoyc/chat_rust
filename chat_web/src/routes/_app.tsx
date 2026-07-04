import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { isAuthenticated, getAccessToken } from '@/lib/auth'
import { useEffect } from 'react'
import { connectSSE, disconnectSSE } from '@/lib/sse'
import { handleSSEEvent, queryClient } from '@/app'
import { QueryClientProvider } from '@tanstack/react-query'
import { useAppStore } from '@/stores/app-store'
import { ChatList } from '@/components/chat/chat-list'
import { ConnectionIndicator } from '@/components/common/connection-indicator'

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: AppLayout,
})

function AppLayout() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)

  useEffect(() => {
    if (getAccessToken()) {
      void connectSSE(handleSSEEvent)
    }
    return () => disconnectSSE()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-background">
        <aside
          className={`${sidebarCollapsed ? 'w-0' : 'w-64'} border-r bg-muted/40 transition-all overflow-hidden flex flex-col`}
        >
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Chat</h2>
            <ConnectionIndicator />
          </div>
          <ChatList />
        </aside>
        <main className="flex-1 flex flex-col min-w-0">
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  )
}
