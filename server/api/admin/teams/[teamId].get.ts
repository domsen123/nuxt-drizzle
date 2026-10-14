import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const teamId = getRouterParam(event, 'teamId', { decode: true })

  if (!teamId) {
    throw createError({ status: 400, statusText: 'Team ID is required' })
  }

  const team = await container.items.teams.readOne(teamId)

  if (!team) {
    throw createError({ status: 404, statusText: 'Team not found' })
  }

  // Get organisation data
  const organisation = await container.items.organisations.readOne(team.organisationId)

  return {
    team: {
      ...team,
      organisation: {
        id: team.organisationId,
        name: organisation?.name ?? 'Unknown',
      },
    },
  }
})
