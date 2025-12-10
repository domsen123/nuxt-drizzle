import { getSessionToken, setSessionCookie } from '../features/auth/session.utils'
import { container } from '../utils/container'

export default defineEventHandler(async (event) => {
  // Initialize context with null values
  event.context.session = null
  event.context.user = null

  const token = getSessionToken(event)

  if (!token) {
    return
  }

  const result = await container.authService.validateSession(token)

  if (!result) {
    return
  }

  event.context.session = result.session
  event.context.user = result.user

  // Sliding session: auto-refresh if nearing expiration
  if (container.authService.shouldRefreshSession(result.session)) {
    const refreshedSession = await container.authService.refreshSession(result.session.id)
    event.context.session = refreshedSession
    setSessionCookie(event, token, refreshedSession.expiresAt)
  }
})
