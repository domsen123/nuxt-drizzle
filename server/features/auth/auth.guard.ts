import type { RequestEvent } from 'nuxt/server'
import type { User } from '../../database/schema'
import { createError } from 'nuxt/server'

export const requireAuth = (event: RequestEvent): Omit<User, 'passwordHash'> => {
  const user = event.context.user

  if (!user) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized',
    })
  }

  return user
}
