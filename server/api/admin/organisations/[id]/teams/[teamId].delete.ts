import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const id = getRouterParam(event, 'id')
  const teamId = getRouterParam(event, 'teamId')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Organisation ID is required' })
  }
  if (!teamId) {
    throw createError({ statusCode: 400, statusMessage: 'Team ID is required' })
  }

  // Verify team exists and belongs to the organisation
  const existingTeam = await container.items.teams.findOne({
    _and: [
      { id: { _eq: teamId } },
      { organisationId: { _eq: id } },
    ],
  })

  if (!existingTeam) {
    throw createError({ statusCode: 404, statusMessage: 'Team not found' })
  }

  await container.items.teams.delete(teamId)

  return { success: true }
})
