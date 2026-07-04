export type ChatType = 'single' | 'group' | 'public_channel' | 'private_channel'

export interface User {
  id: number
  ws_id: number
  fullname: string
  email: string
  created_at: string
}

export interface ChatUser {
  id: number
  fullname: string
  email: string
}

export interface Workspace {
  id: number
  name: string
  owner_id: number
  created_at: string
}

export interface Chat {
  id: number
  ws_id: number
  name: string | null
  type: ChatType
  members: number[]
  created_at: string
}

export interface Message {
  id: number
  chat_id: number
  sender_id: number
  content: string
  files: string[]
  created_at: string
}
