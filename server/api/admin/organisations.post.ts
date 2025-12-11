import * as z from 'zod'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const body = await readBody(event)
  const data = schema.parse(body)

  // Check if slug already exists
  const existing = await container.items.organisations.findOne({
    slug: { _eq: data.slug },
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'An organisation with this slug already exists',
    })
  }

  const organisation = await container.items.organisations.create(data)

  return {
    organisation,
  }
})
