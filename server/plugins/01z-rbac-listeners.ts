import { container } from '../utils/container'

export default defineNitroPlugin(() => {
  const { eventBus, rbacService } = container

  // Listen for user registration to assign default global role
  eventBus.on('auth:user-registered', async ({ userId }) => {
    try {
      const defaultRole = await rbacService.getDefaultRole('global')

      if (!defaultRole) {
        console.warn('[RBAC Listener] No default global role found')
        return
      }

      await rbacService.assignRole({
        userId,
        roleId: defaultRole.id,
        scope: 'global',
      })

      console.log(`[RBAC Listener] Assigned default global role "${defaultRole.name}" to user ${userId}`)
    }
    catch (error) {
      console.error('[RBAC Listener] Failed to assign default role:', error)
    }
  })

  console.log('[Plugin] RBAC event listeners registered')
})
