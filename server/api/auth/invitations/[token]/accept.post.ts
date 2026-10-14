import { createError, defineEventHandler, getRouterParam, readBody } from 'nuxt/server'
import { z } from 'zod'
import { setSessionCookie } from '~~/server/features/auth/session.utils'
import { container } from '~~/server/utils/container'

const acceptSchema = z.object({
  password: z.string().trim().min(8, 'Password must be at least 8 characters'),
  name: z.string().trim().optional(),
})

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token', { decode: true })

  if (!token) {
    throw createError({ status: 400, statusText: 'Token is required' })
  }

  const body = await readBody(event)
  const parsed = acceptSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      status: 400,
      statusText: parsed.error.issues[0]?.message ?? 'Invalid input',
    })
  }

  const result = await container.organisationInvitationsService.acceptInvitation({
    token,
    password: parsed.data.password,
    name: parsed.data.name,
  })

  // Auto-login the user after accepting invitation
  const authResult = await container.authService.login(result.user.email!, parsed.data.password, true)

  // Set session cookie
  setSessionCookie(event, authResult.token, authResult.session.expiresAt)

  return {
    success: true,
    user: result.user,
    organisationId: result.organisationId,
    organisationName: result.organisationName,
  }
})
