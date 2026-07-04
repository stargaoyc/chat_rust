import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/')({
  component: ChatIndexPage,
})

function ChatIndexPage() {
  // If no chats, show empty state
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <p className="text-lg">暂无聊天</p>
        <p className="text-sm mt-2">点击侧边栏 + 创建新对话</p>
      </div>
    </div>
  )
}
