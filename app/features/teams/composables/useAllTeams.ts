import type { AllTeamsQueryParams } from '../api/teams.api'
import { useQuery } from '@pinia/colada'
import { teamsApi } from '../api/teams.api'
import { teamsKeys } from '../api/teams.keys'

export const useAllTeams = (params: MaybeRefOrGetter<AllTeamsQueryParams>) => {
  const query = useQuery({
    key: () => teamsKeys.allTeams(toValue(params)),
    query: () => teamsApi.getAllTeams(toValue(params)),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const teams = computed(() => query.data.value?.teams ?? [])
  const total = computed(() => query.data.value?.total ?? 0)

  return {
    ...query,
    teams,
    total,
  }
}
