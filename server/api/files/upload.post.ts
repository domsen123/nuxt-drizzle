import { Buffer } from 'node:buffer'
import { createError, defineEventHandler } from 'nuxt/server'
import { requireAuth } from '~~/server/features/auth/auth.guard'
import { AVATAR_VARIANT_SPECS } from '~~/server/features/files/image-processing.service'
import { container } from '~~/server/utils/container'

/** Reads one text field of the form, or `undefined` when it was not sent. */
const readTextField = (formData: FormData, name: string): string | undefined => {
  const value = formData.get(name)
  return typeof value === 'string' ? value : undefined
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  // `nuxt/server` carries no `readMultipartFormData`; the request parses itself.
  const formData = await event.req.formData().catch(() => null)
  if (!formData) {
    throw createError({ status: 400, statusText: 'No file uploaded', data: { code: 'files.no_file_uploaded' } })
  }

  const file = formData.get('file')
  if (!(file instanceof File) || !file.name) {
    throw createError({ status: 400, statusText: 'Missing file in upload', data: { code: 'files.missing_file' } })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type || 'application/octet-stream'
  const entityType = readTextField(formData, 'entityType')
  const entityId = readTextField(formData, 'entityId')

  const isAvatar = entityType === 'user-avatar'

  const result = await container.fileService.upload({
    buffer,
    originalName: file.name,
    mimeType,
    size: buffer.length,
    uploadedBy: user.id,
    entityType,
    entityId,
    variant: isAvatar ? 'original' : undefined,
  })

  // Generate avatar variants
  if (isAvatar) {
    const variants = await container.imageProcessingService.generateVariants(
      buffer,
      mimeType,
      AVATAR_VARIANT_SPECS,
    )

    await Promise.all(
      variants.map(v =>
        container.fileService.upload({
          buffer: v.buffer,
          originalName: `${v.variant}-${file.name}`,
          mimeType: v.mimeType,
          size: v.buffer.length,
          uploadedBy: user.id,
          entityType,
          entityId,
          parentId: result.id,
          variant: v.variant,
        }),
      ),
    )
  }

  return { file: result }
})
