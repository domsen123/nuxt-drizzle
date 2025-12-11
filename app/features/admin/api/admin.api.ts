import type { AdminOrganisationsResponse } from '../types/admin.types'

export const adminApi = {
  getOrganisations: (): Promise<AdminOrganisationsResponse> =>
    $fetch('/api/admin/organisations'),
}
