import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  activeChatId: number | null
  setActiveChat: (id: number | null) => void

  sseStatus: 'connected' | 'disconnected' | 'reconnecting'
  setSseStatus: (status: AppState['sseStatus']) => void

  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeChatId: null,
      setActiveChat: (id) => set({ activeChatId: id }),

      sseStatus: 'disconnected',
      setSseStatus: (status) => set({ sseStatus: status }),

      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'chat-app-store',
      partialize: (state) => ({ activeChatId: state.activeChatId }),
    },
  ),
)
