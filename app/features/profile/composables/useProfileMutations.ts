import type { ChangePasswordInput, UpdateProfileInput } from '../types/profile.types'
import { useMutation, useQueryCache } from '@pinia/colada'
import { profileApi } from '../api/profile.api'
import { profileKeys } from '../api/profile.keys'

export const useUpdateProfile = () => {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: (data: UpdateProfileInput) => profileApi.updateProfile(data),
    onSettled: () => {
      queryCache.invalidateQueries({ key: profileKeys.profile() })
    },
  })
}

export const useChangePassword = () => {
  return useMutation({
    mutation: (data: ChangePasswordInput) => profileApi.changePassword(data),
  })
}
