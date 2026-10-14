import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id', { decode: true })
  if (!id) {
    throw createError({ status: 400, statusText: 'Missing file ID' })
  }

  const content = await container.fileService.getFileContent(id)
  if (!content) {
    throw createError({ status: 404, statusText: 'File not found' })
  }

  // `nuxt/server` carries no `setHeaders`; the response headers are the web ones.
  event.res.headers.set('content-type', content.mimeType)
  event.res.headers.set('cache-control', 'public, max-age=31536000, immutable')

  return content.buffer
})
