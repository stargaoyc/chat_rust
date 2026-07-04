import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { isAuthenticated, getAccessToken } from '@/lib/auth'
import { useEffect } from 'react'
import { connectSSE, disconnectSSE } from '@/lib/sse'
import { handleSSEEvent, queryClient } from '@/app'
import { QueryClientProvider } from '@tanstack/react-query'
import { useAppStore } from '@/stores/app-store'
import { ChatList } from '@/components/chat/chat-list'
import { ConnectionIndicator } from '@/components/common/connection-indicator'
import { useSignout, useCurrentUser } from '@/hooks/use-auth'
import { MessageSquare, PanelLeftClose, PanelLeft, LogOut } from 'lucide-react'

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
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const signout = useSignout()
  const user = useCurrentUser()

  useEffect(() => {
    if (getAccessToken()) {
      void connectSSE(handleSSEEvent)
    }
    return () => disconnectSSE()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-background overflow-hidden">
        <aside
          className="border-r bg-sidebar flex flex-col shrink-0 transition-all duration-300 ease-out overflow-hidden"
          style={{ width: sidebarCollapsed ? 0 : 280, borderColor: 'var(--color-border)' }}
        >
          <div className="p-4 border-b flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ width: 32, height: 32, background: 'rgba(79, 70, 229, 0.10)' }}
              >
                <MessageSquare size={18} style={{ color: '#4f46e5' }} />
              </div>
              <h2 className="font-semibold text-sm tracking-tight">Chat</h2>
            </div>
            <div className="flex items-center gap-1">
              <ConnectionIndicator />
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                title="收起侧边栏"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
          </div>

          <ChatList />

          <div className="p-3 border-t shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-full text-xs font-medium"
                style={{ width: 32, height: 32, background: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5' }}
              >
                {user?.fullname?.charAt(0) ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ellipsis">{user?.fullname}</p>
                <p className="text-xs text-muted-foreground text-ellipsis">{user?.email}</p>
              </div>
              <button
                onClick={signout}
                className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="退出登录"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-background relative">
          {sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="absolute top-3 left-3 z-10 p-2 rounded-lg border bg-card shadow-sm text-muted-foreground hover:bg-muted transition-colors"
              title="展开侧边栏"
            >
              <PanelLeft size={16} />
            </button>
          )}
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  )
}
