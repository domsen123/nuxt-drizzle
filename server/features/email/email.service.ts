import type { Locale } from '~~/shared/user-preferences.constants'
import type { Config } from '../../utils/config'
import type { EmailProvider } from './email-provider.interface'
import type { EmailChangeTemplateData, EmailVerificationTemplateData, OrganisationInvitationTemplateData, PasswordResetTemplateData } from './templates'
import { DEFAULT_LOCALE } from '~~/shared/user-preferences.constants'
import { emailChangeTemplate, emailVerificationTemplate, organisationInvitationTemplate, passwordResetTemplate } from './templates'

export interface CreateEmailServiceDeps {
  provider: EmailProvider
  config: Config
}

export const createEmailService = ({ provider, config }: CreateEmailServiceDeps) => {
  const getDefaultFrom = () => {
    try {
      const hostname = new URL(config.site.url).hostname
      return `${config.site.name} <noreply@${hostname}>`
    }
    catch {
      return `${config.site.name} <noreply@example.com>`
    }
  }

  const sendPasswordReset = async (
    to: string,
    data: Omit<PasswordResetTemplateData, 'siteName'>,
    locale: Locale = DEFAULT_LOCALE,
  ) => {
    const template = await passwordResetTemplate({
      ...data,
      siteName: config.site.name,
    }, locale)

    return provider.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      from: getDefaultFrom(),
    })
  }

  const sendEmailVerification = async (
    to: string,
    data: Omit<EmailVerificationTemplateData, 'siteName'>,
    locale: Locale = DEFAULT_LOCALE,
  ) => {
    const template = await emailVerificationTemplate({
      ...data,
      siteName: config.site.name,
    }, locale)

    return provider.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      from: getDefaultFrom(),
    })
  }

  const sendEmailChangeConfirmation = async (
    to: string,
    data: Omit<EmailChangeTemplateData, 'siteName'>,
    locale: Locale = DEFAULT_LOCALE,
  ) => {
    const template = await emailChangeTemplate({
      ...data,
      siteName: config.site.name,
    }, locale)

    return provider.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      from: getDefaultFrom(),
    })
  }

  const sendOrganisationInvitation = async (
    to: string,
    data: Omit<OrganisationInvitationTemplateData, 'siteName'>,
    locale: Locale = DEFAULT_LOCALE,
  ) => {
    const template = await organisationInvitationTemplate({
      ...data,
      siteName: config.site.name,
    }, locale)

    return provider.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      from: getDefaultFrom(),
    })
  }

  return {
    sendPasswordReset,
    sendEmailVerification,
    sendEmailChangeConfirmation,
    sendOrganisationInvitation,
  }
}

export type EmailService = ReturnType<typeof createEmailService>
