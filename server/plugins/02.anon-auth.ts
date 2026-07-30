import { setSessionCookie } from '../features/auth/session.utils'
import { container } from '../utils/container'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', async (_response, { event }) => {
    // Never mint sessions while prerendering: the cookie is discarded with the
    // build-time response, and the database is not reachable during CI/Docker builds.
    if (import.meta.prerender)
      return

    // Skip if user already authenticated (existing cookie worked)
    if (event.context.user)
      return

    // Skip non-document requests (API calls, assets, etc.)
    if (!event.path || event.path.startsWith('/api/') || event.path.startsWith('/_'))
      return

    // Anonymous sessions are best effort - a database problem here must not
    // turn an otherwise renderable page into a 500.
    try {
      const anonConfig = await container.authProvidersService.getAnonymousConfig()
      if (!anonConfig.enabled)
        return

      const result = await container.authService.createAnonymousUser(anonConfig.sessionDurationDays)

      setSessionCookie(event, result.token, result.session.expiresAt)

      event.context.user = result.user
      event.context.session = result.session
    }
    catch (error) {
      console.error('[AnonAuth] Failed to create anonymous session', error)
    }
  })
})
