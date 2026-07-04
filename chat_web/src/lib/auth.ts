import type { User } from '@/types/models'

let accessToken: string | null = null

export const getAccessToken = () => accessToken
export const setAccessToken = (token: string | null) => { accessToken = token }
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
}
