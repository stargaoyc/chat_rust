import { getAccessToken } from '@/lib/auth'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:6688/api'

function authHeaders(): Record<string, string> {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function uploadWithFetch(file: File): Promise<string[]> {
  const fd = new FormData()
  fd.append('file', file)

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: authHeaders(),
    credentials: 'include',
    body: fd,
  })

  if (!response.ok) {
    let errorMessage = `Upload failed: ${response.status}`
    try {
      const body = await response.json()
      if (body.error) errorMessage = body.error
    } catch {
      const text = await response.text()
      if (text) errorMessage += ` - ${text}`
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

export const filesApi = {
  upload: async (files: File[]): Promise<string[]> => {
    const results: string[] = []
    for (const file of files) {
      const paths = await uploadWithFetch(file)
      results.push(...paths)
    }
    return results
  },

  download: async (path: string): Promise<Blob> => {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`
    const response = await fetch(url, {
      credentials: 'include',
      headers: authHeaders(),
    })
    if (!response.ok) throw new Error(`Download failed: ${response.status}`)
    return response.blob()
  },

  downloadUrl: (path: string): string => {
    return path.startsWith('http') ? path : `${API_BASE}${path}`
  },
}
