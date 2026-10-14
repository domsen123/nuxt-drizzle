import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const id = getRouterParam(event, 'id', { decode: true })
  const userId = getRouterParam(event, 'userId', { decode: true })

  if (!id) {
    throw createError({ status: 400, statusText: 'Organisation ID is required' })
  }
  if (!userId) {
    throw createError({ status: 400, statusText: 'User ID is required' })
  }

  await container.organisationMembersService.removeMember(id, userId)

  return { success: true }
})
