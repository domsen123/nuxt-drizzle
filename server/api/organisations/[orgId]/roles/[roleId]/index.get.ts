import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { PERMISSIONS } from '~~/server/features/rbac/permissions'
import { getOrgIdFromParams, requirePermission } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  const orgId = getOrgIdFromParams(event)
  const roleId = getRouterParam(event, 'roleId', { decode: true })

  if (!orgId) {
    throw createError({ status: 400, statusText: 'Organisation ID required', data: { code: 'validation.missing_param' } })
  }
  if (!roleId) {
    throw createError({ status: 400, statusText: 'Role ID required', data: { code: 'validation.missing_param' } })
  }

  await requirePermission(event, {
    permission: PERMISSIONS.ORGANISATION_READ,
    scope: 'organisation',
    getScopeId: () => orgId,
  })

  const role = await container.rbacService.getRoleWithPermissions(roleId)

  if (!role) {
    throw createError({ status: 404, statusText: 'Role not found', data: { code: 'members.role_not_found' } })
  }

  return { role }
})
