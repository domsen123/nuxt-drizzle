import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token', { decode: true })

  if (!token) {
    throw createError({ status: 400, statusText: 'Token is required' })
  }

  const validation = await container.organisationInvitationsService.validateInvitation(token)

  return validation
})
