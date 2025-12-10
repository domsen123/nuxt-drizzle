import type { AuthService } from '../features/auth/auth.service'
import type { EmailProvider } from '../features/email/email-provider.interface'
import type { EmailService } from '../features/email/email.service'
import * as schema from '../database/schema'
import { createAuthService } from '../features/auth/auth.service'
import { createEmailService } from '../features/email/email.service'
import { createConsoleEmailProvider } from '../features/email/providers/console.provider'
import { createNodemailerProvider } from '../features/email/providers/nodemailer.provider'
import { getDatabase } from '../infrastructure/database/client'
import { createItemService } from '../infrastructure/database/item-service'
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
  }),
)

// ItemService instances - one per table
const getUsersItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.users }),
)
const getOrganisationsItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.organisations }),
)
const getTeamsItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.teams }),
)
const getOrganisationMembersItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.organisationMembers }),
)
const getTeamMembersItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.teamMembers }),
)
const getSessionsItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.sessions }),
)
const getPasswordResetTokensItemService = lazy(() =>
  createItemService({ db: getDatabase('app'), table: schema.passwordResetTokens }),
)

// Public exports
export const container = {
  get authService(): AuthService {
    return getAuthService()
  },
  get emailService(): EmailService {
    return getEmailService()
  },
  items: {
    get users() { return getUsersItemService() },
    get organisations() { return getOrganisationsItemService() },
    get teams() { return getTeamsItemService() },
    get organisationMembers() { return getOrganisationMembersItemService() },
    get teamMembers() { return getTeamMembersItemService() },
    get sessions() { return getSessionsItemService() },
    get passwordResetTokens() { return getPasswordResetTokensItemService() },
  },
}
