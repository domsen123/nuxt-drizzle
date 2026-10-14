import { join } from 'node:path'
import process from 'node:process'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { ulid } from 'ulid'
import { appSettings, authProviders } from '../database/schema'
import { REGISTRATION_SETTING_KEY } from '../features/auth/registration-policy.service'
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

// ─── Auth Providers Seed ────────────────────────────────────────────────────
const DEFAULT_AUTH_PROVIDERS = [
  { provider: 'credentials', enabled: true, config: {}, displayOrder: 0 },
  { provider: 'anonymous', enabled: false, config: { sessionDurationDays: 30 }, displayOrder: 1 },
  { provider: 'microsoft', enabled: false, config: {}, displayOrder: 2 },
]

// Per-provider upsert: existing databases pick up newly added providers
// without their stored rows being touched.
const seedAuthProviders = async () => {
  console.log('[Init] Seeding auth providers...')
  const db = getDatabase('app')

  for (const row of DEFAULT_AUTH_PROVIDERS) {
    await db
      .insert(authProviders)
      .values({ id: ulid(), ...row })
      .onConflictDoNothing({ target: authProviders.provider })
  }

  console.log('[Init] Auth providers seeded')
}

// ─── App Settings Seed ──────────────────────────────────────────────────────
const seedAppSettings = async () => {
  console.log('[Init] Seeding app settings...')
  const db = getDatabase('app')

  await db
    .insert(appSettings)
    .values({
      id: ulid(),
      key: REGISTRATION_SETTING_KEY,
      value: { mode: 'open' },
    })
    .onConflictDoNothing({ target: appSettings.key })

  console.log('[Init] App settings seeded')
}

// ─── Main Plugin ─────────────────────────────────────────────────────────────
export default defineNitroPlugin(async () => {
  // The prerenderer boots a full Nitro server at build time. Migrating and
  // seeding from there would mutate whichever database the build machine points
  // at, so initialisation only belongs to a real server start.
  if (import.meta.prerender)
    return

  await runMigration()
  await runRbacSeed()
  await seedAuthProviders()
  await seedAppSettings()
  registerRbacListeners()
  registerEventBusLogging()
  await seedAdmin()
  console.log('[Init] Initialization complete')
})
