import type {
  AdminOrganisationResponse,
  AdminOrganisationsQueryParams,
  AdminOrganisationsResponse,
  AdminUserResponse,
  AdminUsersQueryParams,
  AdminUsersResponse,
  CreateOrganisationInput,
  UpdateOrganisationInput,
  UpdateUserInput,
} from '../types/admin.types'

/**
 * Admin API wrapper that uses useRequestFetch for SSR cookie forwarding.
 * Must be called within a composable or component setup context.
 */
export const useAdminApi = () => {
  const fetch = useRequestFetch()

  return {
    getOrganisations: (params?: AdminOrganisationsQueryParams): Promise<AdminOrganisationsResponse> =>
      fetch('/api/admin/organisations', { query: params }),

    getOrganisation: (id: string): Promise<AdminOrganisationResponse> =>
      fetch(`/api/admin/organisations/${id}`),

    createOrganisation: (data: CreateOrganisationInput): Promise<AdminOrganisationResponse> =>
      fetch('/api/admin/organisations', {
        method: 'POST',
        body: data,
      }),

    updateOrganisation: (id: string, data: UpdateOrganisationInput): Promise<AdminOrganisationResponse> =>
      fetch(`/api/admin/organisations/${id}`, {
        method: 'PUT',
        body: data,
      }),

    // Users
    getUsers: (params?: AdminUsersQueryParams): Promise<AdminUsersResponse> =>
      fetch('/api/admin/users', { query: params }),

    getUser: (id: string): Promise<AdminUserResponse> =>
      fetch(`/api/admin/users/${id}`),

    updateUser: (id: string, data: UpdateUserInput): Promise<AdminUserResponse> =>
      fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: data,
      }),

    deleteUser: (id: string): Promise<{ success: boolean }> =>
      fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      }),
  }
}
