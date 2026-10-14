import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const id = getRouterParam(event, 'id', { decode: true })
  if (!id) {
    throw createError({ status: 400, statusText: 'Cluster ID is required' })
  }

  const existing = await container.items.contentCreatorClusters.findOne({ id: { _eq: id } })
  if (!existing) {
    throw createError({ status: 404, statusText: 'Cluster not found' })
  }

  await container.items.contentCreatorClusters.delete(id)

  return { success: true }
})
