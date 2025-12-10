import { relations } from 'drizzle-orm'
import { passwordResetTokens } from './password-reset-tokens'
import { sessions } from './sessions'
import { users } from './users'

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  passwordResetTokens: many(passwordResetTokens),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}))
