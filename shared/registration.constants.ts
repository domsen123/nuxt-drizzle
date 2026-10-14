export const REGISTRATION_MODES = ['open', 'invite_only'] as const
export type RegistrationMode = typeof REGISTRATION_MODES[number]

export const DEFAULT_REGISTRATION_MODE: RegistrationMode = 'open'
