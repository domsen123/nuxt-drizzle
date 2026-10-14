import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const appSettings = pgTable('app_settings', {
  id: text('id').primaryKey(), // ULID
  key: text('key').notNull().unique(),
  value: jsonb('value').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type AppSetting = typeof appSettings.$inferSelect
export type NewAppSetting = typeof appSettings.$inferInsert
