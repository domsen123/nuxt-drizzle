import type {
  AuthResponse,
  ForgotPasswordCredentials,
  ForgotPasswordResponse,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  ResetPasswordResponse,
  SessionResponse,
  ValidateResetTokenResponse,
} from '../types/auth.types'

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

  forgotPassword: (credentials: ForgotPasswordCredentials): Promise<ForgotPasswordResponse> =>
    $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: credentials,
    }),

  resetPassword: (credentials: ResetPasswordCredentials): Promise<ResetPasswordResponse> =>
    $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: credentials,
    }),

  validateResetToken: (token: string): Promise<ValidateResetTokenResponse> =>
    $fetch('/api/auth/validate-reset-token', {
      query: { token },
    }),
}
