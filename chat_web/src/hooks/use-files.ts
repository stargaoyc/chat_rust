import { useMutation } from '@tanstack/react-query'
import { filesApi } from '@/api/files'

export function useFileUpload() {
  return useMutation({
    mutationFn: (files: File[]) => filesApi.upload(files),
  })
}
