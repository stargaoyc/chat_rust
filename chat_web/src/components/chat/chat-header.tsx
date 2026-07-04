import type { Chat } from '@/types/models'

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
  if (!chat) {
    return (
      <div className="h-14 border-b flex items-center px-4">
        <span className="text-muted-foreground">加载中...</span>
      </div>
    )
  }

  return (
    <div className="h-14 border-b flex items-center justify-between px-4">
      <div>
        <h2 className="font-semibold">{chat.name ?? CHAT_TYPE_LABELS[chat.type]}</h2>
        <p className="text-xs text-muted-foreground">
          {CHAT_TYPE_LABELS[chat.type]} · {chat.members.length} 成员
        </p>
      </div>
    </div>
  )
}
