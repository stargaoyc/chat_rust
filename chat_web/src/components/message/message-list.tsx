import { Virtuoso } from 'react-virtuoso'
import type { Message } from '@/types/models'
import { MessageItem } from './message-item'

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
        <MessageItem
          message={message}
          isOwn={message.sender_id === currentUserId}
        />
      )}
      components={{
        Header: () =>
          isFetchingNextPage ? (
            <div className="flex justify-center py-2">
              <span className="text-xs text-muted-foreground">加载更多...</span>
            </div>
          ) : null,
      }}
    />
  )
}
