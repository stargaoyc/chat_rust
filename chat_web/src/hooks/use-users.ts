import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/api/users'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    staleTime: 60_000,
  })
}
