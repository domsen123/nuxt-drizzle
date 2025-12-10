import type { AuthResponse, LoginCredentials, RegisterCredentials, SessionResponse } from '../types/auth.types'

export const authApi = {
  login: (credentials: LoginCredentials): Promise<AuthResponse> =>
    $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials,
    }),

  register: (credentials: RegisterCredentials): Promise<AuthResponse> =>
    $fetch('/api/auth/register', {
      method: 'POST',
      body: credentials,
    }),

  logout: (): Promise<{ success: boolean }> =>
    $fetch('/api/auth/logout', {
      method: 'POST',
    }),

  getSession: (): Promise<SessionResponse> =>
    $fetch('/api/auth/session'),
}
