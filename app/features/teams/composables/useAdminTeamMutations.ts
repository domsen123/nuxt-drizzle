import type { CreateTeamInput } from '../types/teams.types'
import { useMutation, useQueryCache } from '@pinia/colada'
import { useTeamsApi } from '../api/teams.api'
import { teamsKeys } from '../api/teams.keys'

export const useCreateTeam = () => {
  const queryCache = useQueryCache()
  const teamsApi = useTeamsApi()

  return useMutation({
    mutation: ({ organisationId, data }: { organisationId: string, data: CreateTeamInput }) =>
      teamsApi.createTeam(organisationId, data),
    onSettled: (_data, _error, variables) => {
      queryCache.invalidateQueries({ key: teamsKeys.teams(variables.organisationId) })
      queryCache.invalidateQueries({ key: teamsKeys.all })
    },
  })
}
