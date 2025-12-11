import { useQuery } from '@pinia/colada'
import { adminApi } from '../api/admin.api'
import { adminKeys } from '../api/admin.keys'

export const useAdminOrganisations = () => {
  const query = useQuery({
    key: adminKeys.organisations(),
    query: () => adminApi.getOrganisations(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const organisations = computed(() =>
    query.data.value?.organisations ?? [],
  )

  const total = computed(() =>
    query.data.value?.total ?? 0,
  )

  return {
    ...query,
    organisations,
    total,
  }
}
