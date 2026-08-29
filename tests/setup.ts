import { sql } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import { afterEach } from 'vitest'

import { getDatabase } from '../server/infrastructure/database/client'

// Nitro auto-imports `createError` and `defineEventHandler` into server code.
// Plain node tests have no auto-imports, so provide them as globals.
globalThis.createError = createError
globalThis.defineEventHandler = defineEventHandler

// Clean tables between tests
export const cleanDatabase = async () => {
  const db = getDatabase('app')
  await db.execute(sql`TRUNCATE TABLE team_members, organisation_members, teams, organisations, password_reset_tokens, sessions, users CASCADE`)
}

afterEach(async () => {
  await cleanDatabase()
})
