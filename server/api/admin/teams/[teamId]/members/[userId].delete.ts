import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const teamId = getRouterParam(event, 'teamId', { decode: true })
  const userId = getRouterParam(event, 'userId', { decode: true })

  if (!teamId) {
    throw createError({ status: 400, statusText: 'Team ID is required' })
  }
  if (!userId) {
    throw createError({ status: 400, statusText: 'User ID is required' })
  }

  // Verify team exists
  const team = await container.items.teams.readOne(teamId)

  if (!team) {
    throw createError({ status: 404, statusText: 'Team not found' })
  }

  // Find team member
  const member = await container.items.teamMembers.findOne({
    _and: [
      { teamId: { _eq: teamId } },
      { userId: { _eq: userId } },
    ],
  })

  if (!member) {
    throw createError({ status: 404, statusText: 'Team member not found' })
  }

  // Delete team member
  await container.items.teamMembers.delete(member.id)

  return { success: true }
})
