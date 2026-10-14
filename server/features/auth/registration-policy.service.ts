import type { RegistrationMode } from '~~/shared/registration.constants'
import type { DatabaseClient } from '../../infrastructure/database/client'
import type { AppSettingsService } from '../admin/app-settings.service'
import { and, eq, gt } from 'drizzle-orm'
import { DEFAULT_REGISTRATION_MODE } from '~~/shared/registration.constants'
import { organisationInvitations } from '../../database/schema'

export const REGISTRATION_SETTING_KEY = 'auth.registration'

export interface CreateRegistrationPolicyServiceDeps {
  db: DatabaseClient
  appSettingsService: AppSettingsService
}

export const createRegistrationPolicyService = ({ db, appSettingsService }: CreateRegistrationPolicyServiceDeps) => {
  const getMode = async (): Promise<RegistrationMode> => {
    const setting = await appSettingsService.getSetting<{ mode?: string }>(
      REGISTRATION_SETTING_KEY,
      { mode: DEFAULT_REGISTRATION_MODE },
    )
    return setting.mode === 'invite_only' ? 'invite_only' : DEFAULT_REGISTRATION_MODE
  }

  const setMode = async (mode: RegistrationMode): Promise<void> => {
    await appSettingsService.setSetting(REGISTRATION_SETTING_KEY, { mode })
  }

  /**
   * Reports whether the email may create a new account. With `invite_only`,
   * an open (not accepted, not expired) organisation invitation counts as
   * invited. Accepted invitations are deleted, so existence plus a future
   * expiry is the whole check.
   */
  const canRegister = async (email: string): Promise<boolean> => {
    const mode = await getMode()
    if (mode === 'open') {
      return true
    }

    const [invitation] = await db
      .select({ id: organisationInvitations.id })
      .from(organisationInvitations)
      .where(and(
        eq(organisationInvitations.email, email.toLowerCase().trim()),
        gt(organisationInvitations.expiresAt, new Date()),
      ))
      .limit(1)

    return Boolean(invitation)
  }

  return {
    getMode,
    setMode,
    canRegister,
  }
}

export type RegistrationPolicyService = ReturnType<typeof createRegistrationPolicyService>
