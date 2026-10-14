import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const teamId = getRouterParam(event, 'teamId', { decode: true })

  if (!teamId) {
    throw createError({ status: 400, statusText: 'Team ID is required' })
  }

  // Verify team exists
  const existingTeam = await container.items.teams.readOne(teamId)

  if (!existingTeam) {
    throw createError({ status: 404, statusText: 'Team not found' })
  }

  await container.items.teams.delete(teamId)

  return { success: true }
})
