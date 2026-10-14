import type { RequestEvent } from 'nuxt/server'
import { defineEventHandler, getRequestHeader, getRequestURL } from 'nuxt/server'
import { setRequestSessionCookie, setSessionCookie } from '../features/auth/session.utils'
import { container } from '../utils/container'

// Paths that end in a file extension are assets, payloads or metadata files.
const ASSET_PATH_PATTERN = /\.[a-z0-9]+$/i

/**
 * Reports whether the request is a real page navigation.
 *
 * Every miss here would cost a user row plus a session row, so bots, prefetches,
 * API calls and asset requests must not qualify.
 */
const isDocumentRequest = (event: RequestEvent): boolean => {
  if (event.req.method !== 'GET')
    return false

  const path = getRequestURL(event).pathname

  if (path === '/api' || path.startsWith('/api/') || path.startsWith('/_'))
    return false

  if (ASSET_PATH_PATTERN.test(path))
    return false

  return (getRequestHeader(event, 'accept') ?? '').includes('text/html')
}

/**
 * Creates the anonymous session before the page renders.
 *
 * Runs after `01.auth.ts`, so `event.context.user` already reflects an existing
 * cookie. Nitro sorts server middleware alphabetically by filename; the numeric
 * prefixes pin that order.
 */
export default defineEventHandler(async (event) => {
  // Never mint sessions while prerendering: the cookie is discarded with the
  // build-time response, and the database is not reachable during CI/Docker builds.
  if (import.meta.prerender)
    return

  // Skip if the request already carries a valid session.
  if (event.context.user)
    return

  if (!isDocumentRequest(event))
    return

  // Anonymous sessions are best effort - a database problem here must not
  // turn an otherwise renderable page into a 500.
  try {
    const anonConfig = await container.authProvidersService.getAnonymousConfig()
    if (!anonConfig.enabled)
      return

    const result = await container.authService.createAnonymousUser(anonConfig.sessionDurationDays)

    setSessionCookie(event, result.token, result.session.expiresAt)

    // The response cookie only reaches the browser on the next request, but
    // `app/plugins/api.ts` calls `/api/auth/session` and `/api/me/permissions`
    // during this render and forwards `useRequestHeader('cookie')`. Patching the
    // incoming header keeps those internal calls consistent with the session
    // that was just minted, so the first response already renders signed in.
    //
    // The alternative - rewriting `app/plugins/api.ts` to read
    // `event.context` - would drop the HTTP roundtrip but force the client
    // bundle's auth plugin to duplicate the permission assembly of
    // `/api/me/permissions`. Patching one header keeps that logic on the server
    // and leaves the app layer untouched.
    setRequestSessionCookie(event, result.token)

    event.context.user = result.user
    event.context.session = result.session
  }
  catch (error) {
    console.error('[AnonAuth] Failed to create anonymous session', error)
  }
})
