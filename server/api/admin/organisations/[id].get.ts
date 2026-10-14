import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const id = getRouterParam(event, 'id', { decode: true })

  if (!id) {
    throw createError({
      status: 400,
      statusText: 'Organisation ID is required',
    })
  }

  const organisation = await container.items.organisations.findOne({
    id: { _eq: id },
  })

  if (!organisation) {
    throw createError({
      status: 404,
      statusText: 'Organisation not found',
    })
  }

  return {
    organisation,
  }
})
