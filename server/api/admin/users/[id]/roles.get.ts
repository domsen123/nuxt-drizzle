import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
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

  // Verify user exists
  const user = await container.items.users.readOne(id)
  if (!user) {
    throw createError({
      status: 404,
      statusText: 'User not found',
    })
  }

  // Get user's global roles with permissions
  const roles = await container.rbacService.getUserRoles(id, 'global')

  return {
    roles: roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      scope: role.scope,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      permissions: role.permissions.map(p => ({
        permission: p.permission,
      })),
    })),
  }
})
