import type { CreateTeamInput, UpdateTeamInput } from '../types/teams.types'
import { useMutation, useQueryCache } from '@pinia/colada'
import { teamsApi } from '../api/teams.api'
import { teamsKeys } from '../api/teams.keys'

export const useCreateTeam = () => {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: ({ organisationId, data }: { organisationId: string, data: CreateTeamInput }) =>
      teamsApi.createTeam(organisationId, data),
    onSettled: (_data, _error, variables) => {
      queryCache.invalidateQueries({ key: teamsKeys.teams(variables.organisationId) })
    },
  })
}

export const useUpdateTeam = () => {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: ({ organisationId, teamId, data }: { organisationId: string, teamId: string, data: UpdateTeamInput }) =>
      teamsApi.updateTeam(organisationId, teamId, data),
    onSettled: (_data, _error, variables) => {
      queryCache.invalidateQueries({ key: teamsKeys.teams(variables.organisationId) })
    },
  })
}

export const useDeleteTeam = () => {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: ({ organisationId, teamId }: { organisationId: string, teamId: string }) =>
      teamsApi.deleteTeam(organisationId, teamId),
    onSettled: (_data, _error, variables) => {
      queryCache.invalidateQueries({ key: teamsKeys.teams(variables.organisationId) })
    },
  })
}
