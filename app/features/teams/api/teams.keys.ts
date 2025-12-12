export const teamsKeys = {
  all: ['teams'] as const,
  teams: (organisationId: string) => [...teamsKeys.all, 'list', organisationId] as const,
  team: (organisationId: string, teamId: string) => [...teamsKeys.all, 'detail', organisationId, teamId] as const,
  teamMembers: (organisationId: string, teamId: string) => [...teamsKeys.all, 'members', organisationId, teamId] as const,
  eligibleMembers: (organisationId: string, teamId: string) => [...teamsKeys.all, 'eligible', organisationId, teamId] as const,
}
