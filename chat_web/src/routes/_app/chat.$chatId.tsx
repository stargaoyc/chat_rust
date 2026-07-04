import { createFileRoute } from '@tanstack/react-router'
import { useChat } from '@/hooks/use-chats'
import { useMessageList, useSendMessage } from '@/hooks/use-messages'
import { useCurrentUser } from '@/hooks/use-auth'
import { ChatHeader } from '@/components/chat/chat-header'
import { MessageList } from '@/components/message/message-list'
import { MessageInput } from '@/components/message/message-input'

export const Route = createFileRoute('/_app/chat/$chatId')({
  component: ChatDetailPage,
})

function ChatDetailPage() {
  const { chatId } = Route.useParams()
  const id = Number(chatId)
  const { data: chat } = useChat(id)
  const messagesQuery = useMessageList(id)
  const sendMessage = useSendMessage(id)
  const currentUser = useCurrentUser()

  return (
    <div className="flex flex-col h-full">
      <ChatHeader chat={chat} />
      <MessageList
        messages={messagesQuery.data?.allMessages ?? []}
        isFetchingNextPage={messagesQuery.isFetchingNextPage}
        fetchNextPage={messagesQuery.fetchNextPage}
        hasNextPage={messagesQuery.hasNextPage}
        currentUserId={currentUser?.id ?? 0}
      />
      <MessageInput
        onSend={(content, files) =>
          sendMessage.mutate({ content, files })
        }
        disabled={sendMessage.isPending}
      />
    </div>
  )
}
