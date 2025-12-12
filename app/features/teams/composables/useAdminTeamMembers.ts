import { useQuery } from '@pinia/colada'
import { teamsApi } from '../api/teams.api'
import { teamsKeys } from '../api/teams.keys'

export const useAdminTeamMembers = (
  organisationId: MaybeRefOrGetter<string>,
  teamId: MaybeRefOrGetter<string>,
) => {
  const query = useQuery({
    key: () => teamsKeys.teamMembers(toValue(organisationId), toValue(teamId)),
    query: () => teamsApi.getTeamMembers(toValue(organisationId), toValue(teamId)),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const members = computed(() => query.data.value?.members ?? [])
  const total = computed(() => query.data.value?.total ?? 0)

  return {
    ...query,
    members,
    total,
  }
}
