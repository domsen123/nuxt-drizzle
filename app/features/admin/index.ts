// API
export { useAdminApi } from './api/admin.api'
export { adminKeys } from './api/admin.keys'

// Organisation Composables
export { useAdminOrganisation } from './composables/useAdminOrganisation'
export { useCreateOrganisation, useUpdateOrganisation } from './composables/useAdminOrganisationMutations'
export { useAdminOrganisations } from './composables/useAdminOrganisations'
export { useAdminOrganisationTeams } from './composables/useAdminOrganisationTeams'

// Team Composables
export { useAdminTeam } from './composables/useAdminTeam'
export { useAdminTeamEligibleMembers } from './composables/useAdminTeamEligibleMembers'
export { useAddTeamMember, useRemoveTeamMember } from './composables/useAdminTeamMemberMutations'
export { useAdminTeamMembers } from './composables/useAdminTeamMembers'
export { useCreateTeam, useDeleteTeam, useUpdateTeam } from './composables/useAdminTeamMutations'
export { useAdminTeams } from './composables/useAdminTeams'

// User Composables
export { useAdminUser } from './composables/useAdminUser'
export { useDeleteUser, useUpdateUser } from './composables/useAdminUserMutations'
export { useAdminUserRoles } from './composables/useAdminUserRoles'
export { useAdminUsers } from './composables/useAdminUsers'

// Types
export type {
  // Team types
  AddTeamMemberInput,
  AdminEligibleMembersResponse,
  // Organisation types
  AdminOrganisation,
  AdminOrganisationResponse,
  AdminOrganisationsQueryParams,
  AdminOrganisationsResponse,
  AdminTeam,
  AdminTeamMember,
  AdminTeamMemberRole,
  AdminTeamMembersResponse,
  AdminTeamMemberUser,
  AdminTeamResponse,
  AdminTeamsQueryParams,
  AdminTeamsResponse,
  // User types
  AdminUser,
  AdminUserResponse,
  AdminUserRole,
  AdminUserRolePermission,
  AdminUserRolesResponse,
  AdminUsersQueryParams,
  AdminUsersResponse,
  CreateOrganisationInput,
  CreateTeamInput,
  UpdateOrganisationInput,
  UpdateTeamInput,
  UpdateUserInput,
} from './types/admin.types'
