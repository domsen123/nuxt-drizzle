import type { AuthProvider } from '../../database/schema'
import type { DatabaseClient } from '../../infrastructure/database/client'
import type { EncryptedSecret } from './config-crypto.utils'
import { asc, eq } from 'drizzle-orm'
import { createError } from 'nuxt/server'
import { authProviders } from '../../database/schema'
import { encryptSecret } from './config-crypto.utils'

/** Providers that never appear in the public provider list. */
const INTERNAL_PROVIDERS = ['credentials', 'anonymous']

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

  const listProviders = async () => {
    return db
      .select()
      .from(authProviders)
      .orderBy(asc(authProviders.displayOrder))
  }

  /**
   * Write-only secrets never leave the server: `config.clientSecret` is
   * replaced by the flag `clientSecretSet`.
   */
  const maskProvider = (row: AuthProvider): AuthProvider => {
    const { clientSecret, ...rest } = row.config as Record<string, unknown>
    if (clientSecret === undefined && row.provider !== 'microsoft') {
      return row
    }

    return {
      ...row,
      config: { ...rest, clientSecretSet: Boolean(clientSecret) },
    }
  }

  const listProvidersMasked = async () => {
    const rows = await listProviders()
    return rows.map(maskProvider)
  }

  /** Enabled OAuth providers in display order, without any config. */
  const listPublicProviders = async () => {
    const rows = await listProviders()
    return rows
      .filter(row => row.enabled && !INTERNAL_PROVIDERS.includes(row.provider))
      .map(row => ({ provider: row.provider }))
  }

  const updateProvider = async (provider: string, data: { enabled: boolean, config: Record<string, unknown> }) => {
    let nextConfig = data.config

    if (provider === 'microsoft') {
      const [existing] = await db
        .select()
        .from(authProviders)
        .where(eq(authProviders.provider, provider))
        .limit(1)

      if (!existing) {
        throw new Error(`Provider "${provider}" not found`)
      }

      const existingConfig = existing.config as Record<string, unknown>
      const { clientSecret: incomingSecret, clientSecretSet: _flag, ...rest } = data.config

      // Write-only secret: a non-empty string is encrypted, anything else
      // keeps the stored triple.
      const secret: EncryptedSecret | undefined
        = typeof incomingSecret === 'string' && incomingSecret.trim().length > 0
          ? encryptSecret(incomingSecret.trim())
          : existingConfig.clientSecret as EncryptedSecret | undefined

      nextConfig = { ...rest, ...(secret ? { clientSecret: secret } : {}) }

      if (data.enabled && (!nextConfig.clientId || !nextConfig.tenant || !secret)) {
        throw createError({
          status: 400,
          statusText: 'Microsoft provider needs client ID, tenant and client secret before it can be enabled',
        })
      }
    }

    const [updated] = await db
      .update(authProviders)
      .set({
        enabled: data.enabled,
        config: nextConfig,
        updatedAt: new Date(),
      })
      .where(eq(authProviders.provider, provider))
      .returning()

    if (!updated) {
      throw new Error(`Provider "${provider}" not found`)
    }

    cache.delete(provider)

    return updated
  }

  return {
    getProvider,
    getAnonymousConfig,
    listProviders,
    listProvidersMasked,
    listPublicProviders,
    maskProvider,
    updateProvider,
  }
}

export type AuthProvidersService = ReturnType<typeof createAuthProvidersService>
