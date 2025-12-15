import type { UpdateTeamInput } from '../types/teams.types'
import { useMutation, useQueryCache } from '@pinia/colada'
import { useTeamsApi } from '../api/teams.api'
import { teamsKeys } from '../api/teams.keys'

export const useUpdateTeamById = () => {
  const queryCache = useQueryCache()
  const teamsApi = useTeamsApi()

  return useMutation({
    mutation: ({ teamId, data }: { teamId: string, data: UpdateTeamInput }) =>
      teamsApi.updateTeamById(teamId, data),
    onSettled: (_data, _error, variables) => {
      queryCache.invalidateQueries({ key: teamsKeys.teamById(variables.teamId) })
      queryCache.invalidateQueries({ key: teamsKeys.all })
    },
  })
}

export const useDeleteTeamById = () => {
  const queryCache = useQueryCache()
  const teamsApi = useTeamsApi()

  return useMutation({
    mutation: ({ teamId }: { teamId: string }) =>
      teamsApi.deleteTeamById(teamId),
    onSettled: () => {
      queryCache.invalidateQueries({ key: teamsKeys.all })
    },
  })
}
