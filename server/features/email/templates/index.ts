import { Liquid } from 'liquidjs'

const engine = new Liquid()

export interface PasswordResetTemplateData {
  userName?: string
  resetLink: string
  expiresInHours: number
  siteName: string
}

export interface EmailVerificationTemplateData {
  userName?: string
  verificationLink: string
  expiresInHours: number
  siteName: string
}

export const passwordResetTemplate = async (data: PasswordResetTemplateData) => {
  const storage = useStorage('assets:server')

  const [htmlTemplate, txtTemplate] = await Promise.all([
    storage.getItem<string>('templates/password-reset.html.liquid'),
    storage.getItem<string>('templates/password-reset.txt.liquid'),
  ])

  if (!htmlTemplate || !txtTemplate) {
    throw new Error('Email templates not found')
  }

  const templateData = {
    ...data,
    year: new Date().getFullYear(),
  }

  const [html, text] = await Promise.all([
    engine.parseAndRender(htmlTemplate, templateData),
    engine.parseAndRender(txtTemplate, templateData),
  ])

  return {
    subject: `Reset your password - ${data.siteName}`,
    html,
    text,
  }
}

export const emailVerificationTemplate = async (data: EmailVerificationTemplateData) => {
  const storage = useStorage('assets:server')

  const [htmlTemplate, txtTemplate] = await Promise.all([
    storage.getItem<string>('templates/email-verification.html.liquid'),
    storage.getItem<string>('templates/email-verification.txt.liquid'),
  ])

  if (!htmlTemplate || !txtTemplate) {
    throw new Error('Email verification templates not found')
  }

  const templateData = {
    ...data,
    year: new Date().getFullYear(),
  }

  const [html, text] = await Promise.all([
    engine.parseAndRender(htmlTemplate, templateData),
    engine.parseAndRender(txtTemplate, templateData),
  ])

  return {
    subject: `Verify your email - ${data.siteName}`,
    html,
    text,
  }
}
