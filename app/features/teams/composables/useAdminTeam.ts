import { useQuery } from '@pinia/colada'
import { teamsApi } from '../api/teams.api'
import { teamsKeys } from '../api/teams.keys'

export const useAdminTeam = (
  organisationId: MaybeRefOrGetter<string>,
  teamId: MaybeRefOrGetter<string>,
) => {
  const query = useQuery({
    key: () => teamsKeys.team(toValue(organisationId), toValue(teamId)),
    query: () => teamsApi.getTeam(toValue(organisationId), toValue(teamId)),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const team = computed(() => query.data.value?.team ?? null)

  return {
    ...query,
    team,
  }
}
