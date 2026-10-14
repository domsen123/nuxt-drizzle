// API (if needed externally)
export { oauthAuthorizeUrl, useAuthApi } from './api/auth.api'

export { authKeys } from './api/auth.keys'
export { useLogin, useLogout, useRegister } from './composables/useAuthMutations'
// Composables
export { useAuthProviders } from './composables/useAuthProviders'
export { useSession } from './composables/useSession'

// Constants
export { OAUTH_PROVIDER_BUTTONS } from './constants/auth-providers.constants'
export type { OAuthProviderButton } from './constants/auth-providers.constants'
// Types
export type { AuthResponse, AuthUser, LoginCredentials, PublicAuthProvider, PublicAuthProvidersResponse, RegisterCredentials, RegistrationMode, SessionResponse } from './types/auth.types'
