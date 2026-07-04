import type { Message } from '@/types/models'
import { formatMessageTime } from '@/lib/format'
import { cn } from '@/lib/cn'

interface MessageItemProps {
  message: Message
  isOwn: boolean
}

export function MessageItem({ message, isOwn }: MessageItemProps) {
  const isOptimistic = message.id < 0

  return (
    <div className={cn('flex gap-2 px-4 py-1', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-3 py-2 text-sm',
          isOwn
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted',
          isOptimistic && 'opacity-70',
        )}
      >
        {!isOwn && (
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            用户 #{message.sender_id}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {message.files.length > 0 && (
          <div className="mt-1 space-y-1">
            {message.files.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs underline opacity-80"
              >
                📎 {url.split('/').pop()}
              </a>
            ))}
          </div>
        )}
        <p className={cn('text-[10px] mt-0.5', isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
          {formatMessageTime(message.created_at)}
          {isOptimistic && ' · 发送中...'}
        </p>
      </div>
    </div>
  )
}
