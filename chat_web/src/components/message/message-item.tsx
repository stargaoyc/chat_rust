import { memo } from 'react'
import type { Message } from '@/types/models'
import { formatMessageTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { FileText } from 'lucide-react'
import { filesApi } from '@/api/files'

interface MessageItemProps {
  message: Message
  isOwn: boolean
  senderName?: string
}

function getInitials(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  // For CJK names, take the first character; for Latin names, take the first letter.
  const firstChar = trimmed[0]
  return /\p{Unified_Ideograph}/u.test(firstChar) ? firstChar : firstChar.toUpperCase()
}

export const MessageItem = memo(function MessageItem({ message, isOwn, senderName }: MessageItemProps) {
  const isOptimistic = message.id < 0
  const name = senderName || `用户 #${message.sender_id}`
  const initial = getInitials(name)

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-2 group',
        isOwn ? 'flex-row-reverse justify-start' : 'justify-start',
      )}
    >
      <div
        className="flex items-center justify-center text-xs font-medium rounded-full shrink-0 mt-0.5"
        style={{ width: 30, height: 30, background: 'rgba(79, 70, 229, 0.10)', color: '#4f46e5' }}
        title={name}
      >
        {initial}
      </div>

      <div className={cn('max-w-[70%] flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        <div className="flex items-baseline gap-1.5 mb-0.5 px-1">
          {isOwn ? (
            <>
              <span className="text-xs text-muted-foreground opacity-60">{formatMessageTime(message.created_at)}</span>
              <span className="text-xs font-medium text-muted-foreground">{name}</span>
            </>
          ) : (
            <>
              <span className="text-xs font-medium text-muted-foreground">{name}</span>
              <span className="text-xs text-muted-foreground opacity-60">{formatMessageTime(message.created_at)}</span>
            </>
          )}
        </div>

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
              {message.files.map((path) => {
                const url = filesApi.downloadUrl(path)
                const filename = url.split('/').pop() || path
                return (
                  <a
                    key={path}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={async (e) => {
                      e.preventDefault()
                      try {
                        const blob = await filesApi.download(path)
                        const blobUrl = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = blobUrl
                        a.download = filename
                        document.body.appendChild(a)
                        a.click()
                        a.remove()
                        URL.revokeObjectURL(blobUrl)
                      } catch (err) {
                        window.open(url, '_blank', 'noopener,noreferrer')
                      }
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 text-xs underline underline-offset-2 cursor-pointer',
                      isOwn ? 'text-white/80' : 'text-primary',
                    )}
                  >
                    <FileText size={12} />
                    {filename}
                  </a>
                )
              })}
            </div>
          )}
        </div>

        {isOwn && isOptimistic && (
          <div className="flex items-baseline gap-1 mt-0.5 px-1">
            <span className="text-xs text-muted-foreground opacity-60">发送中...</span>
          </div>
        )}
      </div>
    </div>
  )
})
