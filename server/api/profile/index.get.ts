import { createError, defineEventHandler } from 'nuxt/server'
import { requireAuth } from '~~/server/features/auth/auth.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const profile = await container.profileService.getProfile(user.id)

  if (!profile) {
    throw createError({ status: 404, statusText: 'Profile not found', data: { code: 'profile.not_found' } })
  }

  return { profile }
})
