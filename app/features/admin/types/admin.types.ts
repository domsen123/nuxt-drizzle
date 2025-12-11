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
