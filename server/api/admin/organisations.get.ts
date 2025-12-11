import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

export default defineEventHandler(async (event) => {
  // Only platform admins can access
  await requireSuperAdmin(event)

  // Fetch all organisations (newest first)
  const organisations = await container.items.organisations.findMany({
    sort: ['-createdAt'],
  })

  return {
    organisations,
    total: organisations.length,
  }
})
