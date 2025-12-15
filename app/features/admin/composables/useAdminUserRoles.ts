import type { MaybeRefOrGetter } from 'vue'
import { useQuery } from '@pinia/colada'
import { useAdminApi } from '../api/admin.api'
import { adminKeys } from '../api/admin.keys'

export const useAdminUserRoles = (userId: MaybeRefOrGetter<string>) => {
  const adminApi = useAdminApi()

  const query = useQuery({
    key: () => adminKeys.userRoles(toValue(userId)),
    query: () => adminApi.getUserRoles(toValue(userId)),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const roles = computed(() => query.data.value?.roles ?? [])

  return {
    ...query,
    roles,
  }
}
