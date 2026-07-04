import { fetchEventSource } from '@microsoft/fetch-event-source'
import type { AppEvent, SSEEventType } from '@/types/events'
import { getAccessToken } from '@/lib/auth'
import { useAppStore } from '@/stores/app-store'

const SSE_BASE = import.meta.env.VITE_SSE_BASE ?? 'http://localhost:6687/events'

const VALID_EVENTS: SSEEventType[] = ['NewChat', 'AddToChat', 'RemoveFromChat', 'NewMessage']

let ctrl: AbortController | null = null
let retryCount = 0
const MAX_RETRY_DELAY = 30_000

function getRetryDelay(): number {
  const delay = Math.min(1000 * 2 ** retryCount, MAX_RETRY_DELAY)
  retryCount++
  return delay
}

export async function connectSSE(handler: (e: AppEvent) => void): Promise<void> {
  disconnectSSE()
  retryCount = 0
  ctrl = new AbortController()

  await fetchEventSource(SSE_BASE, {
    signal: ctrl.signal,
    headers: {
      Authorization: `Bearer ${getAccessToken() ?? ''}`,
    },
    credentials: 'include',
    onmessage(ev) {
      const type = ev.event as SSEEventType
      if (VALID_EVENTS.includes(type)) {
        try {
          handler(JSON.parse(ev.data) as AppEvent)
        } catch {
          // ignore parse errors
        }
      }
    },
    async onopen() {
      retryCount = 0
      useAppStore.getState().setSseStatus('connected')
    },
    onerror() {
      useAppStore.getState().setSseStatus('reconnecting')
      throw new Error(`SSE reconnect in ${getRetryDelay()}ms`)
    },
    openWhenHidden: true,
  })
}

export function disconnectSSE(): void {
  if (ctrl) {
    ctrl.abort()
    ctrl = null
  }
  useAppStore.getState().setSseStatus('disconnected')
}
