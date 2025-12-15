import type { ChangePasswordInput, UpdateProfileInput } from '../types/profile.types'
import { useMutation, useQueryCache } from '@pinia/colada'
import { useProfileApi } from '../api/profile.api'
import { profileKeys } from '../api/profile.keys'

export const useUpdateProfile = () => {
  const queryCache = useQueryCache()
  const profileApi = useProfileApi()

  return useMutation({
    mutation: (data: UpdateProfileInput) => profileApi.updateProfile(data),
    onSettled: () => {
      queryCache.invalidateQueries({ key: profileKeys.profile() })
    },
  })
}

export const useChangePassword = () => {
  const profileApi = useProfileApi()

  return useMutation({
    mutation: (data: ChangePasswordInput) => profileApi.changePassword(data),
  })
}
