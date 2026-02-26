import { relations } from 'drizzle-orm'
import { blogPostTags } from './blog-post-tags'
import { blogPosts } from './blog-posts'
import { blogTags } from './blog-tags'
import { files } from './files'
import { organisationInvitations } from './organisation-invitations'
import { organisationMembers } from './organisation-members'
import { organisations } from './organisations'
import { passwordResetTokens } from './password-reset-tokens'
import { pendingEmailChanges } from './pending-email-changes'
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
  pendingEmailChanges: many(pendingEmailChanges),
  organisationMemberships: many(organisationMembers),
  teamMemberships: many(teamMembers),
  userRoles: many(userRoles),
  files: many(files),
  blogPosts: many(blogPosts),
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
  invitations: many(organisationInvitations),
}))

export const organisationInvitationsRelations = relations(organisationInvitations, ({ one }) => ({
  organisation: one(organisations, {
    fields: [organisationInvitations.organisationId],
    references: [organisations.id],
  }),
  role: one(roles, {
    fields: [organisationInvitations.roleId],
    references: [roles.id],
  }),
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

export const pendingEmailChangesRelations = relations(pendingEmailChanges, ({ one }) => ({
  user: one(users, {
    fields: [pendingEmailChanges.userId],
    references: [users.id],
  }),
}))

export const filesRelations = relations(files, ({ one, many }) => ({
  uploader: one(users, {
    fields: [files.uploadedBy],
    references: [users.id],
  }),
  parent: one(files, {
    fields: [files.parentId],
    references: [files.id],
    relationName: 'fileVariants',
  }),
  variants: many(files, {
    relationName: 'fileVariants',
  }),
}))

// Blog Relations
export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  postTags: many(blogPostTags),
}))

export const blogTagsRelations = relations(blogTags, ({ many }) => ({
  postTags: many(blogPostTags),
}))

export const blogPostTagsRelations = relations(blogPostTags, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostTags.postId],
    references: [blogPosts.id],
  }),
  tag: one(blogTags, {
    fields: [blogPostTags.tagId],
    references: [blogTags.id],
  }),
}))
