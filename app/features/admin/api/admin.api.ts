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
 * Admin API wrapper using global $api for SSR cookie forwarding.
 * Must be called within a composable or component setup context.
 */
export const useAdminApi = () => {
  const { $api } = useNuxtApp()

  return {
    getOrganisations: (params?: AdminOrganisationsQueryParams): Promise<AdminOrganisationsResponse> =>
      $api('/api/admin/organisations', { query: params }),

    getOrganisation: (id: string): Promise<AdminOrganisationResponse> =>
      $api(`/api/admin/organisations/${id}`),

    createOrganisation: (data: CreateOrganisationInput): Promise<AdminOrganisationResponse> =>
      $api('/api/admin/organisations', {
        method: 'POST',
        body: data,
      }),

    updateOrganisation: (id: string, data: UpdateOrganisationInput): Promise<AdminOrganisationResponse> =>
      $api(`/api/admin/organisations/${id}`, {
        method: 'PUT',
        body: data,
      }),

    // Users
    getUsers: (params?: AdminUsersQueryParams): Promise<AdminUsersResponse> =>
      $api('/api/admin/users', { query: params }),

    getUser: (id: string): Promise<AdminUserResponse> =>
      $api(`/api/admin/users/${id}`),

    updateUser: (id: string, data: UpdateUserInput): Promise<AdminUserResponse> =>
      $api(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: data,
      }),

    deleteUser: (id: string): Promise<{ success: boolean }> =>
      $api(`/api/admin/users/${id}`, {
        method: 'DELETE',
      }),
  }
}
