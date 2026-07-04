import { apiClient } from './client'
import type { SigninInput, SignupInput } from '@/schemas/auth'
import type { AuthResponse } from '@/types/api'

export const authApi = {
  signup: (data: SignupInput) =>
    apiClient.post('signup', { json: data }).json<AuthResponse>(),

  signin: (data: SigninInput) =>
    apiClient.post('signin', { json: data }).json<AuthResponse>(),
}
