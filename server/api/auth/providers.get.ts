import { defineEventHandler } from 'nuxt/server'
import { container } from '~~/server/utils/container'

/**
 * Public endpoint for the auth pages: enabled OAuth providers in display
 * order plus the registration mode. Never exposes provider configs.
 */
export default defineEventHandler(async () => {
  const [providers, mode] = await Promise.all([
    container.authProvidersService.listPublicProviders(),
    container.registrationPolicyService.getMode(),
  ])

  return {
    providers,
    registration: { mode },
  }
})
