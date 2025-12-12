import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const organisationId = getRouterParam(event, 'id')
  const teamId = getRouterParam(event, 'teamId')
  const userId = getRouterParam(event, 'userId')

  if (!organisationId) {
    throw createError({ statusCode: 400, statusMessage: 'Organisation ID is required' })
  }
  if (!teamId) {
    throw createError({ statusCode: 400, statusMessage: 'Team ID is required' })
  }
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
  }

  // Verify team exists and belongs to organisation
  const team = await container.items.teams.findOne({
    _and: [
      { id: { _eq: teamId } },
      { organisationId: { _eq: organisationId } },
    ],
  })

  if (!team) {
    throw createError({ statusCode: 404, statusMessage: 'Team not found' })
  }

  // Find team member
  const member = await container.items.teamMembers.findOne({
    _and: [
      { teamId: { _eq: teamId } },
      { userId: { _eq: userId } },
    ],
  })

  if (!member) {
    throw createError({ statusCode: 404, statusMessage: 'Team member not found' })
  }

  // Delete team member
  await container.items.teamMembers.delete(member.id)

  return { success: true }
})
