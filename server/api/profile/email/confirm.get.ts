import { createError, defineEventHandler, getQuery } from 'nuxt/server'
import * as z from 'zod'
import { container } from '~~/server/utils/container'

const confirmEmailChangeSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const parsed = confirmEmailChangeSchema.safeParse(query)

  if (!parsed.success) {
    throw createError({
      status: 400,
      statusText: parsed.error.issues[0]?.message ?? 'Invalid token',
      data: { code: 'validation.invalid_input' },
    })
  }

  const result = await container.profileService.confirmEmailChange(parsed.data.token)

  return result
})
