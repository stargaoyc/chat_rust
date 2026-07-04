import { useChatList, useCreateChat } from '@/hooks/use-chats'
import { useAppStore } from '@/stores/app-store'
import { useNavigate } from '@tanstack/react-router'
import { useUsers } from '@/hooks/use-users'
import type { ChatType } from '@/types/models'
import { cn } from '@/lib/cn'
import { useState } from 'react'

const CHAT_TYPE_LABELS: Record<ChatType, string> = {
  single: '私信',
  group: '群组',
  public_channel: '公开频道',
  private_channel: '私密频道',
}

export function ChatList() {
  const { data: chats, isLoading } = useChatList()
  const activeChatId = useAppStore((s) => s.activeChatId)
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 bg-muted animate-pulse rounded" />
        ))}
      </div>
    )
  }

  const channels = chats?.filter((c) => c.type === 'public_channel' || c.type === 'private_channel') ?? []
  const directs = chats?.filter((c) => c.type === 'single') ?? []
  const groups = chats?.filter((c) => c.type === 'group') ?? []

  const handleSelect = (chatId: number) => {
    useAppStore.getState().setActiveChat(chatId)
    void navigate({ to: '/chat/$chatId', params: { chatId: String(chatId) } as any })
  }

  return (
    <div className="flex-1 overflow-auto p-2">
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase">对话</span>
        <button
          onClick={() => setShowCreate(true)}
          className="text-xs text-primary hover:underline"
        >
          + 新建
        </button>
      </div>

      {channels.length > 0 && (
        <ChatSection title="频道" items={channels} activeId={activeChatId} onSelect={handleSelect} />
      )}
      {groups.length > 0 && (
        <ChatSection title="群组" items={groups} activeId={activeChatId} onSelect={handleSelect} />
      )}
      {directs.length > 0 && (
        <ChatSection title="私信" items={directs} activeId={activeChatId} onSelect={handleSelect} isDirect />
      )}

      {chats?.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">暂无对话</p>
      )}

      {showCreate && (
        <CreateChatDialog onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}

function ChatSection({
  title,
  items,
  activeId,
  onSelect,
  isDirect = false,
}: {
  title: string
  items: import('@/types/models').Chat[]
  activeId: number | null
  onSelect: (id: number) => void
  isDirect?: boolean
}) {
  return (
    <div className="mb-2">
      <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{title}</p>
      {items.map((chat) => (
        <button
          key={chat.id}
          onClick={() => onSelect(chat.id)}
          className={cn(
            'w-full text-left px-3 py-1.5 rounded-md text-sm truncate',
            activeId === chat.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
          )}
        >
          {isDirect ? `用户 #${chat.members[0]}` : chat.name ?? CHAT_TYPE_LABELS[chat.type]}
        </button>
      ))}
    </div>
  )
}

function CreateChatDialog({ onClose }: { onClose: () => void }) {
  const createChat = useCreateChat()
  const { data: users } = useUsers()
  const [name, setName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [isPublic, setIsPublic] = useState(false)

  const predictedType: ChatType = !name.trim()
    ? (selectedMembers.length <= 1 ? 'single' : 'group')
    : (isPublic ? 'public_channel' : 'private_channel')

  const handleSubmit = () => {
    if (selectedMembers.length < 1) return
    createChat.mutate(
      { name: name.trim() || undefined, members: selectedMembers, public: isPublic },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-background rounded-lg p-6 w-96 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">
          新建对话
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({CHAT_TYPE_LABELS[predictedType]})
          </span>
        </h3>
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名称（留空 = 私聊/群组）"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          {name.trim() && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              公开频道
            </label>
          )}
          <div className="space-y-1">
            <p className="text-sm font-medium">成员</p>
            <div className="max-h-40 overflow-auto border rounded-md p-2 space-y-1">
              {users?.map((user) => (
                <label key={user.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(user.id)}
                    onChange={(e) =>
                      setSelectedMembers((m) =>
                        e.target.checked ? [...m, user.id] : m.filter((id) => id !== user.id),
                      )
                    }
                  />
                  {user.fullname} ({user.email})
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border">取消</button>
          <button
            onClick={handleSubmit}
            disabled={selectedMembers.length < 1 || createChat.isPending}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-50"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  )
}
