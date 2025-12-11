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
  },
} as const
