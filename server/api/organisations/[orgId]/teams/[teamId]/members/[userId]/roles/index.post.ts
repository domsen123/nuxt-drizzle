import { createError, defineEventHandler, getRouterParam, readValidatedBody } from 'nuxt/server'
import { z } from 'zod'
import { PERMISSIONS } from '~~/server/features/rbac/permissions'
import { getTeamIdFromParams, requirePermission } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

const assignRoleSchema = z.object({
  roleId: z.string().trim().min(1),
})

export default defineEventHandler(async (event) => {
  const teamId = getTeamIdFromParams(event)
  const userId = getRouterParam(event, 'userId', { decode: true })

  if (!teamId) {
    throw createError({ status: 400, statusText: 'Team ID required', data: { code: 'validation.missing_param' } })
  }
  if (!userId) {
    throw createError({ status: 400, statusText: 'User ID required', data: { code: 'validation.missing_param' } })
  }

  await requirePermission(event, {
    permission: PERMISSIONS.TEAM_MEMBER_ROLE_ASSIGN,
    scope: 'team',
    getScopeId: () => teamId,
  })

  const body = await readValidatedBody(event, b => assignRoleSchema.parse(b))

  await container.rbacService.assignRole({
    userId,
    roleId: body.roleId,
    scope: 'team',
    scopeId: teamId,
  })

  return { success: true }
})
