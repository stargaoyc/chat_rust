import { useState, useRef } from 'react'
import { useFileUpload } from '@/hooks/use-files'
import { toast } from 'sonner'

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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return
    try {
      const urls = await uploadMutation.mutateAsync(files)
      setUploadedUrls((prev) => [...prev, ...urls])
    } catch (err) {
      toast.error('文件上传失败', { description: String(err) })
    }
  }

  const handleSubmit = () => {
    if (!content.trim() && uploadedUrls.length === 0) return
    onSend(content, uploadedUrls)
    setContent('')
    setUploadedUrls([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`border-t p-3 ${isDragOver ? 'bg-accent/50' : ''}`}
    >
      {uploadedUrls.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {uploadedUrls.map((url) => (
            <span key={url} className="text-xs bg-muted rounded px-2 py-1">
              📎 {url.split('/').pop()}
              <button
                onClick={() => setUploadedUrls((urls) => urls.filter((u) => u !== url))}
                className="ml-1 text-destructive"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Shift+Enter 换行)"
          rows={1}
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || (!content.trim() && uploadedUrls.length === 0)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          发送
        </button>
      </div>
      {isDragOver && (
        <p className="text-xs text-center text-muted-foreground mt-1">拖放文件到此处上传</p>
      )}
    </div>
  )
}
