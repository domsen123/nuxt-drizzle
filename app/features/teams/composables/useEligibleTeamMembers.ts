import { useQuery } from '@pinia/colada'
import { teamsApi } from '../api/teams.api'
import { teamsKeys } from '../api/teams.keys'

export const useEligibleTeamMembers = (
  organisationId: MaybeRefOrGetter<string>,
  teamId: MaybeRefOrGetter<string>,
) => {
  const query = useQuery({
    key: () => teamsKeys.eligibleMembers(toValue(organisationId), toValue(teamId)),
    query: () => teamsApi.getEligibleMembers(toValue(organisationId), toValue(teamId)),
    staleTime: 1 * 60 * 1000, // 1 minute (shorter because it changes when members are added)
  })

  const eligibleMembers = computed(() => query.data.value?.members ?? [])

  return {
    ...query,
    eligibleMembers,
  }
}
