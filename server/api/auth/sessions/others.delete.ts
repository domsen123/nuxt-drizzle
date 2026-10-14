import { createError, defineEventHandler } from 'nuxt/server'
import { requireAuth } from '~~/server/features/auth/auth.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const session = event.context.session

  if (!session) {
    throw createError({
      status: 401,
      statusText: 'Session not found',
      data: { code: 'auth.session_not_found' },
    })
  }

  const count = await container.authService.invalidateOtherSessions(user.id, session.id)

  return {
    success: true,
    count,
    message: count > 0 ? `${count} session(s) logged out` : 'No other sessions found',
  }
})
