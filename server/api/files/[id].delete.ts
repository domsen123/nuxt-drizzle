import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { requireAuth } from '~~/server/features/auth/auth.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const id = getRouterParam(event, 'id', { decode: true })
  if (!id) {
    throw createError({ status: 400, statusText: 'Missing file ID' })
  }

  // Check ownership
  const file = await container.fileService.getFile(id)
  if (!file) {
    throw createError({ status: 404, statusText: 'File not found' })
  }

  if (file.uploadedBy !== user.id) {
    throw createError({ status: 403, statusText: 'Not authorized to delete this file' })
  }

  if (file.parentId) {
    throw createError({ status: 400, statusText: 'Cannot delete a variant directly. Delete the parent file instead.' })
  }

  await container.fileService.deleteFile(id)

  return { success: true }
})
