import type { AdminOrganisationsQueryParams, AdminTeamsQueryParams, AdminUsersQueryParams } from '../types/admin.types'

export const adminKeys = {
  all: ['admin'] as const,
  organisations: (params?: AdminOrganisationsQueryParams) => params
    ? [...adminKeys.all, 'organisations', params] as const
    : [...adminKeys.all, 'organisations'] as const,
  organisation: (id: string) => [...adminKeys.all, 'organisation', id] as const,
  users: (params?: AdminUsersQueryParams) => params
    ? [...adminKeys.all, 'users', params] as const
    : [...adminKeys.all, 'users'] as const,
  user: (id: string) => [...adminKeys.all, 'user', id] as const,
  userRoles: (userId: string) => [...adminKeys.all, 'user', userId, 'roles'] as const,
  teams: (params?: AdminTeamsQueryParams) => params
    ? [...adminKeys.all, 'teams', params] as const
    : [...adminKeys.all, 'teams'] as const,
}
