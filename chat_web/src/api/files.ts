import { apiClient } from './client'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:6688/api'

export const filesApi = {
  upload: async (files: File[]) => {
    const fd = new FormData()
    files.forEach((f) => fd.append('files', f))
    return apiClient.post('upload', { body: fd }).json<string[]>()
  },

  downloadUrl: (path: string) => `${API_BASE}${path}`,
}
