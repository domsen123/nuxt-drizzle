import type { Config } from '../../utils/config'
import type { EmailProvider } from './email-provider.interface'
import type { PasswordResetTemplateData } from './templates'
import { passwordResetTemplate } from './templates'

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
  ) => {
    const template = await passwordResetTemplate({
      ...data,
      siteName: config.site.name,
    })

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
  }
}

export type EmailService = ReturnType<typeof createEmailService>
