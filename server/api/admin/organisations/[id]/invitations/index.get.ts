import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const organisationId = getRouterParam(event, 'id', { decode: true })
  if (!organisationId) {
    throw createError({ status: 400, statusText: 'Organisation ID is required' })
  }

  // Verify organisation exists
  const organisation = await container.items.organisations.readOne(organisationId)
  if (!organisation) {
    throw createError({ status: 404, statusText: 'Organisation not found' })
  }

  return container.organisationInvitationsService.listByOrganisation(organisationId)
})
