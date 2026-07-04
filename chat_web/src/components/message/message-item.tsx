import type { Message } from '@/types/models'
import { formatMessageTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { FileText } from 'lucide-react'

interface MessageItemProps {
  message: Message
  isOwn: boolean
}

export function MessageItem({ message, isOwn }: MessageItemProps) {
  const isOptimistic = message.id < 0

  return (
    <div className={cn('flex gap-3 px-4 py-2 group', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && (
        <div
          className="flex items-center justify-center text-xs font-medium rounded-full shrink-0 mt-0.5"
          style={{ width: 30, height: 30, background: 'rgba(79, 70, 229, 0.10)', color: '#4f46e5' }}
        >
          {(message.sender_id % 26 + 10).toString(36).toUpperCase()}
        </div>
      )}

      <div className={cn('max-w-[70%] flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        {!isOwn && (
          <div className="flex items-baseline gap-1.5 mb-0.5 px-1">
            <span className="text-xs font-medium text-muted-foreground">用户 #{message.sender_id}</span>
            <span className="text-xs text-muted-foreground opacity-60">{formatMessageTime(message.created_at)}</span>
          </div>
        )}

        <div
          className={cn(
            'rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm',
            isOwn ? 'rounded-br-md text-white' : 'rounded-bl-md text-foreground border',
            isOptimistic && 'opacity-60',
          )}
          style={isOwn ? { background: '#4f46e5' } : { background: '#ffffff' }}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          {message.files.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {message.files.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs underline underline-offset-2',
                    isOwn ? 'text-white/80' : 'text-primary',
                  )}
                >
                  <FileText size={12} />
                  {url.split('/').pop()}
                </a>
              ))}
            </div>
          )}
        </div>

        {isOwn && (
          <div className="flex items-baseline gap-1 mt-0.5 px-1">
            <span className="text-xs text-muted-foreground opacity-60">
              {formatMessageTime(message.created_at)}
              {isOptimistic && ' · 发送中...'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
