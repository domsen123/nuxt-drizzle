import type {
  ChangePasswordInput,
  ProfileResponse,
  UpdateProfileInput,
} from '../types/profile.types'

export const useProfileApi = () => {
  const { $api } = useNuxtApp()

  return {
    getProfile: (): Promise<ProfileResponse> =>
      $api('/api/profile'),

    updateProfile: (data: UpdateProfileInput): Promise<ProfileResponse> =>
      $api('/api/profile', {
        method: 'PUT',
        body: data,
      }),

    changePassword: (data: ChangePasswordInput): Promise<{ success: boolean }> =>
      $api('/api/profile/password', {
        method: 'PUT',
        body: data,
      }),
  }
}
