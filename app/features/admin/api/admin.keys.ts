import type { AdminUsersQueryParams } from '../types/admin.types'

export const adminKeys = {
  all: ['admin'] as const,
  organisations: () => [...adminKeys.all, 'organisations'] as const,
  organisation: (id: string) => [...adminKeys.all, 'organisation', id] as const,
  users: (params?: AdminUsersQueryParams) => params
    ? [...adminKeys.all, 'users', params] as const
    : [...adminKeys.all, 'users'] as const,
  user: (id: string) => [...adminKeys.all, 'user', id] as const,
}
