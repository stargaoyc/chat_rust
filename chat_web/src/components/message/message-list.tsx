import { Virtuoso } from 'react-virtuoso'
import type { Message } from '@/types/models'
import { MessageItem } from './message-item'
import { MessageSquareText, Loader2 } from 'lucide-react'

interface MessageListProps {
  messages: Message[]
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  hasNextPage: boolean
  currentUserId: number
}

export function MessageList({
  messages,
  isFetchingNextPage,
  fetchNextPage,
  hasNextPage,
  currentUserId,
}: MessageListProps) {
  const firstItemIndex = -(messages.length + 1000)

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div
            className="flex items-center justify-center mx-auto mb-3 rounded-full"
            style={{ width: 48, height: 48, background: 'var(--color-muted)' }}
          >
            <MessageSquareText size={22} className="text-muted-foreground opacity-50" />
          </div>
          <p className="text-sm text-muted-foreground">暂无消息</p>
          <p className="text-xs text-muted-foreground mt-1">发送第一条消息开始对话</p>
        </div>
      </div>
    )
  }

  return (
    <Virtuoso
      firstItemIndex={firstItemIndex}
      initialTopMostItemIndex={firstItemIndex + messages.length - 1}
      data={messages}
      followOutput="smooth"
      atTopStateChange={(isAtTop) => {
        if (isAtTop && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }}
      itemContent={(_index, message) => (
        <MessageItem message={message} isOwn={message.sender_id === currentUserId} />
      )}
      components={{
        Header: () =>
          isFetchingNextPage ? (
            <div className="flex justify-center py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                加载更多消息
              </div>
            </div>
          ) : null,
      }}
    />
  )
}
