import { useState } from 'react'
import type { Chat } from '@/types/models'
import { useAppStore } from '@/stores/app-store'
import { useUpdateChat } from '@/hooks/use-chats'
import { cn } from '@/lib/cn'
import { Menu, Search, MoreHorizontal, MessageSquare, X, Check } from 'lucide-react'

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
  const [showSettings, setShowSettings] = useState(false)

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
    <>
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
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            title="设置"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {showSettings && chat && (
        <ChatSettingsDialog chat={chat} onClose={() => setShowSettings(false)} />
      )}
    </>
  )
}

function ChatSettingsDialog({ chat, onClose }: { chat: Chat; onClose: () => void }) {
  const updateChat = useUpdateChat()
  const [name, setName] = useState(chat.name ?? '')
  const [isPublic, setIsPublic] = useState(chat.type === 'public_channel')
  const isChannel = chat.type === 'public_channel' || chat.type === 'private_channel'

  const handleSubmit = () => {
    updateChat.mutate(
      {
        id: chat.id,
        data: {
          name: name.trim() || undefined,
          public: isChannel ? isPublic : undefined,
        },
      },
      { onSuccess: onClose },
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div className="card p-6 w-full max-w-[420px] mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">对话设置</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label mb-1.5">名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={CHAT_TYPE_LABELS[chat.type]}
              className="input"
            />
          </div>

          {isChannel && (
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <button
                type="button"
                onClick={() => setIsPublic((p) => !p)}
                className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                  isPublic ? 'bg-primary border-primary' : 'border-input bg-background',
                )}
              >
                {isPublic && <Check size={12} className="text-primary-foreground" />}
              </button>
              公开频道
            </label>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-ghost">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={updateChat.isPending}
            className="btn-primary"
          >
            {updateChat.isPending ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
