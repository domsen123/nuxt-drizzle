import { useQuery } from '@pinia/colada'
import { permissionsApi } from '../api/permissions.api'
import { permissionsKeys } from '../api/permissions.keys'

export const usePermissions = () => {
  const { isAuthenticated } = useSession()

  const query = useQuery({
    key: permissionsKeys.my(),
    query: () => permissionsApi.getMyPermissions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: () => isAuthenticated.value,
  })

  const globalPermissions = computed(() =>
    new Set(query.data.value?.global ?? []),
  )

  const isGlobalAdmin = computed(() =>
    globalPermissions.value.has('platform:admin'),
  )

  const hasGlobalPermission = (permission: string) =>
    globalPermissions.value.has(permission)

  const hasOrgPermission = (orgId: string, permission: string) =>
    query.data.value?.organisations[orgId]?.includes(permission) ?? false

  const hasTeamPermission = (teamId: string, permission: string) =>
    query.data.value?.teams[teamId]?.includes(permission) ?? false

  return {
    ...query,
    globalPermissions,
    isGlobalAdmin,
    hasGlobalPermission,
    hasOrgPermission,
    hasTeamPermission,
  }
}
