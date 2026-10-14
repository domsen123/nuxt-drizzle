import type { Permission } from '~~/server/features/rbac/permissions'
import { createError, defineEventHandler, getRouterParam, readValidatedBody } from 'nuxt/server'
import { z } from 'zod'
import { PERMISSIONS } from '~~/server/features/rbac/permissions'
import { getOrgIdFromParams, requirePermission } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

const updateRoleSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  permissions: z.array(z.string().trim()).optional(),
})

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
    permission: PERMISSIONS.ORGANISATION_ROLE_UPDATE,
    scope: 'organisation',
    getScopeId: () => orgId,
  })

  const body = await readValidatedBody(event, b => updateRoleSchema.parse(b))

  const role = await container.rbacService.updateRole(roleId, {
    name: body.name,
    description: body.description,
    permissions: body.permissions as Permission[] | undefined,
  })

  return { role }
})
