import { z } from 'zod'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

const addMemberSchema = z.object({
  userId: z.string().trim().min(1, 'User ID is required'),
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const organisationId = getRouterParam(event, 'id')
  const teamId = getRouterParam(event, 'teamId')

  if (!organisationId) {
    throw createError({ statusCode: 400, statusMessage: 'Organisation ID is required' })
  }
  if (!teamId) {
    throw createError({ statusCode: 400, statusMessage: 'Team ID is required' })
  }

  const body = await readBody(event)
  const parsed = addMemberSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Invalid input',
    })
  }

  const { userId } = parsed.data

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

  // Verify user is a member of the organisation
  const orgMember = await container.items.organisationMembers.findOne({
    _and: [
      { organisationId: { _eq: organisationId } },
      { userId: { _eq: userId } },
    ],
  })

  if (!orgMember) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User must be a member of the organisation to join a team',
    })
  }

  // Check if already a team member
  const existingMember = await container.items.teamMembers.findOne({
    _and: [
      { teamId: { _eq: teamId } },
      { userId: { _eq: userId } },
    ],
  })

  if (existingMember) {
    throw createError({ statusCode: 409, statusMessage: 'User is already a member of this team' })
  }

  // Get user details
  const user = await container.items.users.readOne(userId)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  // Create team member
  const member = await container.items.teamMembers.create({
    teamId,
    userId,
    role: 'member',
  })

  return {
    member: {
      id: member.id,
      teamId: member.teamId,
      userId: member.userId,
      role: member.role,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    },
  }
})
