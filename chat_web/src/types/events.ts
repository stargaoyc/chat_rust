import type { ChatType } from './models'

export type SSEEventType = 'NewChat' | 'AddToChat' | 'RemoveFromChat' | 'NewMessage'

/** 对应后端 AppEvent: #[serde(tag = "event")] */
export type AppEvent =
  | { event: 'NewChat' | 'AddToChat' | 'RemoveFromChat'; id: number; ws_id: number; name: string | null; type: ChatType; members: number[]; created_at: string }
  | { event: 'NewMessage'; id: number; chat_id: number; sender_id: number; content: string; files: string[]; created_at: string }
