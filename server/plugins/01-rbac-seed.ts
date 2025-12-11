import { seedRbac } from '../features/rbac/rbac.seed'
import { container } from '../utils/container'

export default defineNitroPlugin(async () => {
  console.log('[Plugin] Seeding RBAC roles...')

  await seedRbac({
    rolesItemService: container.items.roles,
    rolePermissionsItemService: container.items.rolePermissions,
  })
})
