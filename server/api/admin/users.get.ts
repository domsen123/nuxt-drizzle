import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const query = getQuery(event)
  const search = query.search as string | undefined

  // Build filter for search (name or email)
  const filter = search
    ? {
        _or: [
          { name: { _ilike: `%${search}%` } },
          { email: { _ilike: `%${search}%` } },
        ],
      }
    : undefined

  const users = await container.items.users.findMany({
    filter,
    sort: ['-createdAt'],
    fields: ['id', 'email', 'name', 'emailVerified', 'createdAt', 'updatedAt'],
  })

  return {
    users,
    total: users.length,
  }
})
