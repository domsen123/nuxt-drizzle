import type { Buffer } from 'node:buffer'
import type { files } from '~~/server/database/schema'
import type { ItemService } from '~~/server/infrastructure/database/item-service'
import type { Config } from '~~/server/utils/config'
import type { FileStoreProvider } from './file-store-provider.interface'
import type { ImageProcessingService } from './image-processing.service'
import path from 'node:path'
import { createError } from 'nuxt/server'
import { ulid } from 'ulid'
import { USER_AVATAR_ENTITY_TYPE } from '~~/shared/files.constants'
import { AVATAR_VARIANT_SPECS } from './image-processing.service'

export interface UploadFileInput {
  buffer: Buffer
  originalName: string
  mimeType: string
  size: number
  uploadedBy: string
  entityType?: string
  entityId?: string
  parentId?: string
  variant?: string
}

export interface FileMetadata {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  storagePath: string
  storageProvider: string
  uploadedBy: string | null
  entityType: string | null
  entityId: string | null
  parentId: string | null
  variant: string | null
  url: string
  createdAt: Date
  updatedAt: Date
}

export interface UploadAvatarInput {
  buffer: Buffer
  originalName: string
  mimeType: string
  size: number
  uploadedBy: string
  entityId?: string
}

export interface CreateFileServiceDeps {
  fileStoreProvider: FileStoreProvider
  filesItemService: ItemService<typeof files>
  imageProcessingService: ImageProcessingService
  config: Config
}

export const createFileService = (deps: CreateFileServiceDeps) => {
  const { fileStoreProvider, filesItemService, imageProcessingService, config } = deps

  const buildStorageKey = (input: UploadFileInput): string => {
    const ext = path.extname(input.originalName).toLowerCase()
    const safeName = path.basename(input.originalName, ext)
      .replace(/[^\w-]/g, '_')
      .slice(0, 50)
    const shortId = ulid().slice(-8).toLowerCase()
    const prefix = input.entityType && input.entityId
      ? `${input.entityType}/${input.entityId}`
      : 'general'
    return `${prefix}/${safeName}-${shortId}${ext}`
  }

  const toMetadata = (record: typeof files.$inferSelect): FileMetadata => ({
    id: record.id,
    filename: record.filename,
    originalName: record.originalName,
    mimeType: record.mimeType,
    size: record.size,
    storagePath: record.storagePath,
    storageProvider: record.storageProvider,
    uploadedBy: record.uploadedBy,
    entityType: record.entityType,
    entityId: record.entityId,
    parentId: record.parentId,
    variant: record.variant,
    url: `${config.site.url}/api/files/${record.id}`,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  })

  const upload = async (input: UploadFileInput): Promise<FileMetadata> => {
    // Validate file size
    if (input.size > config.storage.maxFileSize) {
      throw createError({
        status: 400,
        statusText: `File too large. Maximum size is ${Math.round(config.storage.maxFileSize / 1024 / 1024)}MB`,
        data: { code: 'files.too_large' },
      })
    }

    // Validate mime type
    if (!config.storage.allowedMimeTypes.includes(input.mimeType)) {
      throw createError({
        status: 400,
        statusText: `File type not allowed. Allowed types: ${config.storage.allowedMimeTypes.join(', ')}`,
        data: { code: 'files.type_not_allowed' },
      })
    }

    const storagePath = buildStorageKey(input)

    // Store the file
    await fileStoreProvider.put(storagePath, input.buffer, {
      mimeType: input.mimeType,
      originalName: input.originalName,
    })

    // Create DB record
    const record = await filesItemService.create({
      filename: path.basename(storagePath),
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      storagePath,
      storageProvider: config.storage.provider,
      uploadedBy: input.uploadedBy,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      parentId: input.parentId ?? null,
      variant: input.variant ?? null,
    })

    return toMetadata(record)
  }

  /**
   * Stores a user avatar the way every avatar is stored: the original plus
   * the generated size variants, all tagged with the avatar entity type.
   */
  const uploadAvatar = async (input: UploadAvatarInput): Promise<FileMetadata> => {
    const original = await upload({
      ...input,
      entityType: USER_AVATAR_ENTITY_TYPE,
      variant: 'original',
    })

    const variants = await imageProcessingService.generateVariants(input.buffer, input.mimeType, AVATAR_VARIANT_SPECS)
    await Promise.all(
      variants.map(variant =>
        upload({
          buffer: variant.buffer,
          originalName: `${variant.variant}-${input.originalName}`,
          mimeType: variant.mimeType,
          size: variant.buffer.length,
          uploadedBy: input.uploadedBy,
          entityType: USER_AVATAR_ENTITY_TYPE,
          entityId: input.entityId,
          parentId: original.id,
          variant: variant.variant,
        }),
      ),
    )

    return original
  }

  const getFile = async (id: string): Promise<FileMetadata | null> => {
    const record = await filesItemService.readOne(id)
    if (!record)
      return null
    return toMetadata(record)
  }

  const getFilesByEntity = async (entityType: string, entityId: string, options?: { includeVariants?: boolean }): Promise<FileMetadata[]> => {
    const records = await filesItemService.findMany({
      filter: { entityType, entityId },
      sort: ['-createdAt'],
    })
    const all = records.map(toMetadata)
    if (options?.includeVariants)
      return all
    // By default, exclude variant children (parentId !== null)
    return all.filter(f => !f.parentId)
  }

  const deleteFile = async (id: string): Promise<void> => {
    const record = await filesItemService.readOne(id)
    if (!record) {
      throw createError({ status: 404, statusText: 'File not found', data: { code: 'files.not_found' } })
    }

    // If this is a parent file, delete variant storage files first (DB cascade handles records)
    if (!record.parentId) {
      const variants = await filesItemService.findMany({
        filter: { parentId: id },
      })
      await Promise.all(
        variants.map(v => fileStoreProvider.delete(v.storagePath)),
      )
    }

    // Delete from store
    await fileStoreProvider.delete(record.storagePath)

    // Delete from DB (cascade will remove variant records for parent files)
    await filesItemService.delete(id)
  }

  const getFileContent = async (id: string): Promise<{ buffer: Buffer, mimeType: string } | null> => {
    const record = await filesItemService.readOne(id)
    if (!record)
      return null
    const content = await fileStoreProvider.get(record.storagePath)
    return { buffer: content.buffer, mimeType: record.mimeType }
  }

  return {
    upload,
    uploadAvatar,
    getFile,
    getFilesByEntity,
    deleteFile,
    getFileContent,
  }
}

export type FileService = ReturnType<typeof createFileService>
