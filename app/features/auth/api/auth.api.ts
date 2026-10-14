import type {
  AuthResponse,
  ForgotPasswordCredentials,
  ForgotPasswordResponse,
  LoginCredentials,
  LogoutOtherSessionsResponse,
  PublicAuthProvidersResponse,
  RegisterCredentials,
  ResendVerificationResponse,
  ResetPasswordCredentials,
  ResetPasswordResponse,
  RevokeSessionResponse,
  SessionResponse,
  SessionsResponse,
  ValidateResetTokenResponse,
} from '../types/auth.types'

/**
 * Target for the full-page navigation that starts the OAuth flow. Only the
 * server talks to the identity provider.
 */
export const oauthAuthorizeUrl = (provider: string, redirect?: string): string => {
  const base = `/api/auth/oauth/${provider}/authorize`
  return redirect ? `${base}?redirect=${encodeURIComponent(redirect)}` : base
}

export const useAuthApi = () => {
  const { $api } = useNuxtApp()

  return {
    login: (credentials: LoginCredentials): Promise<AuthResponse> =>
      $api('/api/auth/login', {
        method: 'POST',
        body: credentials,
      }),

    register: (credentials: RegisterCredentials): Promise<AuthResponse> =>
      $api('/api/auth/register', {
        method: 'POST',
        body: credentials,
      }),

    logout: (): Promise<{ success: boolean }> =>
      $api('/api/auth/logout', {
        method: 'POST',
      }),

    getSession: (): Promise<SessionResponse> =>
      $api('/api/auth/session'),

    getPublicProviders: (): Promise<PublicAuthProvidersResponse> =>
      $api('/api/auth/providers'),

    forgotPassword: (credentials: ForgotPasswordCredentials): Promise<ForgotPasswordResponse> =>
      $api('/api/auth/forgot-password', {
        method: 'POST',
        body: credentials,
      }),

    resetPassword: (credentials: ResetPasswordCredentials): Promise<ResetPasswordResponse> =>
      $api('/api/auth/reset-password', {
        method: 'POST',
        body: credentials,
      }),

    validateResetToken: (token: string): Promise<ValidateResetTokenResponse> =>
      $api('/api/auth/validate-reset-token', {
        query: { token },
      }),

    resendVerification: (): Promise<ResendVerificationResponse> =>
      $api('/api/auth/resend-verification', {
        method: 'POST',
      }),

    // Session management
    getSessions: (): Promise<SessionsResponse> =>
      $api('/api/auth/sessions'),

    logoutOtherSessions: (): Promise<LogoutOtherSessionsResponse> =>
      $api('/api/auth/sessions/others', {
        method: 'DELETE',
      }),

    revokeSession: (sessionId: string): Promise<RevokeSessionResponse> =>
      $api(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      }),
  }
}
