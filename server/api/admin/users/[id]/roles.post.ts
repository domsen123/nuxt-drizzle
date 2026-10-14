import { createError, defineEventHandler, getRouterParam, readBody } from 'nuxt/server'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const id = getRouterParam(event, 'id', { decode: true })

  if (!id) {
    throw createError({
      status: 400,
      statusText: 'User ID is required',
    })
  }

  const body = await readBody<{ roleId: string }>(event)

  if (!body?.roleId) {
    throw createError({
      status: 400,
      statusText: 'Role ID is required',
    })
  }

  // Verify user exists
  const user = await container.items.users.readOne(id)
  if (!user) {
    throw createError({
      status: 404,
      statusText: 'User not found',
    })
  }

  await container.rbacService.assignRole({
    userId: id,
    roleId: body.roleId,
    scope: 'global',
  })

  return { success: true }
})
