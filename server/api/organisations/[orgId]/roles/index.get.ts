import { createError, defineEventHandler } from 'nuxt/server'
import { PERMISSIONS } from '~~/server/features/rbac/permissions'
import { getOrgIdFromParams, requirePermission } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  const orgId = getOrgIdFromParams(event)
  if (!orgId) {
    throw createError({ status: 400, statusText: 'Organisation ID required' })
  }

  await requirePermission(event, {
    permission: PERMISSIONS.ORGANISATION_READ,
    scope: 'organisation',
    getScopeId: () => orgId,
  })

  const roles = await container.rbacService.getRolesByScope('organisation', orgId)

  return { roles }
})
