export interface AdminOrganisation {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export interface AdminOrganisationsResponse {
  organisations: AdminOrganisation[]
  total: number
}

export interface AdminOrganisationResponse {
  organisation: AdminOrganisation
}

export interface CreateOrganisationInput {
  name: string
  slug: string
}

export interface UpdateOrganisationInput {
  name: string
  slug: string
}

// User types
export interface AdminUser {
  id: string
  email: string
  name: string | null
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminUsersResponse {
  users: AdminUser[]
  total: number
}

export interface AdminUserResponse {
  user: AdminUser
}

export interface UpdateUserInput {
  name: string | null
  email: string
  emailVerified: boolean
}

export interface AdminUsersQueryParams {
  search?: string
  sort?: string[]
  limit?: number
  offset?: number
}

export interface AdminOrganisationsQueryParams {
  search?: string
  sort?: string[]
  limit?: number
  offset?: number
}

// Team types
export interface AdminTeam {
  id: string
  name: string
  organisationId: string
  createdAt: string
  updatedAt: string
  organisation: {
    id: string
    name: string
  }
}

export interface AdminTeamsResponse {
  teams: AdminTeam[]
  total: number
}

export interface AdminTeamsQueryParams {
  search?: string
  sort?: string[]
  limit?: number
  offset?: number
  organisationId?: string
}

// User roles types
export interface AdminUserRolePermission {
  permission: string
}

export interface AdminUserRole {
  id: string
  name: string
  description: string | null
  scope: string
  isSystem: boolean
  isDefault: boolean
  permissions: AdminUserRolePermission[]
}

export interface AdminUserRolesResponse {
  roles: AdminUserRole[]
}
