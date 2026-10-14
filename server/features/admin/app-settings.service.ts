import type { DatabaseClient } from '../../infrastructure/database/client'
import { eq } from 'drizzle-orm'
import { ulid } from 'ulid'
import { appSettings } from '../../database/schema'

const CACHE_TTL_MS = 60 * 1000 // 1 minute

export interface CreateAppSettingsServiceDeps {
  db: DatabaseClient
}

export const createAppSettingsService = ({ db }: CreateAppSettingsServiceDeps) => {
  const cache = new Map<string, { value: unknown, expiresAt: number }>()

  const getSetting = async <T>(key: string, fallback: T): Promise<T> => {
    const cached = cache.get(key)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T
    }

    const [row] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1)

    if (!row) {
      cache.delete(key)
      return fallback
    }

    cache.set(key, { value: row.value, expiresAt: Date.now() + CACHE_TTL_MS })
    return row.value as T
  }

  const setSetting = async (key: string, value: unknown) => {
    const [row] = await db
      .insert(appSettings)
      .values({
        id: ulid(),
        key,
        value,
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value, updatedAt: new Date() },
      })
      .returning()

    cache.delete(key)

    return row
  }

  return {
    getSetting,
    setSetting,
  }
}

export type AppSettingsService = ReturnType<typeof createAppSettingsService>
