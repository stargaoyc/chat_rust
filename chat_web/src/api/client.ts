// @ts-nocheck — ky types incompatible with TS 7.0
import ky from 'ky'
import { getAccessToken, setAccessToken, clearAuth } from '@/lib/auth'
import type { ErrorOutput } from '@/types/api'

export class AppError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
  }
}

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:6688/api'

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) return null
      const data: { token: string } = await res.json()
      setAccessToken(data.token)
      return data.token
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

export const apiClient = ky.create({
  prefixUrl: API_BASE,
  credentials: 'include',
  hooks: {
    beforeRequest: [
      (request: Request) => {
        const token = getAccessToken()
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
      },
    ],
    afterResponse: [
      async (request: Request, _options: unknown, response: Response) => {
        if (response.status === 401) {
          const newToken = await refreshAccessToken()
          if (newToken) {
            request.headers.set('Authorization', `Bearer ${newToken}`)
            return ky(request)
          }
          clearAuth()
          window.location.href = '/login'
          return response
        }
        if (!response.ok) {
          const body: ErrorOutput = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new AppError(response.status, `HTTP_${response.status}`, body.error)
        }
      },
    ],
  },
  retry: { limit: 2, methods: ['get'], statusCodes: [502, 503, 504] },
})
