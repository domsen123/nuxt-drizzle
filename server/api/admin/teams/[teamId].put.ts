import { createError, defineEventHandler, getRouterParam, readBody } from 'nuxt/server'
import * as z from 'zod'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

const updateTeamSchema = z.object({
  name: z.string().trim().min(1, 'Team name is required').max(100, 'Team name must be 100 characters or less'),
})

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

  const body = await readBody(event)
  const parsed = updateTeamSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      status: 400,
      statusText: parsed.error.issues[0]?.message ?? 'Invalid input',
    })
  }

  const team = await container.items.teams.update(teamId, {
    name: parsed.data.name,
    updatedAt: new Date(),
  })

  return { team }
})
