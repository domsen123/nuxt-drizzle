import { createError, defineEventHandler, getRouterParam, readBody } from 'nuxt/server'
import * as z from 'zod'
import { requireSuperAdmin } from '~~/server/features/rbac/rbac.guard'
import { container } from '~~/server/utils/container'

const TENANT_PATTERN = /^(?:common|organizations|consumers|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

const genericSchema = z.object({
  enabled: z.boolean(),
  config: z.record(z.string(), z.unknown()),
})

const microsoftSchema = z.object({
  enabled: z.boolean(),
  config: z.object({
    clientId: z.string().trim().min(1),
    tenant: z.string().trim().regex(TENANT_PATTERN, 'Tenant must be common, organizations, consumers or a tenant GUID'),
    clientSecret: z.string().trim().min(1).optional(),
  }),
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)

  const provider = getRouterParam(event, 'provider', { decode: true })

  if (!provider) {
    throw createError({
      status: 400,
      statusText: 'Provider name is required',
    })
  }

  const body = await readBody(event)
  const schema = provider === 'microsoft' ? microsoftSchema : genericSchema
  const data = schema.parse(body)

  const updated = await container.authProvidersService.updateProvider(provider, data)

  // Secrets are write-only: mask the stored triple in the response.
  return { provider: container.authProvidersService.maskProvider(updated) }
})
