import { createError, defineEventHandler, readBody } from 'nuxt/server'
import * as z from 'zod'
import { requireAuth } from '~~/server/features/auth/auth.guard'
import { container } from '~~/server/utils/container'

const updateProfileSchema = z.object({
  name: z.string().trim().max(100, 'Name must be 100 characters or less').optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const body = await readBody(event)
  const parsed = updateProfileSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      status: 400,
      statusText: parsed.error.issues[0]?.message ?? 'Invalid input',
      data: { code: 'validation.invalid_input' },
    })
  }

  const profile = await container.profileService.updateProfile(user.id, parsed.data)

  return { profile }
})
