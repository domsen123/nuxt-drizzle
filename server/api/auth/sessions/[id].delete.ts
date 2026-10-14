import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { requireAuth } from '~~/server/features/auth/auth.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const currentSession = event.context.session
  const sessionId = getRouterParam(event, 'id', { decode: true })

  if (!currentSession) {
    throw createError({
      status: 401,
      statusText: 'Session not found',
      data: { code: 'auth.session_not_found' },
    })
  }

  if (!sessionId) {
    throw createError({
      status: 400,
      statusText: 'Session ID is required',
      data: { code: 'auth.session_id_required' },
    })
  }

  // Prevent deleting current session via this endpoint
  if (sessionId === currentSession.id) {
    throw createError({
      status: 400,
      statusText: 'Cannot delete current session. Use logout instead.',
      data: { code: 'auth.cannot_delete_current_session' },
    })
  }

  const deleted = await container.authService.invalidateSessionById(user.id, sessionId)

  if (!deleted) {
    throw createError({
      status: 404,
      statusText: 'Session not found',
      data: { code: 'auth.session_not_found' },
    })
  }

  return {
    success: true,
    message: 'Session logged out',
  }
})
