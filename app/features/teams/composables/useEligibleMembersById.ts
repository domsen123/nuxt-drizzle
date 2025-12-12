import { useQuery } from '@pinia/colada'
import { teamsApi } from '../api/teams.api'
import { teamsKeys } from '../api/teams.keys'

export const useEligibleMembersById = (teamId: MaybeRefOrGetter<string>) => {
  const query = useQuery({
    key: () => teamsKeys.eligibleMembersById(toValue(teamId)),
    query: () => teamsApi.getEligibleMembersById(toValue(teamId)),
    staleTime: 1 * 60 * 1000, // 1 minute (shorter because it changes when members are added)
  })

  const eligibleMembers = computed(() => query.data.value?.members ?? [])

  return {
    ...query,
    eligibleMembers,
  }
}
