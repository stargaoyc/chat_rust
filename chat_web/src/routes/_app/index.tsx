import { createFileRoute } from '@tanstack/react-router'
import { MessagesSquare } from 'lucide-react'

export const Route = createFileRoute('/_app/')({
  component: ChatIndexPage,
})

function ChatIndexPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <div
          className="flex items-center justify-center mx-auto mb-4 rounded-2xl"
          style={{ width: 64, height: 64, background: 'var(--color-muted)' }}
        >
          <MessagesSquare size={28} className="text-muted-foreground opacity-60" />
        </div>
        <p className="text-base font-medium text-foreground">选择一个对话开始聊天</p>
        <p className="text-sm text-muted-foreground mt-1.5">从左侧列表选择，或创建新对话</p>
      </div>
    </div>
  )
}
