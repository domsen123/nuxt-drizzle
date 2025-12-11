import type { PermissionsResponse } from '../types/permissions.types'

export const permissionsApi = {
  getMyPermissions: (): Promise<PermissionsResponse> =>
    $fetch('/api/me/permissions'),
}
