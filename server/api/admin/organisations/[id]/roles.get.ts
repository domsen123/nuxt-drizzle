import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const id = getRouterParam(event, 'id', { decode: true })
  if (!id) {
    throw createError({ status: 400, statusText: 'Organisation ID is required' })
  }

  // Verify organisation exists
  const org = await container.items.organisations.readOne(id)
  if (!org) {
    throw createError({ status: 404, statusText: 'Organisation not found' })
  }

  const roles = await container.organisationMembersService.getAvailableRoles(id)

  return {
    roles: roles.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      isDefault: r.isDefault,
    })),
  }
})
