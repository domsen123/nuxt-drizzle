export interface OAuthProviderButton {
  label: string
  icon: string
}

/**
 * Button metadata for OAuth providers served by `GET /api/auth/providers`.
 * Brand names stay untranslated. Providers without an entry are not rendered.
 */
export const OAUTH_PROVIDER_BUTTONS: Record<string, OAuthProviderButton> = {
  microsoft: { label: 'Microsoft', icon: 'i-simple-icons-microsoft' },
}
