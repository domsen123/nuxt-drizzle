import type { UserPreferences } from '~~/shared/user-preferences.constants'
import type { ChangePasswordInput, RequestEmailChangeInput, UpdateProfileInput } from '../types/profile.types'
import { useMutation, useQueryCache } from '@pinia/colada'
import { authKeys, useSession } from '~/features/auth'
import { useProfileApi } from '../api/profile.api'
import { profileKeys } from '../api/profile.keys'
import { useApplyPreferences } from './useApplyPreferences'

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

export const useUpdatePreferences = () => {
  const queryCache = useQueryCache()
  const profileApi = useProfileApi()
  const toast = useToast()
  const { t } = useI18n()
  const { user } = useSession()
  const applyPreferences = useApplyPreferences()

  return useMutation({
    mutation: (data: UserPreferences) => profileApi.updatePreferences(data),
    onSettled: () => {
      queryCache.invalidateQueries({ key: profileKeys.profile() })
      queryCache.invalidateQueries({ key: authKeys.session() })
    },
    onError: () => {
      // Roll the optimistic selection back to the last server state
      applyPreferences(user.value?.preferences)
      toast.add({
        title: t('profile.preferences.saveFailedTitle'),
        description: t('profile.preferences.saveFailedDescription'),
        color: 'error',
      })
    },
  })
}

export const useChangePassword = () => {
  const profileApi = useProfileApi()

  return useMutation({
    mutation: (data: ChangePasswordInput) => profileApi.changePassword(data),
  })
}

export const useRequestEmailChange = () => {
  const queryCache = useQueryCache()
  const profileApi = useProfileApi()

  return useMutation({
    mutation: (data: RequestEmailChangeInput) => profileApi.requestEmailChange(data),
    onSettled: () => {
      queryCache.invalidateQueries({ key: profileKeys.pendingEmailChange() })
    },
  })
}

export const useCancelEmailChange = () => {
  const queryCache = useQueryCache()
  const profileApi = useProfileApi()

  return useMutation({
    mutation: () => profileApi.cancelEmailChange(),
    onSettled: () => {
      queryCache.invalidateQueries({ key: profileKeys.pendingEmailChange() })
    },
  })
}

export const useConfirmEmailChange = () => {
  const queryCache = useQueryCache()
  const profileApi = useProfileApi()

  return useMutation({
    mutation: (token: string) => profileApi.confirmEmailChange(token),
    onSettled: () => {
      // Invalidate both profile and session since email changed
      queryCache.invalidateQueries({ key: profileKeys.profile() })
      queryCache.invalidateQueries({ key: profileKeys.pendingEmailChange() })
      queryCache.invalidateQueries({ key: authKeys.session() })
    },
  })
}
