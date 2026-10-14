import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'

export const userIdentities = pgTable('user_identities', {
  id: text('id').primaryKey(), // ULID
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(), // `sub` from the IdP userinfo response
  email: text('email'), // email as reported by the IdP on the last login (audit/display)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex('user_identities_provider_account_idx').on(table.provider, table.providerAccountId),
  index('user_identities_user_id_idx').on(table.userId),
])

export type UserIdentity = typeof userIdentities.$inferSelect
export type NewUserIdentity = typeof userIdentities.$inferInsert
