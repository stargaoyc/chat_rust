import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useChat } from '@/hooks/use-chats'
import { useMessageList, useSendMessage } from '@/hooks/use-messages'
import { useCurrentUser } from '@/hooks/use-auth'
import { useUsers } from '@/hooks/use-users'
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
  const { data: users } = useUsers()
  const [searchQuery, setSearchQuery] = useState('')

  const usersMap = users
    ? new Map(users.map((u) => [u.id, u.fullname]))
    : undefined

  const allMessages = messagesQuery.data?.allMessages ?? []
  const filteredMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return allMessages
    return allMessages.filter((m) => m.content.toLowerCase().includes(query))
  }, [allMessages, searchQuery])

  return (
    <div className="flex flex-col h-full">
      <ChatHeader chat={chat} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <MessageList
        messages={filteredMessages}
        isFetchingNextPage={messagesQuery.isFetchingNextPage}
        fetchNextPage={messagesQuery.fetchNextPage}
        hasNextPage={messagesQuery.hasNextPage}
        currentUserId={currentUser?.id ?? 0}
        usersMap={usersMap}
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
