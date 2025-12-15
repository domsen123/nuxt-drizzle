export interface ValidateInvitationResponse {
  valid: boolean
  email?: string
  organisationName?: string
}

export interface AcceptInvitationInput {
  password: string
  name?: string
}

export interface AcceptInvitationResponse {
  success: boolean
  user: { id: string, email: string, name: string | null }
  organisationId: string
  organisationName: string
}

export const useOrganisationInvitationsApi = () => {
  const { $api } = useNuxtApp()

  return {
    validateInvitation: (token: string): Promise<ValidateInvitationResponse> =>
      $api(`/api/auth/invitations/${token}/validate`),

    acceptInvitation: (token: string, data: AcceptInvitationInput): Promise<AcceptInvitationResponse> =>
      $api(`/api/auth/invitations/${token}/accept`, {
        method: 'POST',
        body: data,
      }),
  }
}
