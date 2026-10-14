import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const organisationId = getRouterParam(event, 'id', { decode: true })
  const invitationId = getRouterParam(event, 'invitationId', { decode: true })

  if (!organisationId) {
    throw createError({ status: 400, statusText: 'Organisation ID is required' })
  }
  if (!invitationId) {
    throw createError({ status: 400, statusText: 'Invitation ID is required' })
  }

  return container.organisationInvitationsService.revokeInvitation(invitationId)
})
