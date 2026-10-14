import type { AdminRegistrationSettings } from '../types/admin.types'
import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { DEFAULT_REGISTRATION_MODE } from '~~/shared/registration.constants'
import { useAdminApi } from '../api/admin.api'
import { adminKeys } from '../api/admin.keys'

export const useAdminRegistrationSettings = () => {
  const adminApi = useAdminApi()

  const query = useQuery({
    key: adminKeys.registrationSettings,
    query: () => adminApi.getRegistrationSettings(),
    staleTime: 2 * 60 * 1000,
  })

  const mode = computed(() => query.data.value?.mode ?? DEFAULT_REGISTRATION_MODE)

  return {
    ...query,
    mode,
  }
}

export const useUpdateRegistrationSettings = () => {
  const queryCache = useQueryCache()
  const adminApi = useAdminApi()

  return useMutation({
    mutation: (data: AdminRegistrationSettings) =>
      adminApi.updateRegistrationSettings(data),
    onSettled: () => {
      queryCache.invalidateQueries({ key: adminKeys.registrationSettings() })
    },
  })
}
