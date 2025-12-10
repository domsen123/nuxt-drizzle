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
}

export interface RegisterCredentials {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  user: AuthUser
}

export interface SessionResponse {
  user: AuthUser | null
}
