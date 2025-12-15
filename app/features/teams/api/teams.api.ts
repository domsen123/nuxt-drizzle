import type {
  AddTeamMemberInput,
  AllTeamsResponse,
  CreateTeamInput,
  EligibleMembersResponse,
  TeamMemberResponse,
  TeamMembersResponse,
  TeamResponse,
  TeamsResponse,
  TeamWithOrganisationResponse,
  UpdateTeamInput,
} from '../types/teams.types'

export interface AllTeamsQueryParams {
  organisationId?: string
  search?: string
  sort?: string[]
  limit?: number
  offset?: number
}

export const useTeamsApi = () => {
  const { $api } = useNuxtApp()

  return {
    // Org-scoped routes (for listing and creating teams within an organisation)
    getTeams: (organisationId: string): Promise<TeamsResponse> =>
      $api(`/api/admin/organisations/${organisationId}/teams`),

    createTeam: (organisationId: string, data: CreateTeamInput): Promise<TeamResponse> =>
      $api(`/api/admin/organisations/${organisationId}/teams`, {
        method: 'POST',
        body: data,
      }),

    // Standalone Team Routes (for team detail pages)
    getAllTeams: (params?: AllTeamsQueryParams): Promise<AllTeamsResponse> =>
      $api('/api/admin/teams', { params }),

    getTeamById: (teamId: string): Promise<TeamWithOrganisationResponse> =>
      $api(`/api/admin/teams/${teamId}`),

    updateTeamById: (teamId: string, data: UpdateTeamInput): Promise<TeamResponse> =>
      $api(`/api/admin/teams/${teamId}`, { method: 'PUT', body: data }),

    deleteTeamById: (teamId: string): Promise<{ success: boolean }> =>
      $api(`/api/admin/teams/${teamId}`, { method: 'DELETE' }),

    // Standalone Team Members Routes
    getTeamMembersById: (teamId: string): Promise<TeamMembersResponse> =>
      $api(`/api/admin/teams/${teamId}/members`),

    addTeamMemberById: (teamId: string, data: AddTeamMemberInput): Promise<TeamMemberResponse> =>
      $api(`/api/admin/teams/${teamId}/members`, { method: 'POST', body: data }),

    removeTeamMemberById: (teamId: string, userId: string): Promise<{ success: boolean }> =>
      $api(`/api/admin/teams/${teamId}/members/${userId}`, { method: 'DELETE' }),

    getEligibleMembersById: (teamId: string): Promise<EligibleMembersResponse> =>
      $api(`/api/admin/teams/${teamId}/eligible-members`),
  }
}
