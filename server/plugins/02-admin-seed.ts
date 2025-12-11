import { getSystemRoleId } from '../features/rbac/rbac.seed'
import { container } from '../utils/container'

const DEFAULT_ADMIN = {
  email: 'admin@example.com',
  password: 'passw0rd',
  name: 'Admin',
}

const assignSuperAdminRole = async (userId: string) => {
  // Find Super Admin role
  const superAdminRoleId = await getSystemRoleId(
    container.items.roles,
    'Super Admin',
    'global',
  )

  if (!superAdminRoleId) {
    console.error('[Admin Seed] Super Admin role not found - ensure RBAC seeding runs first')
    return
  }

  // Use rbacService.assignRole (handles idempotency)
  await container.rbacService.assignRole({
    userId,
    roleId: superAdminRoleId,
    scope: 'global',
    scopeId: null,
  })

  console.log('[Admin Seed] Assigned Super Admin role to admin user')
}

export default defineNitroPlugin(async () => {
  console.log('[Plugin] Seeding default admin user...')

  // Check if admin already exists
  const existingUser = await container.items.users.findOne({
    email: DEFAULT_ADMIN.email,
  })

  let userId: string

  if (existingUser) {
    console.log('[Admin Seed] Admin user already exists, skipping creation')
    userId = existingUser.id
  }
  else {
    // Create admin user using authService.register()
    const { user } = await container.authService.register(
      DEFAULT_ADMIN.email,
      DEFAULT_ADMIN.password,
      DEFAULT_ADMIN.name,
    )
    console.log(`[Admin Seed] Created admin user: ${user.email}`)
    userId = user.id
  }

  // Assign Super Admin role
  await assignSuperAdminRole(userId)
})
