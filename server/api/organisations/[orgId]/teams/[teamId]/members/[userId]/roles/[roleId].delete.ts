import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { PERMISSIONS } from '~~/server/features/rbac/permissions'
import { getTeamIdFromParams, requirePermission } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  const teamId = getTeamIdFromParams(event)
  const userId = getRouterParam(event, 'userId', { decode: true })
  const roleId = getRouterParam(event, 'roleId', { decode: true })

  if (!teamId) {
    throw createError({ status: 400, statusText: 'Team ID required' })
  }
  if (!userId) {
    throw createError({ status: 400, statusText: 'User ID required' })
  }
  if (!roleId) {
    throw createError({ status: 400, statusText: 'Role ID required' })
  }

  await requirePermission(event, {
    permission: PERMISSIONS.TEAM_MEMBER_ROLE_ASSIGN,
    scope: 'team',
    getScopeId: () => teamId,
  })

  await container.rbacService.removeRole(userId, roleId, 'team', teamId)

  return { success: true }
})
