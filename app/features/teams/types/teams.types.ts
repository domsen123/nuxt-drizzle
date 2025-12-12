export interface Team {
  id: string
  name: string
  organisationId: string
  createdAt: string
  updatedAt: string
}

// Team Member Types
export interface TeamMemberUser {
  id: string
  email: string
  name: string | null
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: 'member' | 'lead'
  createdAt: string
  updatedAt: string
  user: TeamMemberUser
}

// API Responses
export interface TeamsResponse {
  teams: Team[]
  total: number
}

export interface TeamResponse {
  team: Team
}

export interface TeamMembersResponse {
  members: TeamMember[]
  total: number
}

export interface TeamMemberResponse {
  member: TeamMember
}

export interface EligibleMembersResponse {
  members: TeamMemberUser[]
}

// API Inputs
export interface CreateTeamInput {
  name: string
}

export interface UpdateTeamInput {
  name: string
}

export interface AddTeamMemberInput {
  userId: string
}
