import config from '../../utils/config'

export const OAUTH_STATE_COOKIE = 'oauth_state'
export const OAUTH_VERIFIER_COOKIE = 'oauth_verifier'
export const OAUTH_REDIRECT_COOKIE = 'oauth_redirect'

const COOKIE_MAX_AGE_SECONDS = 600 // 10 minutes

/**
 * Short-lived cookies that carry state, PKCE verifier and redirect target
 * between the authorize and callback requests. `deleteCookie` overrides
 * `maxAge`, so the same options serve both setting and clearing.
 */
export const oauthCookieOptions = {
  httpOnly: true,
  secure: config.site.env === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: COOKIE_MAX_AGE_SECONDS,
}

/** Only internal paths pass: starts with `/`, but not with `//`. */
export const sanitizeInternalPath = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//'))
    return undefined
  return value
}
