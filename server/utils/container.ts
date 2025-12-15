import type { ImpersonationService } from '../features/admin/impersonation.service'
import type { AuthService } from '../features/auth/auth.service'
import type { EmailProvider } from '../features/email/email-provider.interface'
import type { EmailService } from '../features/email/email.service'
import type { OrganisationMembersService } from '../features/organisation-members/organisation-members.service'
import type { OrganisationsService } from '../features/organisations/organisations.service'
import type { ProfileService } from '../features/profile/profile.service'
import type { RbacService } from '../features/rbac/rbac.service'
import type { EventBus } from '../infrastructure/events'
import * as schema from '../database/schema'
import { createImpersonationService } from '../features/admin/impersonation.service'
import { createAuthService } from '../features/auth/auth.service'
import { createEmailService } from '../features/email/email.service'
import { createConsoleEmailProvider } from '../features/email/providers/console.provider'
import { createNodemailerProvider } from '../features/email/providers/nodemailer.provider'
import { createOrganisationMembersService } from '../features/organisation-members/organisation-members.service'
import { createOrganisationsService } from '../features/organisations/organisations.service'
import { createProfileService } from '../features/profile/profile.service'
import { createRbacService } from '../features/rbac/rbac.service'
import { getDatabase } from '../infrastructure/database/client'
import { createItemService } from '../infrastructure/database/item-service'
import { createEventBus } from '../infrastructure/events'
import { config } from './config'

// Lazy initialization helper
const lazy = <T>(factory: () => T): (() => T) => {
  let instance: T | undefined
  return () => {
    if (!instance) {
      instance = factory()
    }
    return instance
  }
}

// Email provider factory
const getEmailProvider = lazy((): EmailProvider => {
  if (config.email.provider === 'smtp') {
    if (!config.email.smtp.host) {
      console.warn('[Email] SMTP provider configured but no host found. Falling back to console.')
      return createConsoleEmailProvider()
    }
    return createNodemailerProvider({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      user: config.email.smtp.user || undefined,
      pass: config.email.smtp.pass || undefined,
      from: config.email.smtp.from,
    })
  }
  return createConsoleEmailProvider()
})

// Event Bus
const getEventBus = lazy(() => createEventBus())

// Services
const getEmailService = lazy(() =>
  createEmailService({
    provider: getEmailProvider(),
    config,
  }),
)

const getAuthService = lazy(() =>
  createAuthService({
    db: getDatabase('app'),
    emailService: getEmailService(),
    eventBus: getEventBus(),
  }),
)

const getImpersonationService = lazy(() =>
  createImpersonationService({
    db: getDatabase('app'),
  }),
)

// ItemService instances - one per table
const getUsersItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.users, tableName: 'users', eventBus: getEventBus() }),
)
const getOrganisationsItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.organisations, tableName: 'organisations', eventBus: getEventBus() }),
)
const getTeamsItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.teams, tableName: 'teams', eventBus: getEventBus() }),
)
const getOrganisationMembersItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.organisationMembers, tableName: 'organisationMembers', eventBus: getEventBus() }),
)
const getTeamMembersItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.teamMembers, tableName: 'teamMembers', eventBus: getEventBus() }),
)
const getSessionsItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.sessions, tableName: 'sessions', eventBus: getEventBus() }),
)
const getPasswordResetTokensItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.passwordResetTokens, tableName: 'passwordResetTokens', eventBus: getEventBus() }),
)
const getRolesItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.roles, tableName: 'roles', eventBus: getEventBus() }),
)
const getRolePermissionsItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.rolePermissions, tableName: 'rolePermissions', eventBus: getEventBus() }),
)
const getUserRolesItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.userRoles, tableName: 'userRoles', eventBus: getEventBus() }),
)

// RBAC Service (depends on ItemServices above)
const getRbacService = lazy(() =>
  createRbacService({
    rolesItemService: getRolesItemService(),
    rolePermissionsItemService: getRolePermissionsItemService(),
    userRolesItemService: getUserRolesItemService(),
  }),
)

// Organisation Members Service
const getOrganisationMembersService = lazy(() =>
  createOrganisationMembersService({
    organisationMembersItemService: getOrganisationMembersItemService(),
    usersItemService: getUsersItemService(),
    organisationsItemService: getOrganisationsItemService(),
    rolesItemService: getRolesItemService(),
    rbacService: getRbacService(),
  }),
)

// Profile Service
const getProfileService = lazy(() =>
  createProfileService({
    usersItemService: getUsersItemService(),
  }),
)

// Organisations Service
const getOrganisationsService = lazy(() =>
  createOrganisationsService({
    organisationsItemService: getOrganisationsItemService(),
    rolesItemService: getRolesItemService(),
    usersItemService: getUsersItemService(),
    organisationMembersService: getOrganisationMembersService(),
  }),
)

// Public exports
export const container = {
  get authService(): AuthService {
    return getAuthService()
  },
  get emailService(): EmailService {
    return getEmailService()
  },
  get impersonationService(): ImpersonationService {
    return getImpersonationService()
  },
  get rbacService(): RbacService {
    return getRbacService()
  },
  get organisationMembersService(): OrganisationMembersService {
    return getOrganisationMembersService()
  },
  get organisationsService(): OrganisationsService {
    return getOrganisationsService()
  },
  get profileService(): ProfileService {
    return getProfileService()
  },
  get eventBus(): EventBus {
    return getEventBus()
  },
  items: {
    get users() { return getUsersItemService() },
    get organisations() { return getOrganisationsItemService() },
    get teams() { return getTeamsItemService() },
    get organisationMembers() { return getOrganisationMembersItemService() },
    get teamMembers() { return getTeamMembersItemService() },
    get sessions() { return getSessionsItemService() },
    get passwordResetTokens() { return getPasswordResetTokensItemService() },
    get roles() { return getRolesItemService() },
    get rolePermissions() { return getRolePermissionsItemService() },
    get userRoles() { return getUserRolesItemService() },
  },
}
