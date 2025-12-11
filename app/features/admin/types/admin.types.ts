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
}
