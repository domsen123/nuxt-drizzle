// Stats types
export interface AdminStatsResponse {
  totalUsers: number
  verifiedUsers: number
  unverifiedUsers: number
  totalOrganisations: number
  totalTeams: number
  activeSessions: number
}

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

// Team response type (single team)
export interface AdminTeamResponse {
  team: AdminTeam
}

// Team member types
export interface AdminTeamMemberUser {
  id: string
  email: string
  name: string | null
}

export interface AdminTeamMemberRole {
  id: string
  name: string
}

export interface AdminTeamMember {
  id: string
  teamId: string
  userId: string
  role: AdminTeamMemberRole | null
  createdAt: string
  updatedAt: string
  user: AdminTeamMemberUser
}

export interface AdminTeamMembersResponse {
  members: AdminTeamMember[]
  total: number
}

export interface AdminEligibleMembersResponse {
  members: AdminTeamMemberUser[]
}

// Team input types
export interface CreateTeamInput {
  name: string
}

export interface UpdateTeamInput {
  name: string
}

export interface AddTeamMemberInput {
  userId: string
}

// Blog post types
export interface AdminBlogPostAuthor {
  id: string
  name: string | null
  email: string
}

export interface AdminBlogPostTag {
  id: string
  name: string
  slug: string
}

export interface AdminBlogPost {
  id: string
  title: string
  slug: string
  teaser: string | null
  content: string
  published: boolean
  publishedAt: string | null
  authorId: string | null
  author: AdminBlogPostAuthor | null
  tags: AdminBlogPostTag[]
  createdAt: string
  updatedAt: string
}

export interface AdminBlogPostsResponse {
  posts: AdminBlogPost[]
  total: number
}

export interface AdminBlogPostResponse {
  post: AdminBlogPost
}

export interface AdminBlogPostsQueryParams {
  search?: string
  sort?: string[]
  limit?: number
  offset?: number
}

export interface CreateBlogPostInput {
  title: string
  slug: string
  teaser?: string | null
  content: string
  published: boolean
  publishedAt?: string | null
  tagIds: string[]
}

export interface UpdateBlogPostInput {
  title: string
  slug: string
  teaser?: string | null
  content: string
  published: boolean
  publishedAt?: string | null
  tagIds: string[]
}

// Blog tag types
export interface AdminBlogTag {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export interface AdminBlogTagsResponse {
  tags: AdminBlogTag[]
  total: number
}

export interface AdminBlogTagResponse {
  tag: AdminBlogTag
}

export interface AdminBlogTagsQueryParams {
  search?: string
  sort?: string[]
  limit?: number
  offset?: number
}

export interface CreateBlogTagInput {
  name: string
  slug: string
}

export interface UpdateBlogTagInput {
  name: string
  slug: string
}
