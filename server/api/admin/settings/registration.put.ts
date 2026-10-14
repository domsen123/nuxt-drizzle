import { defineEventHandler, readBody } from 'nuxt/server'
import * as z from 'zod'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'
import { REGISTRATION_MODES } from '~~/shared/registration.constants'

const schema = z.object({
  mode: z.enum(REGISTRATION_MODES),
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const body = await readBody(event)
  const { mode } = schema.parse(body)

  await container.registrationPolicyService.setMode(mode)

  return { mode }
})
