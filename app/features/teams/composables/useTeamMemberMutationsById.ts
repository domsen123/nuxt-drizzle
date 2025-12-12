import type { AddTeamMemberInput } from '../types/teams.types'
import { useMutation, useQueryCache } from '@pinia/colada'
import { teamsApi } from '../api/teams.api'
import { teamsKeys } from '../api/teams.keys'

export const useAddTeamMemberById = () => {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: ({ teamId, data }: { teamId: string, data: AddTeamMemberInput }) =>
      teamsApi.addTeamMemberById(teamId, data),
    onSettled: (_data, _error, variables) => {
      queryCache.invalidateQueries({ key: teamsKeys.teamMembersById(variables.teamId) })
      queryCache.invalidateQueries({ key: teamsKeys.eligibleMembersById(variables.teamId) })
    },
  })
}

export const useRemoveTeamMemberById = () => {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: ({ teamId, userId }: { teamId: string, userId: string }) =>
      teamsApi.removeTeamMemberById(teamId, userId),
    onSettled: (_data, _error, variables) => {
      queryCache.invalidateQueries({ key: teamsKeys.teamMembersById(variables.teamId) })
      queryCache.invalidateQueries({ key: teamsKeys.eligibleMembersById(variables.teamId) })
    },
  })
}
