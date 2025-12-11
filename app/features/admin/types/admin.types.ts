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
