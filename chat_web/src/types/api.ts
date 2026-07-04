export interface AuthResponse {
  token: string
}

export interface ListMessagesParams {
  limit: number
  last_id?: number
}

export interface ErrorOutput {
  error: string
}
