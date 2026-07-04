import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/cn'

export function ConnectionIndicator() {
  const status = useAppStore((s) => s.sseStatus)

  const statusConfig = {
    connected: { color: '#10b981', label: '在线' },
    reconnecting: { color: '#f59e0b', label: '重连' },
    disconnected: { color: '#ef4444', label: '离线' },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn('h-2 w-2 rounded-full transition-colors duration-300', status === 'reconnecting' && 'animate-pulse')}
        style={{ background: config.color }}
      />
      <span className="text-xs text-muted-foreground hidden sm:inline">{config.label}</span>
    </div>
  )
}
