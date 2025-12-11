export interface UserProfile {
  id: string
  email: string
  name: string | null
  createdAt: string
  updatedAt: string
}

export interface ProfileResponse {
  profile: UserProfile
}

export interface UpdateProfileInput {
  name?: string
  email?: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}
