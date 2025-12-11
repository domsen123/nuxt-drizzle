import * as z from 'zod'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

const inviteSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  roleId: z.string().trim().min(1, 'Role ID is required'),
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Organisation ID is required' })
  }

  const body = await readBody(event)
  const parsed = inviteSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input',
    })
  }

  const result = await container.organisationMembersService.inviteMember({
    organisationId: id,
    email: parsed.data.email,
    roleId: parsed.data.roleId,
  })

  return result
})
