import type {
  AddTeamMemberInput,
  CreateTeamInput,
  EligibleMembersResponse,
  TeamMemberResponse,
  TeamMembersResponse,
  TeamResponse,
  TeamsResponse,
  UpdateTeamInput,
} from '../types/teams.types'

export const teamsApi = {
  // Team CRUD
  getTeams: (organisationId: string): Promise<TeamsResponse> =>
    $fetch(`/api/admin/organisations/${organisationId}/teams`),

  getTeam: (organisationId: string, teamId: string): Promise<TeamResponse> =>
    $fetch(`/api/admin/organisations/${organisationId}/teams/${teamId}`),

  createTeam: (organisationId: string, data: CreateTeamInput): Promise<TeamResponse> =>
    $fetch(`/api/admin/organisations/${organisationId}/teams`, {
      method: 'POST',
      body: data,
    }),

  updateTeam: (organisationId: string, teamId: string, data: UpdateTeamInput): Promise<TeamResponse> =>
    $fetch(`/api/admin/organisations/${organisationId}/teams/${teamId}`, {
      method: 'PUT',
      body: data,
    }),

  deleteTeam: (organisationId: string, teamId: string): Promise<{ success: boolean }> =>
    $fetch(`/api/admin/organisations/${organisationId}/teams/${teamId}`, {
      method: 'DELETE',
    }),

  // Team Members
  getTeamMembers: (organisationId: string, teamId: string): Promise<TeamMembersResponse> =>
    $fetch(`/api/admin/organisations/${organisationId}/teams/${teamId}/members`),

  addTeamMember: (organisationId: string, teamId: string, data: AddTeamMemberInput): Promise<TeamMemberResponse> =>
    $fetch(`/api/admin/organisations/${organisationId}/teams/${teamId}/members`, {
      method: 'POST',
      body: data,
    }),

  removeTeamMember: (organisationId: string, teamId: string, userId: string): Promise<{ success: boolean }> =>
    $fetch(`/api/admin/organisations/${organisationId}/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    }),

  getEligibleMembers: (organisationId: string, teamId: string): Promise<EligibleMembersResponse> =>
    $fetch(`/api/admin/organisations/${organisationId}/teams/${teamId}/eligible-members`),
}
