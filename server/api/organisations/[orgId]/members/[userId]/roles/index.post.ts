import { createError, defineEventHandler, getRouterParam, readValidatedBody } from 'nuxt/server'
import { z } from 'zod'
import { PERMISSIONS } from '~~/server/features/rbac/permissions'
import { getOrgIdFromParams, requirePermission } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

const assignRoleSchema = z.object({
  roleId: z.string().trim().min(1),
})

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
    permission: PERMISSIONS.ORGANISATION_MEMBER_ROLE_ASSIGN,
    scope: 'organisation',
    getScopeId: () => orgId,
  })

  const body = await readValidatedBody(event, b => assignRoleSchema.parse(b))

  await container.rbacService.assignRole({
    userId,
    roleId: body.roleId,
    scope: 'organisation',
    scopeId: orgId,
  })

  return { success: true }
})
