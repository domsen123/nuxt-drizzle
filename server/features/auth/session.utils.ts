import type { H3Event } from 'h3'
import { deleteCookie, getCookie, setCookie } from 'h3'
import config from '../../utils/config'

const COOKIE_NAME = 'auth_session'

const getCookieOptions = (maxAge?: number) => ({
  httpOnly: true,
  secure: config.site.env === 'production',
  sameSite: 'lax' as const,
  path: '/',
  ...(maxAge !== undefined && { maxAge }),
})

export const setSessionCookie = (event: H3Event, token: string, expiresAt: Date) => {
  const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000)
  setCookie(event, COOKIE_NAME, token, getCookieOptions(maxAge))
}

export const getSessionToken = (event: H3Event): string | undefined => {
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
 */
export const setRequestSessionCookie = (event: H3Event, token: string) => {
  const otherCookies = (event.node.req.headers.cookie ?? '')
    .split(';')
    .map(part => part.trim())
    .filter(part => part.length > 0 && !part.startsWith(`${COOKIE_NAME}=`))

  event.node.req.headers.cookie = [
    ...otherCookies,
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
  ].join('; ')
}

export const clearSessionCookie = (event: H3Event) => {
  deleteCookie(event, COOKIE_NAME, getCookieOptions(0))
}
