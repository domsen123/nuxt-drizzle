import type { DatabaseClient } from '../../infrastructure/database/client'
import { eq } from 'drizzle-orm'
import { authProviders } from '../../database/schema'

interface AnonymousConfig {
  enabled: boolean
  sessionDurationDays: number
}

interface CachedProvider {
  enabled: boolean
  config: Record<string, unknown>
}

const CACHE_TTL_MS = 60 * 1000 // 1 minute

export interface CreateAuthProvidersServiceDeps {
  db: DatabaseClient
}

export const createAuthProvidersService = ({ db }: CreateAuthProvidersServiceDeps) => {
  const cache = new Map<string, { data: CachedProvider, expiresAt: number }>()

  const getProvider = async (name: string): Promise<CachedProvider | null> => {
    const cached = cache.get(name)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data
    }

    const [row] = await db
      .select()
      .from(authProviders)
      .where(eq(authProviders.provider, name))
      .limit(1)

    if (!row) {
      cache.delete(name)
      return null
    }

    const data: CachedProvider = {
      enabled: row.enabled,
      config: row.config as Record<string, unknown>,
    }

    cache.set(name, { data, expiresAt: Date.now() + CACHE_TTL_MS })
    return data
  }

  const getAnonymousConfig = async (): Promise<AnonymousConfig> => {
    const provider = await getProvider('anonymous')
    if (!provider) {
      return { enabled: false, sessionDurationDays: 30 }
    }

    return {
      enabled: provider.enabled,
      sessionDurationDays: (provider.config.sessionDurationDays as number) ?? 30,
    }
  }

  return {
    getProvider,
    getAnonymousConfig,
  }
}

export type AuthProvidersService = ReturnType<typeof createAuthProvidersService>
