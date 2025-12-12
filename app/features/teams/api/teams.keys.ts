import type { AllTeamsQueryParams } from './teams.api'

export const teamsKeys = {
  all: ['teams'] as const,
  // Org-scoped keys (existing)
  teams: (organisationId: string) => [...teamsKeys.all, 'list', organisationId] as const,
  team: (organisationId: string, teamId: string) => [...teamsKeys.all, 'detail', organisationId, teamId] as const,
  teamMembers: (organisationId: string, teamId: string) => [...teamsKeys.all, 'members', organisationId, teamId] as const,
  eligibleMembers: (organisationId: string, teamId: string) => [...teamsKeys.all, 'eligible', organisationId, teamId] as const,
  // Standalone keys (new)
  allTeams: (params?: AllTeamsQueryParams) => [...teamsKeys.all, 'all', params ?? {}] as const,
  teamById: (teamId: string) => [...teamsKeys.all, 'byId', teamId] as const,
  teamMembersById: (teamId: string) => [...teamsKeys.all, 'membersById', teamId] as const,
  eligibleMembersById: (teamId: string) => [...teamsKeys.all, 'eligibleById', teamId] as const,
}
