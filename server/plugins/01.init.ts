import { join } from 'node:path'
import process from 'node:process'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { getSystemRoleId, seedRbac } from '../features/rbac/rbac.seed'
import { getDatabase } from '../infrastructure/database/client'
import { container } from '../utils/container'

// ─── Migration ───────────────────────────────────────────────────────────────
const runMigration = async () => {
  console.log('[Init] Running migration...')
  const db = getDatabase('migration')
  const migrationsFolder = join(process.cwd(), 'server/database/migrations')
  await migrate(db, { migrationsFolder })
  console.log('[Init] Migration completed')
}

// ─── RBAC Seed ───────────────────────────────────────────────────────────────
const runRbacSeed = async () => {
  console.log('[Init] Seeding RBAC...')
  await seedRbac({
    rolesItemService: container.items.roles,
    rolePermissionsItemService: container.items.rolePermissions,
  })
  console.log('[Init] RBAC completed')
}

// ─── RBAC Listeners ──────────────────────────────────────────────────────────
const registerRbacListeners = () => {
  const { eventBus, rbacService } = container

  eventBus.on('auth:user-registered', async ({ userId }) => {
    try {
      const defaultRole = await rbacService.getDefaultRole('global')
      if (!defaultRole)
        return
      await rbacService.assignRole({ userId, roleId: defaultRole.id, scope: 'global' })
    }
    catch (error) {
      console.error('[RBAC] Failed to assign default role:', error)
    }
  })

  console.log('[Init] RBAC listeners registered')
}

// ─── Event Bus ───────────────────────────────────────────────────────────────
const registerEventBusLogging = () => {
  if (import.meta.dev) {
    container.eventBus.on('*', (type, payload) => {
      console.log(`[EventBus] ${String(type)}`, payload)
    })
  }
}

// ─── Admin Seed ──────────────────────────────────────────────────────────────
const DEFAULT_ADMIN = {
  email: 'admin@example.com',
  password: 'passw0rd',
  name: 'Admin',
}

const seedAdmin = async () => {
  console.log('[Init] Seeding admin user...')

  const existingUser = await container.items.users.findOne({
    email: DEFAULT_ADMIN.email,
  })

  let userId: string

  if (existingUser) {
    userId = existingUser.id
  }
  else {
    const { user } = await container.authService.register(
      DEFAULT_ADMIN.email,
      DEFAULT_ADMIN.password,
      DEFAULT_ADMIN.name,
      { skipVerification: true },
    )
    console.log(`[Init] Created admin user: ${user.email}`)
    userId = user.id
  }

  const superAdminRoleId = await getSystemRoleId(
    container.items.roles,
    'Super Admin',
    'global',
  )

  if (!superAdminRoleId) {
    console.error('[Init] Super Admin role not found')
    return
  }

  await container.rbacService.assignRole({
    userId,
    roleId: superAdminRoleId,
    scope: 'global',
    scopeId: null,
  })

  console.log('[Init] Admin seed completed')
}

// ─── Main Plugin ─────────────────────────────────────────────────────────────
export default defineNitroPlugin(async () => {
  await runMigration()
  await runRbacSeed()
  registerRbacListeners()
  registerEventBusLogging()
  await seedAdmin()
  console.log('[Init] Initialization complete')
})
