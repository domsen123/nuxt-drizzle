import type { AddTeamMemberInput } from '../types/teams.types'
import { useMutation, useQueryCache } from '@pinia/colada'
import { teamsApi } from '../api/teams.api'
import { teamsKeys } from '../api/teams.keys'

export const useAddTeamMember = () => {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: ({ organisationId, teamId, data }: { organisationId: string, teamId: string, data: AddTeamMemberInput }) =>
      teamsApi.addTeamMember(organisationId, teamId, data),
    onSettled: (_data, _error, variables) => {
      queryCache.invalidateQueries({ key: teamsKeys.teamMembers(variables.organisationId, variables.teamId) })
      queryCache.invalidateQueries({ key: teamsKeys.eligibleMembers(variables.organisationId, variables.teamId) })
    },
  })
}

export const useRemoveTeamMember = () => {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: ({ organisationId, teamId, userId }: { organisationId: string, teamId: string, userId: string }) =>
      teamsApi.removeTeamMember(organisationId, teamId, userId),
    onSettled: (_data, _error, variables) => {
      queryCache.invalidateQueries({ key: teamsKeys.teamMembers(variables.organisationId, variables.teamId) })
      queryCache.invalidateQueries({ key: teamsKeys.eligibleMembers(variables.organisationId, variables.teamId) })
    },
  })
}
