import { useQuery } from '@pinia/colada'
import { DEFAULT_REGISTRATION_MODE } from '~~/shared/registration.constants'
import { useAuthApi } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'

export const useAuthProviders = () => {
  const authApi = useAuthApi()

  const query = useQuery({
    key: authKeys.publicProviders,
    query: () => authApi.getPublicProviders(),
    staleTime: 2 * 60 * 1000,
  })

  const providers = computed(() => query.data.value?.providers ?? [])
  const registrationMode = computed(() => query.data.value?.registration.mode ?? DEFAULT_REGISTRATION_MODE)

  return {
    ...query,
    providers,
    registrationMode,
  }
}
