import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { PERMISSIONS } from '~~/server/features/rbac/permissions'
import { getOrgIdFromParams, requirePermission } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  const orgId = getOrgIdFromParams(event)
  const userId = getRouterParam(event, 'userId', { decode: true })
  const roleId = getRouterParam(event, 'roleId', { decode: true })

  if (!orgId) {
    throw createError({ status: 400, statusText: 'Organisation ID required' })
  }
  if (!userId) {
    throw createError({ status: 400, statusText: 'User ID required' })
  }
  if (!roleId) {
    throw createError({ status: 400, statusText: 'Role ID required' })
  }

  await requirePermission(event, {
    permission: PERMISSIONS.ORGANISATION_MEMBER_ROLE_ASSIGN,
    scope: 'organisation',
    getScopeId: () => orgId,
  })

  await container.rbacService.removeRole(userId, roleId, 'organisation', orgId)

  return { success: true }
})
