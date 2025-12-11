import type {
  ChangePasswordInput,
  ProfileResponse,
  UpdateProfileInput,
} from '../types/profile.types'

export const profileApi = {
  getProfile: (): Promise<ProfileResponse> =>
    $fetch('/api/profile'),

  updateProfile: (data: UpdateProfileInput): Promise<ProfileResponse> =>
    $fetch('/api/profile', {
      method: 'PUT',
      body: data,
    }),

  changePassword: (data: ChangePasswordInput): Promise<{ success: boolean }> =>
    $fetch('/api/profile/password', {
      method: 'PUT',
      body: data,
    }),
}
