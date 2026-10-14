import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const id = getRouterParam(event, 'id', { decode: true })
  if (!id) {
    throw createError({ status: 400, statusText: 'File ID is required' })
  }

  const file = await container.mediaLibraryService.getMediaFile(id)
  if (!file) {
    throw createError({ status: 404, statusText: 'Media file not found' })
  }

  return { file }
})
