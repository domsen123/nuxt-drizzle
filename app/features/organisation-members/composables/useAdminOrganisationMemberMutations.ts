import type { AddMemberInput, InviteMemberInput, UpdateMemberRoleInput } from '../types/organisation-members.types'
import { useMutation, useQueryCache } from '@pinia/colada'
import { organisationMembersApi } from '../api/organisation-members.api'
import { organisationMembersKeys } from '../api/organisation-members.keys'

export const useAddOrganisationMember = () => {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: ({ organisationId, data }: { organisationId: string, data: AddMemberInput }) =>
      organisationMembersApi.addMember(organisationId, data),
    onSettled: (_data, _error, variables) => {
      queryCache.invalidateQueries({ key: organisationMembersKeys.members(variables.organisationId) })
    },
  })
}

export const useUpdateOrganisationMemberRole = () => {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: ({ organisationId, userId, data }: { organisationId: string, userId: string, data: UpdateMemberRoleInput }) =>
      organisationMembersApi.updateMemberRole(organisationId, userId, data),
    onSettled: (_data, _error, variables) => {
      queryCache.invalidateQueries({ key: organisationMembersKeys.members(variables.organisationId) })
    },
  })
}

export const useRemoveOrganisationMember = () => {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: ({ organisationId, userId }: { organisationId: string, userId: string }) =>
      organisationMembersApi.removeMember(organisationId, userId),
    onSettled: (_data, _error, variables) => {
      queryCache.invalidateQueries({ key: organisationMembersKeys.members(variables.organisationId) })
    },
  })
}

export const useInviteOrganisationMember = () => {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: ({ organisationId, data }: { organisationId: string, data: InviteMemberInput }) =>
      organisationMembersApi.inviteMember(organisationId, data),
    onSettled: (_data, _error, variables) => {
      queryCache.invalidateQueries({ key: organisationMembersKeys.members(variables.organisationId) })
    },
  })
}
