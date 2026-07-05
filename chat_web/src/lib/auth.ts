import type { User } from '@/types/models'

const TOKEN_KEY = 'chat_access_token'

let accessToken: string | null = localStorage.getItem(TOKEN_KEY)

export const getAccessToken = () => accessToken
export const setAccessToken = (token: string | null) => {
  accessToken = token
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}
export const isAuthenticated = () => !!accessToken

export function decodeToken(): User | null {
  if (!accessToken) return null
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    return {
      id: payload.id,
      ws_id: payload.ws_id,
      fullname: payload.fullname,
      email: payload.email,
      created_at: payload.created_at,
    }
  } catch {
    return null
  }
}

export function clearAuth() {
  accessToken = null
  localStorage.removeItem(TOKEN_KEY)
}
