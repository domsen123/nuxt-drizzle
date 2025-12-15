import { useQuery } from '@pinia/colada'
import { useTeamsApi } from '../api/teams.api'
import { teamsKeys } from '../api/teams.keys'

export const useTeamById = (teamId: MaybeRefOrGetter<string>) => {
  const teamsApi = useTeamsApi()

  const query = useQuery({
    key: () => teamsKeys.teamById(toValue(teamId)),
    query: () => teamsApi.getTeamById(toValue(teamId)),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const team = computed(() => query.data.value?.team ?? null)

  return {
    ...query,
    team,
  }
}
