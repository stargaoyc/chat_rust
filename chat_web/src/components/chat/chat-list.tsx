import { useChatList, useCreateChat } from '@/hooks/use-chats'
import { useAppStore } from '@/stores/app-store'
import { useNavigate } from '@tanstack/react-router'
import { useUsers } from '@/hooks/use-users'
import type { ChatType } from '@/types/models'
import { cn } from '@/lib/cn'
import { useState } from 'react'
import { Search, Plus, User, Users, Hash, Lock, Check } from 'lucide-react'

const CHAT_TYPE_LABELS: Record<ChatType, string> = {
  single: '私信',
  group: '群组',
  public_channel: '公开频道',
  private_channel: '私密频道',
}

const CHAT_TYPE_ICONS: Record<ChatType, typeof User> = {
  single: User,
  group: Users,
  public_channel: Hash,
  private_channel: Lock,
}

export function ChatList() {
  const { data: chats, isLoading } = useChatList()
  const activeChatId = useAppStore((s) => s.activeChatId)
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)

  if (isLoading) {
    return (
      <div className="p-3 space-y-2 flex-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-11 animate-shimmer rounded-lg" />
        ))}
      </div>
    )
  }

  const channels = chats?.filter((c) => c.type === 'public_channel' || c.type === 'private_channel') ?? []
  const directs = chats?.filter((c) => c.type === 'single') ?? []
  const groups = chats?.filter((c) => c.type === 'group') ?? []

  const handleSelect = (chatId: number) => {
    useAppStore.getState().setActiveChat(chatId)
    void navigate({ to: '/chat/$chatId', params: { chatId: String(chatId) } })
  }

  return (
    <div className="flex-1 overflow-auto px-2 py-2">
      <div className="flex items-center gap-2 px-1 mb-3">
        <div className="flex-1 h-9 rounded-lg border flex items-center px-2.5 gap-2 text-muted-foreground text-xs bg-background">
          <Search size={14} />
          <span>搜索</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="h-9 w-9 rounded-lg border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-150 bg-background"
        >
          <Plus size={16} />
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
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div
            className="flex items-center justify-center mb-3 rounded-full"
            style={{ width: 48, height: 48, background: 'var(--color-muted)' }}
          >
            <MessagesSquarePlaceholder size={24} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">暂无对话</p>
          <p className="text-xs text-muted-foreground mt-1">点击 + 开始新对话</p>
        </div>
      )}

      {showCreate && <CreateChatDialog onClose={() => setShowCreate(false)} />}
    </div>
  )
}

function MessagesSquarePlaceholder(props: { size?: number; className?: string }) {
  return (
    <svg
      width={props.size ?? 24}
      height={props.size ?? 24}
      className={props.className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9c-1.657 0-3.21-.42-4.57-1.16L3 21l1.16-4.57C3.42 15.21 3 13.66 3 12z" />
    </svg>
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
      <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      {items.map((chat) => {
        const isActive = activeId === chat.id
        const Icon = CHAT_TYPE_ICONS[chat.type]
        return (
          <button
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            className={cn(
              'w-full text-left flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all duration-150 group',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-sidebar-foreground hover:bg-muted',
            )}
          >
            {isDirect ? (
              <div
                className="flex items-center justify-center text-xs font-medium rounded-full shrink-0"
                style={{
                  width: 28,
                  height: 28,
                  background: isActive ? 'rgba(79, 70, 229, 0.12)' : 'var(--color-muted)',
                  color: isActive ? '#4f46e5' : 'var(--color-muted-foreground)',
                }}
              >
                {(chat.members[0] ?? '?').toString().slice(0, 2)}
              </div>
            ) : (
              <div
                className="flex items-center justify-center rounded-lg shrink-0"
                style={{
                  width: 28,
                  height: 28,
                  background: isActive ? 'rgba(79, 70, 229, 0.12)' : 'var(--color-muted)',
                  color: isActive ? '#4f46e5' : 'var(--color-muted-foreground)',
                }}
              >
                <Icon size={14} />
              </div>
            )}
            <span className="truncate flex-1">
              {isDirect ? `用户 #${chat.members[0]}` : chat.name ?? CHAT_TYPE_LABELS[chat.type]}
            </span>
            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
          </button>
        )
      })}
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
    ? selectedMembers.length <= 1
      ? 'single'
      : 'group'
    : isPublic
      ? 'public_channel'
      : 'private_channel'

  const toggleMember = (id: number) => {
    setSelectedMembers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleSubmit = () => {
    if (selectedMembers.length < 1) return
    createChat.mutate(
      { name: name.trim() || undefined, members: selectedMembers, public: isPublic },
      { onSuccess: onClose },
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div className="card p-6 w-[420px] animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">新建对话</h3>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full uppercase tracking-wider">
            {CHAT_TYPE_LABELS[predictedType]}
          </span>
        </div>
        <div className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名称（留空 = 私聊/群组）"
            className="input"
          />
          {name.trim() && (
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
          <div className="space-y-1.5">
            <p className="text-sm font-medium">选择成员</p>
            <div className="max-h-44 overflow-auto rounded-lg border p-2 space-y-0.5 bg-background">
              {users?.map((user) => {
                const checked = selectedMembers.includes(user.id)
                return (
                  <label
                    key={user.id}
                    className={cn(
                      'flex items-center gap-3 text-sm px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                      checked ? 'bg-accent/50' : 'hover:bg-muted/50',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleMember(user.id)}
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                        checked ? 'bg-primary border-primary' : 'border-input bg-background',
                      )}
                    >
                      {checked && <Check size={12} className="text-primary-foreground" />}
                    </button>
                    <div
                      className="flex items-center justify-center text-xs font-medium rounded-full shrink-0"
                      style={{ width: 24, height: 24, background: 'rgba(79, 70, 229, 0.10)', color: '#4f46e5' }}
                    >
                      {user.fullname.charAt(0)}
                    </div>
                    <span className="truncate">{user.fullname}</span>
                    <span className="text-xs text-muted-foreground ml-auto truncate">{user.email}</span>
                  </label>
                )
              })}
              {(!users || users.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">暂无可选用户</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-ghost">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedMembers.length < 1 || createChat.isPending}
            className="btn-primary"
          >
            {createChat.isPending ? '创建中...' : '创建'}
          </button>
        </div>
      </div>
    </div>
  )
}
