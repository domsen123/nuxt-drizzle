export interface AuthUser {
  id: string
  email: string
  name: string | null
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterCredentials {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  user: AuthUser
}

export interface ImpersonationInfo {
  originalUserId: string
  originalSessionId: string | null
}

export interface SessionResponse {
  user: AuthUser | null
  impersonation: ImpersonationInfo | null
}

export interface ForgotPasswordCredentials {
  email: string
}

export interface ResetPasswordCredentials {
  token: string
  password: string
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
}

export interface ValidateResetTokenResponse {
  valid: boolean
}

export interface ResendVerificationResponse {
  success: boolean
  message: string
}
