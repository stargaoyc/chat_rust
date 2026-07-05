import { getAccessToken } from '@/lib/auth'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:6688/api'

function authHeaders(): Record<string, string> {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function uploadWithXHR(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const fd = new FormData()
    fd.append('file', file)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}/upload`)
    const token = getAccessToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.withCredentials = true
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as string[])
        } catch {
          reject(new Error('Invalid upload response'))
        }
      } else {
        let message = `Upload failed: ${xhr.status}`
        try {
          const body = JSON.parse(xhr.responseText)
          if (body.error) message = body.error
        } catch {
          if (xhr.responseText) message += ` - ${xhr.responseText}`
        }
        reject(new Error(message))
      }
    }
    xhr.onerror = () => reject(new Error('Upload failed: network error'))
    xhr.send(fd)
  })
}

export const filesApi = {
  upload: async (files: File[]) => {
    const results: string[] = []
    for (const file of files) {
      const paths = await uploadWithXHR(file)
      results.push(...paths)
    }
    return results
  },

  download: async (path: string) => {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`
    const res = await fetch(url, {
      credentials: 'include',
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`Download failed: ${res.status}`)
    return res.blob()
  },

  downloadUrl: (path: string) => (path.startsWith('http') ? path : `${API_BASE}${path}`),
}
