import { useState, useRef } from 'react'
import { useFileUpload } from '@/hooks/use-files'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'
import { Paperclip, Send, X } from 'lucide-react'

interface MessageInputProps {
  onSend: (content: string, files: string[]) => void
  disabled?: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const uploadMutation = useFileUpload()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return
    try {
      const urls = await uploadMutation.mutateAsync(files)
      setUploadedUrls((prev) => [...prev, ...urls])
    } catch (err) {
      toast.error('文件上传失败', { description: String(err) })
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    await uploadFiles(Array.from(e.dataTransfer.files))
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await uploadFiles(Array.from(e.target.files ?? []))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = () => {
    if (!content.trim() && uploadedUrls.length === 0) return
    onSend(content, uploadedUrls)
    setContent('')
    setUploadedUrls([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const hasContent = content.trim() || uploadedUrls.length > 0

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        'border-t p-4 transition-colors duration-200',
        isDragOver ? 'bg-primary/5' : 'bg-card',
      )}
    >
      {uploadedUrls.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {uploadedUrls.map((url) => (
            <span key={url} className="inline-flex items-center gap-1.5 text-xs bg-muted rounded-lg px-2.5 py-1.5 border">
              <Paperclip size={12} className="text-muted-foreground" />
              {url.split('/').pop()}
              <button
                onClick={() => setUploadedUrls((urls) => urls.filter((u) => u !== url))}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            rows={1}
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all placeholder:text-muted-foreground/50"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          {isDragOver && (
            <div className="absolute inset-0 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 flex items-center justify-center pointer-events-none">
              <span className="text-xs font-medium" style={{ color: '#4f46e5' }}>拖放文件到此处上传</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 pb-0.5">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="上传文件"
          >
            <Paperclip size={18} />
          </button>
          <button
            onClick={handleSubmit}
            disabled={disabled || !hasContent}
            className={cn(
              'p-2 rounded-lg transition-all duration-150',
              hasContent
                ? 'text-white hover:shadow-md active:scale-95'
                : 'text-muted-foreground bg-muted',
            )}
            style={hasContent ? { background: '#4f46e5' } : undefined}
            title="发送"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
