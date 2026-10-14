import { defineEventHandler, getQuery, getRouterParam, sendRedirect, setCookie } from 'nuxt/server'
import { OAUTH_REDIRECT_COOKIE, OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, oauthCookieOptions, sanitizeInternalPath } from '~~/server/features/auth/oauth-cookies.utils'
import { OAuthFlowError } from '~~/server/features/auth/oauth.service'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  const provider = getRouterParam(event, 'provider', { decode: true })
  const redirect = sanitizeInternalPath(getQuery(event).redirect)

  if (!provider) {
    return sendRedirect(event, '/auth/sign-in?error=provider_disabled', 302)
  }

  try {
    const { url, state, verifier } = await container.oauthService.buildAuthorizationRedirect(provider)

    setCookie(event, OAUTH_STATE_COOKIE, state, oauthCookieOptions)
    setCookie(event, OAUTH_VERIFIER_COOKIE, verifier, oauthCookieOptions)
    if (redirect) {
      setCookie(event, OAUTH_REDIRECT_COOKIE, redirect, oauthCookieOptions)
    }

    return sendRedirect(event, url, 302)
  }
  catch (error) {
    const code = error instanceof OAuthFlowError ? error.code : 'oauth_failed'
    console.error('[OAuth] Authorize failed:', error)
    return sendRedirect(event, `/auth/sign-in?error=${code}`, 302)
  }
})
