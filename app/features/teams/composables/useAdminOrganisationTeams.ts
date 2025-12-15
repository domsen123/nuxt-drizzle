import { useQuery } from '@pinia/colada'
import { useTeamsApi } from '../api/teams.api'
import { teamsKeys } from '../api/teams.keys'

export const useAdminOrganisationTeams = (organisationId: MaybeRefOrGetter<string>) => {
  const teamsApi = useTeamsApi()

  const query = useQuery({
    key: () => teamsKeys.teams(toValue(organisationId)),
    query: () => teamsApi.getTeams(toValue(organisationId)),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const teams = computed(() =>
    query.data.value?.teams ?? [],
  )

  const total = computed(() =>
    query.data.value?.total ?? 0,
  )

  return {
    ...query,
    teams,
    total,
  }
}
