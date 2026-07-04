import type { Chat } from '@/types/models'
import { useAppStore } from '@/stores/app-store'
import { Menu, Search, MoreHorizontal, MessageSquare } from 'lucide-react'

interface ChatHeaderProps {
  chat: Chat | undefined
}

const CHAT_TYPE_LABELS: Record<string, string> = {
  single: '私信',
  group: '群组',
  public_channel: '公开频道',
  private_channel: '私密频道',
}

export function ChatHeader({ chat }: ChatHeaderProps) {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  if (!chat) {
    return (
      <div className="h-14 border-b glass flex items-center px-4 gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg animate-shimmer" />
        <div className="space-y-1.5">
          <div className="w-24 h-3 animate-shimmer rounded" />
          <div className="w-16 h-2 animate-shimmer rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-14 border-b glass flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 -ml-1 rounded-md text-muted-foreground hover:bg-muted transition-colors lg:hidden"
        >
          <Menu size={18} />
        </button>
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ width: 34, height: 34, background: 'rgba(79, 70, 229, 0.10)' }}
        >
          <MessageSquare size={18} style={{ color: '#4f46e5' }} />
        </div>
        <div>
          <h2 className="font-semibold text-sm leading-tight">{chat.name ?? CHAT_TYPE_LABELS[chat.type]}</h2>
          <p className="text-xs text-muted-foreground">
            {CHAT_TYPE_LABELS[chat.type]} · {chat.members.length} 成员
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" title="搜索消息">
          <Search size={18} />
        </button>
        <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" title="更多">
          <MoreHorizontal size={18} />
        </button>
      </div>
    </div>
  )
}
