import { createError, defineEventHandler, readBody } from 'nuxt/server'
import * as z from 'zod'
import { requireAuth } from '~~/server/features/auth/auth.guard'
import { container } from '~~/server/utils/container'
import { COLOR_MODES, NEUTRAL_COLORS, PRIMARY_COLORS } from '~~/shared/user-preferences.constants'

const updatePreferencesSchema = z.strictObject({
  colorMode: z.enum(COLOR_MODES).optional(),
  primaryColor: z.enum(PRIMARY_COLORS).optional(),
  neutralColor: z.enum(NEUTRAL_COLORS).optional(),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const body = await readBody(event)
  const parsed = updatePreferencesSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      status: 400,
      statusText: parsed.error.issues[0]?.message ?? 'Invalid input',
    })
  }

  const preferences = await container.profileService.updatePreferences(user.id, parsed.data)

  return { preferences }
})
