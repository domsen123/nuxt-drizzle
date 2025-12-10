import type { Ref } from 'vue'
import { useQuery } from '@pinia/colada'
import { authApi } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'

export const useValidateResetToken = (token: Ref<string | null>) => {
  return useQuery({
    key: () => [...authKeys.all, 'validate-reset-token', token.value] as const,
    query: () => {
      if (!token.value) {
        return Promise.resolve({ valid: false })
      }
      return authApi.validateResetToken(token.value)
    },
    enabled: () => !!token.value,
  })
}
