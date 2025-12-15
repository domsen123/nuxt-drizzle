import { useMutation, useQueryCache } from '@pinia/colada'
import { useAdminApi } from '../api/admin.api'
import { adminKeys } from '../api/admin.keys'

export const useDeleteTeam = () => {
  const queryCache = useQueryCache()
  const adminApi = useAdminApi()

  return useMutation({
    mutation: (id: string) => adminApi.deleteTeam(id),
    onSettled: () => {
      queryCache.invalidateQueries({ key: adminKeys.teams() })
    },
  })
}
