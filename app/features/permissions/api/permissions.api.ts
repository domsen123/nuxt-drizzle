import type { PermissionsResponse } from '../types/permissions.types'

/**
 * Permissions API wrapper that uses useRequestFetch for SSR cookie forwarding.
 * Must be called within a composable or component setup context.
 */
export const usePermissionsApi = () => {
  const fetch = useRequestFetch()

  return {
    getMyPermissions: (): Promise<PermissionsResponse> =>
      fetch('/api/me/permissions'),
  }
}
