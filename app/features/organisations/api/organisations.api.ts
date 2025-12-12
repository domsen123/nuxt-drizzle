import type {
  CreateOrganisationInput,
  OrganisationWithOwnerResponse,
} from '../types/organisations.types'

export const organisationsApi = {
  /**
   * Create a new organisation (user-facing endpoint)
   * The current user will automatically become the Owner
   */
  create: (data: CreateOrganisationInput): Promise<OrganisationWithOwnerResponse> =>
    $fetch('/api/organisations', {
      method: 'POST',
      body: data,
    }),
}
