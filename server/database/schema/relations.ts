import { relations } from 'drizzle-orm'
import { organisationMembers } from './organisation-members'
import { organisations } from './organisations'
import { passwordResetTokens } from './password-reset-tokens'
import { rolePermissions } from './role-permissions'
import { roles } from './roles'
import { sessions } from './sessions'
import { teamMembers } from './team-members'
import { teams } from './teams'
import { userRoles } from './user-roles'
import { users } from './users'

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  passwordResetTokens: many(passwordResetTokens),
  organisationMemberships: many(organisationMembers),
  teamMemberships: many(teamMembers),
  userRoles: many(userRoles),
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

export const organisationsRelations = relations(organisations, ({ many }) => ({
  teams: many(teams),
  members: many(organisationMembers),
  customRoles: many(roles),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [teams.organisationId],
    references: [organisations.id],
  }),
  members: many(teamMembers),
}))

export const organisationMembersRelations = relations(organisationMembers, ({ one }) => ({
  organisation: one(organisations, {
    fields: [organisationMembers.organisationId],
    references: [organisations.id],
  }),
  user: one(users, {
    fields: [organisationMembers.userId],
    references: [users.id],
  }),
}))

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}))

// RBAC Relations
export const rolesRelations = relations(roles, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [roles.organisationId],
    references: [organisations.id],
  }),
  permissions: many(rolePermissions),
  userRoles: many(userRoles),
}))

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}))
