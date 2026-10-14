import { defineEventHandler, deleteCookie, getCookie, getQuery, getRouterParam, sendRedirect } from 'nuxt/server'
import { OAUTH_REDIRECT_COOKIE, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, oauthCookieOptions, sanitizeInternalPath } from '~~/server/features/auth/oauth-cookies.utils'
import { OAuthFlowError } from '~~/server/features/auth/oauth.service'
import { setSessionCookie } from '~~/server/features/auth/session.utils'
import { container } from '~~/server/utils/container'

const queryString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined

/**
 * Finishes the OAuth flow. Never answers with a JSON error: every failure
 * redirects to `/auth/sign-in?error=<code>`.
 */
export default defineEventHandler(async (event) => {
  const provider = getRouterParam(event, 'provider', { decode: true })
  const query = getQuery(event)

  const expectedState = getCookie(event, OAUTH_STATE_COOKIE)
  const verifier = getCookie(event, OAUTH_VERIFIER_COOKIE)
  const redirectTarget = sanitizeInternalPath(getCookie(event, OAUTH_REDIRECT_COOKIE)) ?? '/'

  deleteCookie(event, OAUTH_STATE_COOKIE, oauthCookieOptions)
  deleteCookie(event, OAUTH_VERIFIER_COOKIE, oauthCookieOptions)
  deleteCookie(event, OAUTH_REDIRECT_COOKIE, oauthCookieOptions)

  if (!provider || queryString(query.error)) {
    return sendRedirect(event, '/auth/sign-in?error=oauth_failed', 302)
  }

  try {
    const currentUser = event.context.user
    const anonymousUser = currentUser?.authProvider === 'anonymous' ? { id: currentUser.id } : undefined

    const result = await container.oauthService.handleCallback(provider, {
      code: queryString(query.code),
      state: queryString(query.state),
      expectedState,
      verifier,
      anonymousUser,
    })

    setSessionCookie(event, result.token, result.session.expiresAt)

    return sendRedirect(event, redirectTarget, 302)
  }
  catch (error) {
    const code = error instanceof OAuthFlowError ? error.code : 'oauth_failed'
    console.error('[OAuth] Callback failed:', error)
    return sendRedirect(event, `/auth/sign-in?error=${code}`, 302)
  }
})
