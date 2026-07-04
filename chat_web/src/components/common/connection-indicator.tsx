import { useAppStore } from '@/stores/app-store'

export function ConnectionIndicator() {
  const status = useAppStore((s) => s.sseStatus)

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={`h-2 w-2 rounded-full ${
          status === 'connected'
            ? 'bg-green-500'
            : status === 'reconnecting'
              ? 'bg-yellow-500 animate-pulse'
              : 'bg-red-500'
        }`}
      />
      <span>
        {status === 'connected' ? '已连接' : status === 'reconnecting' ? '重连中...' : '已断开'}
      </span>
    </div>
  )
}
