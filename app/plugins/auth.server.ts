import type { SessionResponse } from '~/features/auth/types/auth.types'
import type { PermissionsResponse } from '~/features/permissions/types/permissions.types'

/**
 * Server-only plugin that pre-fetches auth state during SSR.
 * This allows middleware to access auth state without using Pinia-Colada,
 * which would cause inject() warnings outside of Vue component context.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  const fetch = useRequestFetch()

  try {
    const session = await fetch<SessionResponse>('/api/auth/session')

    // Only fetch permissions if authenticated
    let permissions: PermissionsResponse | null = null
    if (session?.user) {
      permissions = await fetch<PermissionsResponse>('/api/me/permissions').catch(() => null)
    }

    // Store in payload for hydration to client
    nuxtApp.payload.auth = {
      user: session?.user ?? null,
      impersonation: session?.impersonation ?? null,
      permissions: permissions ?? { userId: '', global: [], organisations: {}, teams: {} },
    }
  }
  catch {
    nuxtApp.payload.auth = {
      user: null,
      impersonation: null,
      permissions: { userId: '', global: [], organisations: {}, teams: {} },
    }
  }
})
