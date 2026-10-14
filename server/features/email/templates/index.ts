import type { Storage } from 'unstorage'
import type { Locale } from '~~/shared/user-preferences.constants'
import { Buffer } from 'node:buffer'
import { Liquid } from 'liquidjs'
import { DEFAULT_LOCALE } from '~~/shared/user-preferences.constants'

const engine = new Liquid()

const readTemplate = async (storage: Storage, path: string): Promise<string | null> => {
  const raw = await storage.getItemRaw(path)
  if (raw === null || raw === undefined)
    return null
  if (typeof raw === 'string')
    return raw
  if (Buffer.isBuffer(raw))
    return raw.toString('utf-8')
  return new TextDecoder().decode(raw as ArrayBufferLike)
}

/**
 * Resolves `templates/<name>.<locale>.<ext>.liquid` for the recipient locale.
 * Falls back to the English base file `templates/<name>.<ext>.liquid` for
 * `en` or when the localized variant is missing. A missing base file is
 * still an error for the caller.
 */
const readLocalizedTemplate = async (
  storage: Storage,
  name: string,
  ext: 'html' | 'txt',
  locale: Locale,
): Promise<string | null> => {
  if (locale !== DEFAULT_LOCALE) {
    const localized = await readTemplate(storage, `templates/${name}.${locale}.${ext}.liquid`)
    if (localized)
      return localized
  }
  return readTemplate(storage, `templates/${name}.${ext}.liquid`)
}

const loadTemplatePair = async (name: string, locale: Locale) => {
  const storage = useStorage('assets:server')

  const [htmlTemplate, txtTemplate] = await Promise.all([
    readLocalizedTemplate(storage, name, 'html', locale),
    readLocalizedTemplate(storage, name, 'txt', locale),
  ])

  if (!htmlTemplate || !txtTemplate) {
    throw new Error(`Email templates not found: ${name}`)
  }

  return { htmlTemplate, txtTemplate }
}

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

export interface EmailChangeTemplateData {
  userName?: string
  confirmationLink: string
  expiresInHours: number
  siteName: string
}

export interface OrganisationInvitationTemplateData {
  organisationName: string
  inviterName?: string
  acceptLink: string
  expiresInDays: number
  siteName: string
}

const renderTemplate = async (name: string, locale: Locale, data: object) => {
  const { htmlTemplate, txtTemplate } = await loadTemplatePair(name, locale)

  const templateData = {
    ...data,
    year: new Date().getFullYear(),
  }

  const [html, text] = await Promise.all([
    engine.parseAndRender(htmlTemplate, templateData),
    engine.parseAndRender(txtTemplate, templateData),
  ])

  return { html, text }
}

export const passwordResetTemplate = async (data: PasswordResetTemplateData, locale: Locale = DEFAULT_LOCALE) => {
  const { html, text } = await renderTemplate('password-reset', locale, data)

  const subject = locale === 'de'
    ? `Passwort zurücksetzen - ${data.siteName}`
    : `Reset your password - ${data.siteName}`

  return { subject, html, text }
}

export const emailVerificationTemplate = async (data: EmailVerificationTemplateData, locale: Locale = DEFAULT_LOCALE) => {
  const { html, text } = await renderTemplate('email-verification', locale, data)

  const subject = locale === 'de'
    ? `Bestätige deine E-Mail-Adresse - ${data.siteName}`
    : `Verify your email - ${data.siteName}`

  return { subject, html, text }
}

export const emailChangeTemplate = async (data: EmailChangeTemplateData, locale: Locale = DEFAULT_LOCALE) => {
  const { html, text } = await renderTemplate('email-change', locale, data)

  const subject = locale === 'de'
    ? `Bestätige deine E-Mail-Änderung - ${data.siteName}`
    : `Confirm your email change - ${data.siteName}`

  return { subject, html, text }
}

export const organisationInvitationTemplate = async (data: OrganisationInvitationTemplateData, locale: Locale = DEFAULT_LOCALE) => {
  const { html, text } = await renderTemplate('organisation-invitation', locale, data)

  const subject = locale === 'de'
    ? `Du wurdest eingeladen, ${data.organisationName} beizutreten - ${data.siteName}`
    : `You've been invited to join ${data.organisationName} - ${data.siteName}`

  return { subject, html, text }
}
