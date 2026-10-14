import { createError, defineEventHandler } from 'nuxt/server'
import { PERMISSIONS } from '~~/server/features/rbac/permissions'
import { getTeamIdFromParams, requirePermission } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  const teamId = getTeamIdFromParams(event)

  if (!teamId) {
    throw createError({ status: 400, statusText: 'Team ID required', data: { code: 'validation.missing_param' } })
  }

  await requirePermission(event, {
    permission: PERMISSIONS.TEAM_READ,
    scope: 'team',
    getScopeId: () => teamId,
  })

  const roles = await container.rbacService.getRolesByScope('team')

  return { roles }
})
