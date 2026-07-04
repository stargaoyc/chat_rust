import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { authApi } from '@/api/auth'
import { setAccessToken, clearAuth, decodeToken } from '@/lib/auth'
import type { SigninInput, SignupInput } from '@/schemas/auth'
import type { User } from '@/types/models'

export function useSignup() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: SignupInput) => authApi.signup(data),
    onSuccess: ({ token }) => {
      setAccessToken(token)
      void navigate({ to: '/' })
    },
  })
}

export function useSignin() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: SigninInput) => authApi.signin(data),
    onSuccess: ({ token }) => {
      setAccessToken(token)
      void navigate({ to: '/' })
    },
  })
}

export function useSignout() {
  const navigate = useNavigate()
  return () => {
    clearAuth()
    void navigate({ to: '/login' })
  }
}

export function useCurrentUser(): User | null {
  return decodeToken()
}
