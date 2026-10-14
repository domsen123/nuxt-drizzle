import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { PERMISSIONS } from '~~/server/features/rbac/permissions'
import { getOrgIdFromParams, requirePermission } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  const orgId = getOrgIdFromParams(event)
  const userId = getRouterParam(event, 'userId', { decode: true })

  if (!orgId) {
    throw createError({ status: 400, statusText: 'Organisation ID required', data: { code: 'validation.missing_param' } })
  }
  if (!userId) {
    throw createError({ status: 400, statusText: 'User ID required', data: { code: 'validation.missing_param' } })
  }

  await requirePermission(event, {
    permission: PERMISSIONS.ORGANISATION_MEMBER_VIEW,
    scope: 'organisation',
    getScopeId: () => orgId,
  })

  const roles = await container.rbacService.getUserRoles(userId, 'organisation', orgId)

  return { roles }
})
