import type { RequestEvent } from 'nuxt/server'
import { getRequestHeader } from 'nuxt/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import sessionRoute from '../server/api/auth/session.get'
import * as schema from '../server/database/schema'
import { getSessionToken } from '../server/features/auth/session.utils'
import { getDatabase } from '../server/infrastructure/database/client'
import authMiddleware from '../server/middleware/01.auth'
import anonAuthMiddleware from '../server/middleware/02.anon-auth'
import { container } from '../server/utils/container'

import { createAuthProviderData, createUserData } from './factories'

interface TestEventOptions {
  path?: string
  method?: string
  headers?: Record<string, string>
}

/**
 * The event shape a `nuxt/server` handler is given, as the Nitro v2 adapter
 * builds it: the web view over a node request, with `event.req` resolved once
 * and cached, and the node request still reachable for the one caller that
 * rewrites the incoming cookie header.
 */
interface TestEvent extends RequestEvent {
  node: { req: { headers: Record<string, string> } }
}

const DOCUMENT_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
const ORIGIN = 'http://localhost:3000'

const createTestEvent = ({ path = '/', method = 'GET', headers = {} }: TestEventOptions = {}): TestEvent => {
  const nodeHeaders: Record<string, string> = { accept: DOCUMENT_ACCEPT, ...headers }
  const url = new URL(path, ORIGIN)
  const responseHeaders = new Headers()
  let request: Request | undefined

  return {
    node: { req: { headers: nodeHeaders } },
    url,
    get req() {
      // Built on first access and cached, as the adapter does, so a header
      // rewritten afterwards does not change what this event already resolved.
      return request ??= new Request(url, { method, headers: nodeHeaders })
    },
    res: { headers: responseHeaders },
    context: {},
  } as TestEvent
}

/**
 * A second web view over the same node request, as the renderer takes one after
 * the middleware chain has run. This is what `useRequestHeader('cookie')` in
 * `app/plugins/api.ts` reads, and the only reader that sees a cookie header
 * rewritten mid-request.
 */
const renderView = (event: TestEvent): RequestEvent => ({
  ...event,
  req: new Request(event.url, { method: 'GET', headers: event.node.req.headers }),
})

const getSetCookieHeaders = (event: TestEvent): string[] => event.res.headers.getSetCookie()

/** Runs the server middleware chain in the order Nitro applies it. */
const runMiddleware = async (event: TestEvent) => {
  await authMiddleware(event)
  await anonAuthMiddleware(event)
}

describe('anonymous auth middleware', () => {
  const db = getDatabase('app')

  /**
   * Seeds the provider row and clears the 60 second cache of
   * `createAuthProvidersService` through `updateProvider`.
   */
  const setAnonymousProvider = async (enabled: boolean, sessionDurationDays = 30) => {
    const config = { sessionDurationDays }

    await db.insert(schema.authProviders).values(
      createAuthProviderData('anonymous', { enabled, config, displayOrder: 1 }),
    )
    await container.authProvidersService.updateProvider('anonymous', { enabled, config })
  }

  afterEach(async () => {
    vi.restoreAllMocks()
    await db.delete(schema.authProviders)
  })

  describe('provider enabled', () => {
    it('creates user, session and cookie for a document request', async () => {
      await setAnonymousProvider(true, 14)

      const event = createTestEvent({ path: '/' })
      await runMiddleware(event)

      const users = await db.select().from(schema.users)
      const sessions = await db.select().from(schema.sessions)

      expect(users).toHaveLength(1)
      expect(users[0].authProvider).toBe('anonymous')
      expect(users[0].email).toBeNull()

      expect(sessions).toHaveLength(1)
      expect(sessions[0].userId).toBe(users[0].id)

      expect(event.context.user?.id).toBe(users[0].id)
      expect(event.context.session?.id).toBe(sessions[0].id)

      const cookies = getSetCookieHeaders(event)
      expect(cookies).toHaveLength(1)
      expect(cookies[0]).toContain(`auth_session=${sessions[0].token}`)
      expect(cookies[0]).toContain('HttpOnly')
      expect(cookies[0]).toContain('Path=/')
    })

    it('honours the configured session duration', async () => {
      await setAnonymousProvider(true, 7)

      await runMiddleware(createTestEvent({ path: '/blog' }))

      const [session] = await db.select().from(schema.sessions)
      const daysUntilExpiry = (session.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)

      expect(daysUntilExpiry).toBeGreaterThan(6.9)
      expect(daysUntilExpiry).toBeLessThan(7.1)
    })

    it('skips requests that already carry a valid session', async () => {
      await setAnonymousProvider(true)

      const user = await container.items.users.create(createUserData())
      const { token } = await container.authService.createSession(user.id, true)

      const event = createTestEvent({ path: '/', headers: { cookie: `auth_session=${token}` } })
      await runMiddleware(event)

      const users = await db.select().from(schema.users)

      expect(users).toHaveLength(1)
      expect(users[0].id).toBe(user.id)
      expect(event.context.user?.id).toBe(user.id)
      expect(getSetCookieHeaders(event)).toHaveLength(0)
    })
  })

  describe('provider disabled', () => {
    it('creates neither user nor cookie', async () => {
      await setAnonymousProvider(false)

      const event = createTestEvent({ path: '/' })
      await runMiddleware(event)

      expect(await db.select().from(schema.users)).toHaveLength(0)
      expect(await db.select().from(schema.sessions)).toHaveLength(0)
      expect(event.context.user).toBeNull()
      expect(event.context.session).toBeNull()
      expect(getSetCookieHeaders(event)).toHaveLength(0)
    })
  })

  describe('request filtering', () => {
    const skippedRequests: Array<{ name: string, options: TestEventOptions }> = [
      { name: 'API routes', options: { path: '/api/auth/session' } },
      { name: 'nested API routes', options: { path: '/api/me/permissions' } },
      { name: 'nuxt build assets', options: { path: '/_nuxt/entry.CxHb1n2P.js' } },
      { name: 'nuxt island requests', options: { path: '/__nuxt_island/Foo' } },
      { name: 'files with an extension', options: { path: '/favicon.ico' } },
      { name: 'images', options: { path: '/images/logo.png' } },
      { name: 'payload requests', options: { path: '/blog/_payload.json' } },
      { name: 'non-GET requests', options: { path: '/', method: 'POST' } },
      { name: 'requests without a text/html accept', options: { path: '/', headers: { accept: 'application/json' } } },
      { name: 'requests without an accept header', options: { path: '/', headers: { accept: '' } } },
    ]

    it.each(skippedRequests)('mints no session for $name', async ({ options }) => {
      await setAnonymousProvider(true)

      const event = createTestEvent(options)
      await runMiddleware(event)

      expect(await db.select().from(schema.users)).toHaveLength(0)
      expect(event.context.user).toBeNull()
      expect(getSetCookieHeaders(event)).toHaveLength(0)
    })

    it('mints a session for a nested page path', async () => {
      await setAnonymousProvider(true)

      const event = createTestEvent({ path: '/blog/post-slug?utm_source=test' })
      await runMiddleware(event)

      expect(await db.select().from(schema.users)).toHaveLength(1)
      expect(event.context.user?.authProvider).toBe('anonymous')
    })
  })

  describe('failure handling', () => {
    it('serves the request when minting hits a database error', async () => {
      await setAnonymousProvider(true)

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(container.authService, 'createAnonymousUser').mockRejectedValue(
        new Error('CONNECTION_CLOSED'),
      )

      const event = createTestEvent({ path: '/' })

      await expect(runMiddleware(event)).resolves.toBeUndefined()

      expect(await db.select().from(schema.users)).toHaveLength(0)
      expect(event.context.user).toBeNull()
      expect(getSetCookieHeaders(event)).toHaveLength(0)
      expect(consoleError).toHaveBeenCalled()
    })

    it('serves the request when the provider lookup fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(container.authProvidersService, 'getAnonymousConfig').mockRejectedValue(
        new Error('CONNECTION_CLOSED'),
      )

      const event = createTestEvent({ path: '/' })

      await expect(runMiddleware(event)).resolves.toBeUndefined()

      expect(await db.select().from(schema.users)).toHaveLength(0)
      expect(consoleError).toHaveBeenCalled()
    })
  })

  describe('same-request read path', () => {
    it('exposes the fresh session to internal API calls of the SSR render', async () => {
      await setAnonymousProvider(true)

      const documentEvent = createTestEvent({ path: '/', headers: { cookie: 'theme=dark' } })
      await runMiddleware(documentEvent)

      // What `useRequestHeader('cookie')` in app/plugins/api.ts forwards.
      const rendered = renderView(documentEvent)
      const forwardedCookie = getRequestHeader(rendered, 'cookie') ?? ''

      expect(getSessionToken(rendered)).toBe(documentEvent.context.session?.token)
      expect(forwardedCookie).toContain('theme=dark')
      expect(forwardedCookie).toContain(`auth_session=${documentEvent.context.session?.token}`)

      // Replay the internal /api/auth/session call of the SSR render.
      const apiEvent = createTestEvent({
        path: '/api/auth/session',
        headers: { accept: 'application/json', cookie: forwardedCookie },
      })
      await runMiddleware(apiEvent)

      const response = await sessionRoute(apiEvent)

      expect(response.user?.id).toBe(documentEvent.context.user?.id)
      expect(response.user?.authProvider).toBe('anonymous')

      // The internal call must not mint a second user.
      expect(await db.select().from(schema.users)).toHaveLength(1)
    })

    it('replaces a stale session cookie in the forwarded header', async () => {
      await setAnonymousProvider(true)

      const event = createTestEvent({
        path: '/',
        headers: { cookie: 'auth_session=expired-token; theme=dark' },
      })
      await runMiddleware(event)

      const rendered = renderView(event)
      const forwardedCookie = getRequestHeader(rendered, 'cookie') ?? ''

      expect(forwardedCookie).not.toContain('expired-token')
      expect(forwardedCookie).toContain('theme=dark')
      expect(getSessionToken(rendered)).toBe(event.context.session?.token)
    })
  })
})
