import type {
  AddTeamMemberInput,
  AdminEligibleMembersResponse,
  AdminOrganisationResponse,
  AdminOrganisationsQueryParams,
  AdminOrganisationsResponse,
  AdminTeam,
  AdminTeamMember,
  AdminTeamMembersResponse,
  AdminTeamResponse,
  AdminTeamsQueryParams,
  AdminTeamsResponse,
  AdminUserResponse,
  AdminUserRolesResponse,
  AdminUsersQueryParams,
  AdminUsersResponse,
  CreateOrganisationInput,
  CreateTeamInput,
  UpdateOrganisationInput,
  UpdateTeamInput,
  UpdateUserInput,
} from '../types/admin.types'

/**
 * Admin API wrapper using global $api for SSR cookie forwarding.
 * Must be called within a composable or component setup context.
 */
export const useAdminApi = () => {
  const { $api } = useNuxtApp()

  return {
    getOrganisations: (params?: AdminOrganisationsQueryParams): Promise<AdminOrganisationsResponse> =>
      $api('/api/admin/organisations', { query: params }),

    getOrganisation: (id: string): Promise<AdminOrganisationResponse> =>
      $api(`/api/admin/organisations/${id}`),

    createOrganisation: (data: CreateOrganisationInput): Promise<AdminOrganisationResponse> =>
      $api('/api/admin/organisations', {
        method: 'POST',
        body: data,
      }),

    updateOrganisation: (id: string, data: UpdateOrganisationInput): Promise<AdminOrganisationResponse> =>
      $api(`/api/admin/organisations/${id}`, {
        method: 'PUT',
        body: data,
      }),

    // Users
    getUsers: (params?: AdminUsersQueryParams): Promise<AdminUsersResponse> =>
      $api('/api/admin/users', { query: params }),

    getUser: (id: string): Promise<AdminUserResponse> =>
      $api(`/api/admin/users/${id}`),

    updateUser: (id: string, data: UpdateUserInput): Promise<AdminUserResponse> =>
      $api(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: data,
      }),

    deleteUser: (id: string): Promise<{ success: boolean }> =>
      $api(`/api/admin/users/${id}`, {
        method: 'DELETE',
      }),

    getUserRoles: (userId: string): Promise<AdminUserRolesResponse> =>
      $api(`/api/admin/users/${userId}/roles`),

    // Teams
    getTeams: (params?: AdminTeamsQueryParams): Promise<AdminTeamsResponse> =>
      $api('/api/admin/teams', { query: params }),

    getOrganisationTeams: (organisationId: string): Promise<{ teams: AdminTeam[], total: number }> =>
      $api(`/api/admin/organisations/${organisationId}/teams`),

    getTeam: (id: string): Promise<AdminTeamResponse> =>
      $api(`/api/admin/teams/${id}`),

    createTeam: (organisationId: string, data: CreateTeamInput): Promise<AdminTeamResponse> =>
      $api(`/api/admin/organisations/${organisationId}/teams`, {
        method: 'POST',
        body: data,
      }),

    updateTeam: (id: string, data: UpdateTeamInput): Promise<AdminTeamResponse> =>
      $api(`/api/admin/teams/${id}`, {
        method: 'PUT',
        body: data,
      }),

    deleteTeam: (id: string): Promise<{ success: boolean }> =>
      $api(`/api/admin/teams/${id}`, { method: 'DELETE' }),

    // Team Members
    getTeamMembers: (teamId: string): Promise<AdminTeamMembersResponse> =>
      $api(`/api/admin/teams/${teamId}/members`),

    addTeamMember: (teamId: string, data: AddTeamMemberInput): Promise<{ member: AdminTeamMember }> =>
      $api(`/api/admin/teams/${teamId}/members`, {
        method: 'POST',
        body: data,
      }),

    removeTeamMember: (teamId: string, userId: string): Promise<{ success: boolean }> =>
      $api(`/api/admin/teams/${teamId}/members/${userId}`, { method: 'DELETE' }),

    getTeamEligibleMembers: (teamId: string): Promise<AdminEligibleMembersResponse> =>
      $api(`/api/admin/teams/${teamId}/eligible-members`),
  }
}
