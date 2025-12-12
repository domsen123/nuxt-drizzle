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

export const teamsApi = {
  // Org-scoped routes (for listing and creating teams within an organisation)
  getTeams: (organisationId: string): Promise<TeamsResponse> =>
    $fetch(`/api/admin/organisations/${organisationId}/teams`),

  createTeam: (organisationId: string, data: CreateTeamInput): Promise<TeamResponse> =>
    $fetch(`/api/admin/organisations/${organisationId}/teams`, {
      method: 'POST',
      body: data,
    }),

  // Standalone Team Routes (for team detail pages)
  getAllTeams: (params?: AllTeamsQueryParams): Promise<AllTeamsResponse> =>
    $fetch('/api/admin/teams', { params }),

  getTeamById: (teamId: string): Promise<TeamWithOrganisationResponse> =>
    $fetch(`/api/admin/teams/${teamId}`),

  updateTeamById: (teamId: string, data: UpdateTeamInput): Promise<TeamResponse> =>
    $fetch(`/api/admin/teams/${teamId}`, { method: 'PUT', body: data }),

  deleteTeamById: (teamId: string): Promise<{ success: boolean }> =>
    $fetch(`/api/admin/teams/${teamId}`, { method: 'DELETE' }),

  // Standalone Team Members Routes
  getTeamMembersById: (teamId: string): Promise<TeamMembersResponse> =>
    $fetch(`/api/admin/teams/${teamId}/members`),

  addTeamMemberById: (teamId: string, data: AddTeamMemberInput): Promise<TeamMemberResponse> =>
    $fetch(`/api/admin/teams/${teamId}/members`, { method: 'POST', body: data }),

  removeTeamMemberById: (teamId: string, userId: string): Promise<{ success: boolean }> =>
    $fetch(`/api/admin/teams/${teamId}/members/${userId}`, { method: 'DELETE' }),

  getEligibleMembersById: (teamId: string): Promise<EligibleMembersResponse> =>
    $fetch(`/api/admin/teams/${teamId}/eligible-members`),
}
