import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  usersMap?: Map<number, string>
}

export function MessageList({
  messages,
  isFetchingNextPage,
  fetchNextPage,
  hasNextPage,
  currentUserId,
  usersMap,
}: MessageListProps) {
  const [firstItemIndex, setFirstItemIndex] = useState(1_000_000)
  const loadingMoreRef = useRef(false)
  const prevLengthRef = useRef(messages.length)

  useEffect(() => {
    const diff = messages.length - prevLengthRef.current
    if (diff > 0 && loadingMoreRef.current) {
      setFirstItemIndex((prev) => prev - diff)
      loadingMoreRef.current = false
    }
    prevLengthRef.current = messages.length
  }, [messages.length])

  const itemContent = useCallback(
    (_index: number, message: Message) => (
      <MessageItem
        message={message}
        isOwn={message.sender_id === currentUserId}
        senderName={usersMap?.get(message.sender_id)}
      />
    ),
    [currentUserId, usersMap],
  )

  const components = useMemo(
    () => ({
      Header: () =>
        isFetchingNextPage ? (
          <div className="flex justify-center py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              加载更多消息
            </div>
          </div>
        ) : null,
    }),
    [isFetchingNextPage],
  )

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
      initialTopMostItemIndex={messages.length - 1}
      data={messages}
      followOutput="smooth"
      atTopStateChange={(isAtTop) => {
        if (isAtTop && hasNextPage && !isFetchingNextPage) {
          loadingMoreRef.current = true
          fetchNextPage()
        }
      }}
      itemContent={itemContent}
      components={components}
    />
  )
}
