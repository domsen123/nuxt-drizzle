import { useQuery } from '@pinia/colada'
import { teamsApi } from '../api/teams.api'
import { teamsKeys } from '../api/teams.keys'

export const useTeamMembersById = (teamId: MaybeRefOrGetter<string>) => {
  const query = useQuery({
    key: () => teamsKeys.teamMembersById(toValue(teamId)),
    query: () => teamsApi.getTeamMembersById(toValue(teamId)),
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
