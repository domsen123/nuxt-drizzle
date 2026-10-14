import type { RequestEvent } from 'nuxt/server'
import { deleteCookie, getCookie, setCookie } from 'nuxt/server'
import config from '../../utils/config'

const COOKIE_NAME = 'auth_session'

/**
 * What `setRequestSessionCookie` needs of the node request a Nitro v2 event
 * still carries. Declared here rather than imported from h3, which the project
 * does not depend on directly, and typed as optional because a runtime that
 * exposes no node request resolves `undefined`.
 */
type EventWithNodeRequest = RequestEvent & {
  node?: { req?: { headers: Record<string, string | string[] | undefined> } }
}

const getCookieOptions = (maxAge?: number) => ({
  httpOnly: true,
  secure: config.site.env === 'production',
  sameSite: 'lax' as const,
  path: '/',
  ...(maxAge !== undefined && { maxAge }),
})

export const setSessionCookie = (event: RequestEvent, token: string, expiresAt: Date) => {
  const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000)
  setCookie(event, COOKIE_NAME, token, getCookieOptions(maxAge))
}

export const getSessionToken = (event: RequestEvent): string | undefined => {
  return getCookie(event, COOKIE_NAME)
}

/**
 * Rewrites the incoming cookie header of the current request so later readers
 * see the fresh token.
 *
 * `setSessionCookie` only reaches the browser with the response. Everything that
 * still runs inside this request — the SSR render and the internal API calls it
 * forwards `useRequestHeader('cookie')` to — keeps reading the request headers
 * and would miss a session that was minted mid-request.
 *
 * This is the one place that reaches past `nuxt/server`, because the web-standard
 * surface cannot express it: `event.req` is a `Request` built from a copy of the
 * node headers, so writing to `event.req.headers` leaves the request every later
 * reader resolves untouched. On Nitro v2 the portable event still carries the h3
 * event, so patch the node request itself. A runtime that reports no node request
 * — Nitro v3, `@nuxt/vite-server` — needs a different mechanism, so fail loudly
 * there rather than silently serving a signed-out first render.
 */
export const setRequestSessionCookie = (event: RequestEvent, token: string) => {
  const node = (event as EventWithNodeRequest).node

  if (!node?.req) {
    throw new Error(
      'setRequestSessionCookie needs the node request, which this server runtime does not expose. '
      + 'Carry the fresh token on event.context and read it where the cookie header is forwarded instead.',
    )
  }

  const otherCookies = String(node.req.headers.cookie ?? '')
    .split(';')
    .map(part => part.trim())
    .filter(part => part.length > 0 && !part.startsWith(`${COOKIE_NAME}=`))

  node.req.headers.cookie = [
    ...otherCookies,
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
  ].join('; ')
}

export const clearSessionCookie = (event: RequestEvent) => {
  deleteCookie(event, COOKIE_NAME, getCookieOptions(0))
}
