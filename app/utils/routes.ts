export const ROUTES = {
  start: '/',
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  legal: {
    termsOfService: '/terms-of-service',
    privacyPolicy: '/privacy-policy',
  },
  admin: {
    home: '/admin',
    organisations: '/admin/organisations',
    organisationCreate: '/admin/organisations/create',
    organisationEdit: (id: string) => `/admin/organisations/${id}`,
    organisationMembers: (id: string) => `/admin/organisations/${id}/members`,
    organisationTeams: (id: string) => `/admin/organisations/${id}/teams`,
    teamDetail: (orgId: string, teamId: string) => `/admin/organisations/${orgId}/teams/${teamId}`,
    teamMembers: (orgId: string, teamId: string) => `/admin/organisations/${orgId}/teams/${teamId}/members`,
    users: '/admin/users',
    userEdit: (id: string) => `/admin/users/${id}`,
  },
  settings: {
    profile: '/settings',
    security: '/settings/security',
  },
  errors: {
    unauthorized: '/401',
  },
} as const
