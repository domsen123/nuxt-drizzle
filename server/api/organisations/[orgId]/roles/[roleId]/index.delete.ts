import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { PERMISSIONS } from '~~/server/features/rbac/permissions'
import { getOrgIdFromParams, requirePermission } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  const orgId = getOrgIdFromParams(event)
  const roleId = getRouterParam(event, 'roleId', { decode: true })

  if (!orgId) {
    throw createError({ status: 400, statusText: 'Organisation ID required' })
  }
  if (!roleId) {
    throw createError({ status: 400, statusText: 'Role ID required' })
  }

  await requirePermission(event, {
    permission: PERMISSIONS.ORGANISATION_ROLE_DELETE,
    scope: 'organisation',
    getScopeId: () => orgId,
  })

  await container.rbacService.deleteRole(roleId)

  return { success: true }
})
