import type {
  AdminOrganisationResponse,
  AdminOrganisationsResponse,
  CreateOrganisationInput,
  UpdateOrganisationInput,
} from '../types/admin.types'

export const adminApi = {
  getOrganisations: (): Promise<AdminOrganisationsResponse> =>
    $fetch('/api/admin/organisations'),

  getOrganisation: (id: string): Promise<AdminOrganisationResponse> =>
    $fetch(`/api/admin/organisations/${id}`),

  createOrganisation: (data: CreateOrganisationInput): Promise<AdminOrganisationResponse> =>
    $fetch('/api/admin/organisations', {
      method: 'POST',
      body: data,
    }),

  updateOrganisation: (id: string, data: UpdateOrganisationInput): Promise<AdminOrganisationResponse> =>
    $fetch(`/api/admin/organisations/${id}`, {
      method: 'PUT',
      body: data,
    }),
}
