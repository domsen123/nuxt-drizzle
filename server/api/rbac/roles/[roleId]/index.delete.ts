import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const roleId = getRouterParam(event, 'roleId', { decode: true })
  if (!roleId) {
    throw createError({ status: 400, statusText: 'Role ID required' })
  }

  await container.rbacService.deleteRole(roleId)

  return { success: true }
})
