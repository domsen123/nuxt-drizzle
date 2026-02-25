import { requireAuth } from '~~/server/features/auth/auth.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  }

  const filePart = formData.find(part => part.name === 'file')
  if (!filePart || !filePart.data || !filePart.filename) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file in upload' })
  }

  const entityType = formData.find(part => part.name === 'entityType')?.data.toString('utf-8')
  const entityId = formData.find(part => part.name === 'entityId')?.data.toString('utf-8')

  const result = await container.fileService.upload({
    buffer: filePart.data,
    originalName: filePart.filename,
    mimeType: filePart.type || 'application/octet-stream',
    size: filePart.data.length,
    uploadedBy: user.id,
    entityType,
    entityId,
  })

  return { file: result }
})
