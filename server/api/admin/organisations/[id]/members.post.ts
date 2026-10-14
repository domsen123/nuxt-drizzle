import { createError, defineEventHandler, getRouterParam, readBody } from 'nuxt/server'
import * as z from 'zod'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

const addMemberSchema = z.object({
  userId: z.string().trim().min(1, 'User ID is required'),
  roleId: z.string().trim().min(1, 'Role ID is required'),
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const id = getRouterParam(event, 'id', { decode: true })
  if (!id) {
    throw createError({ status: 400, statusText: 'Organisation ID is required' })
  }

  const body = await readBody(event)
  const parsed = addMemberSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      status: 400,
      statusText: parsed.error.issues[0]?.message ?? 'Invalid input',
    })
  }

  const member = await container.organisationMembersService.addMember({
    organisationId: id,
    userId: parsed.data.userId,
    roleId: parsed.data.roleId,
  })

  return { member }
})
